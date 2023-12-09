const fetchSubtitles = require('./fetchSubtitles');
const sub2vtt = require('./sub2vtt');
const imdbScraper = require('easyimdbscraper');
const needle = require('needle');

const processSubtitles = async (type, itemImdbId, season, episode, storeSubtitle) => {
  const addonEndpoint = 'https://v3-cinemeta.strem.io/meta';
  const languages = ['en', 'ja'];

  const getMediaName = async (language) => {
    let name = "";
    if (language === 'ja') {
      const meta = await imdbScraper.getInfoByID(itemImdbId);
      name = meta.title.match(/^[^(]+/)[0].trim();
    } else if (language === 'en') {
      const metaResponse = await needle('get', `${addonEndpoint}/${type}/${itemImdbId}.json`);
      const metaBody = metaResponse.body;
      if (metaBody && metaBody.meta) {
        name = metaBody.meta.name;
      }
    } else {
      throw new Error("No metadata found");
    }
    return name;
  };

  try {
    const nameEng = await getMediaName(languages[0]);
    const nameJap = await getMediaName(languages[1]);
    const subtitleUrl = await fetchSubtitles(nameEng, nameJap, season, episode);
    if (!subtitleUrl) throw new Error("Subtitle URL not found");

    let sub = new sub2vtt(subtitleUrl.url);
    let file = await sub.getSubtitle();
    if (!file?.subtitle) throw new Error("Subtitle conversion failed");

    const subtitleUrl2 = storeSubtitle(file.subtitle);
    return [{ id: 9751926, url: subtitleUrl2, lang: "jpn" }];
  } catch (error) {
    console.error("Error fetching subtitles: ", error);
    return [];
  }
};

module.exports = processSubtitles;
