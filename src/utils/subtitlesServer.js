// src/utils/subtitlesServer.js
const http = require('http');
const { v4: uuidv4 } = require('uuid');

let subtitlesStore = {};
const expirationTime = 3600000 * 3; // 3 hours in milliseconds

const startSubtitlesServer = (port) => {
  const server = http.createServer((req, res) => {
    const subtitleId = req.url.slice(1); // Remove leading '/'
    const subtitleEntry = subtitlesStore[subtitleId];
    if (subtitleEntry) {
      subtitleEntry.lastAccessed = Date.now(); // Update access time
      res.writeHead(200, {
        'Content-Type': 'text/vtt;charset=UTF-8',
        'Content-Disposition': `attachment; filename="${subtitleId}.vtt"`
      });
      res.end(subtitleEntry.subtitle);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`Subtitles server running on port ${port}`);
  });

  const cleanUp = () => {
    const currentTime = Date.now();
    Object.keys(subtitlesStore).forEach(subtitleId => {
      if (currentTime - subtitlesStore[subtitleId].lastAccessed > expirationTime) {
        delete subtitlesStore[subtitleId];
      }
    });
  };

  setInterval(cleanUp, expirationTime); // Regular cleanup every 3 hours

  return {
    storeSubtitle: (subtitle) => {
      const subtitleId = uuidv4();
      subtitlesStore[subtitleId] = {
        subtitle: subtitle,
        lastAccessed: Date.now()
      };
      return `http://localhost:${port}/${subtitleId}`;
    },
    cleanUp: cleanUp
  };
};

module.exports = startSubtitlesServer;
