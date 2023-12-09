const http = require('http');
const { v4: uuidv4 } = require('uuid');

let subtitlesStore = {};

const startSubtitlesServer = (port) => {
  const server = http.createServer((req, res) => {
    const subtitleId = req.url.slice(1); // Remove leading '/'
    const subtitle = subtitlesStore[subtitleId];
    if (subtitle) {
      res.writeHead(200, {
        'Content-Type': 'text/vtt;charset=UTF-8',
        'Content-Disposition': `attachment; filename="${subtitleId}.vtt"`
      });
      res.end(subtitle);
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`Subtitles server running on port ${port}`);
  });

  return {
    storeSubtitle: (subtitle) => {
      const subtitleId = uuidv4();
      subtitlesStore[subtitleId] = subtitle;
      return `http://localhost:${port}/${subtitleId}`;
    },
    cleanUp: () => {
      subtitlesStore = {};
    }
  };
};

module.exports = startSubtitlesServer;
