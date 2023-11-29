const { addonBuilder } = require("stremio-addon-sdk")
const fetchSubtitles = require("./fetchSubtitles")
var needle = require('needle')
const sub2vtt = require('./sub2vtt')
const http = require('http');
const { v4: uuidv4 } = require('uuid')
const imdbScraper = require('easyimdbscraper')

// Store subtitles temporarily
let subtitlesStore = {};

// HTTP server to serve subtitles
const server = http.createServer((req, res) => {
  const subtitleId = req.url.slice(1); // Remove leading '/'
  const subtitle = subtitlesStore[subtitleId];
  if (subtitle) {
    res.writeHead(200, { 
		'Content-Type': 'text/vtt;charset=UTF-8',
		'Content-Disposition': `attachment; filename="${subtitleId}.vtt"` // Trigger file download
	  });
    res.end(subtitle);
    // Optional: delete subtitle after serving
    delete subtitlesStore[subtitleId];
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Choose an appropriate port
const port = 7000; // Example port
server.listen(port);

// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = {
	"id": "community.kitsunekkosubtitles",
	"version": "0.0.1",
	"catalogs": [],
	"resources": [
		"subtitles"
	],
	"types": [
		"movie",
		"series"
	],
	"name": "Kitsunekko Subtitles",
	"description": "A Stremio addon that provides Japanese subtitles for anime by sourcing them directly from Kitsunekko"
}
const builder = new addonBuilder(manifest)

builder.defineSubtitlesHandler(async ({ type, id }) => {
	if (type !== 'movie' && type !== 'series') return { subtitles: [] };
  
	const regex = /^(\w+):(\d+):(\d+)$/;
	const result = id.match(regex);
	const itemImdbId = result[1];
	const season = result[2];
	const episode = result[3];
	const addonEndpoint = 'https://v3-cinemeta.strem.io/meta';
	const languages = ['en', 'ja']

	const fetchAndProcessSubtitles = async (language) => {
		try {
			let name = ""
			if (language === 'ja') {
				const meta = await imdbScraper.getInfoByID(itemImdbId)
				name = meta.title
			} else if (language === 'en') {
				const metaResponse = await needle('get', `${addonEndpoint}/${type}/${itemImdbId}.json`);
				const metaBody = metaResponse.body;
		
				if (metaBody && metaBody.meta) {
					name = metaBody.meta.name;
				}
			} else {
				throw new Error("No metadata found");
			}
			return name
		} catch (error) {
			console.error("Error in fetchAndProcessSubtitles: ", error);
		}
	}

	try {
		const nameEng = await fetchAndProcessSubtitles(languages[0])
		const nameJap = await fetchAndProcessSubtitles(languages[1])
		console.log(nameEng, 1);
		console.log(nameJap, 2);
		const subtitleUrl = await fetchSubtitles(nameEng, nameJap, season, episode);
		if (!subtitleUrl) throw new Error("Subtitle URL not found");
  
		let sub = new sub2vtt(subtitleUrl.url);
		let file = await sub.getSubtitle();

		//console.log(file.subtitle);
		if (!file?.subtitle) throw new Error("Subtitle conversion failed");

		// Store the subtitle with a unique ID
		const subtitleId = uuidv4();
		subtitlesStore[subtitleId] = file.subtitle; // Assuming file.subtitle is the .vtt data
	  
		// Construct URL to serve the subtitle
		const subtitleUrl2 = `http://localhost:${port}/${subtitleId}`;
		console.log(subtitleUrl2);
  
		return { subtitles: [{ id: 9751926, url: subtitleUrl2, lang: "jpn" }] };
	} catch (error) {
	  console.error("Error fetching subtitles: ", error);
	  return { subtitles: [] };
	}
  });

  // Implement a cleanup mechanism (e.g., delete subtitles after 1 hour)
  /*
setInterval(() => {
	subtitlesStore = {}; // Simplest form of cleanup
  }, 3600000 * 2); // 2 hours in milliseconds
*/

module.exports = builder.getInterface()