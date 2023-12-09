const { addonBuilder } = require("stremio-addon-sdk");
const startSubtitlesServer = require("./utils/subtitlesServer");
const processSubtitles = require('./utils/processSubtitles'); 
require('dotenv').config()

const port = process.env.SUBPORT || 7000;
const { storeSubtitle, cleanUp } = startSubtitlesServer(port);

/*
WORK TO DO

REFACTOR ALL THE CODE AND MAKE IT MORE MODULAR
Add functionality for detecting seasons (better)
Add functionality to take .rar .zip .7z
Add functionality to be able to detect movie files
*/

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
	if (!result) return { subtitles: [] };
  
	const itemImdbId = result[1];
	const season = result[2];
	const episode = result[3];
  
	const subtitles = await processSubtitles(type, itemImdbId, season, episode, storeSubtitle);
	return { subtitles };
  });

setInterval(cleanUp, 3600000 * 2); // 2 hours in milliseconds

module.exports = builder.getInterface()