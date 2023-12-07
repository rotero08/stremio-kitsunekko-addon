const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');

async function fetchName(name) {
  const response = await axios.get('https://kitsunekko.net/dirlist.php?dir=subtitles%2Fjapanese%2F');
  const $ = cheerio.load(response.data);

  let animeTitles = [];
  $('a').each((i, element) => {
    animeTitles.push($(element).text().trim());
  });

  let bestMatch = '';
  let highestSimilarity = 0;

  animeTitles.forEach(title => {
    // Using Jaro-Winkler distance for comparison
    const similarity = natural.JaroWinklerDistance(name, title);

    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = title;
    }
  });

  console.log(name, "|||" , bestMatch, "|||", highestSimilarity);

  return { bestMatch, highestSimilarity };
}

async function fetchSubFile(name, season, episode) {
  const encodedName = encodeURIComponent(name);

  const response = await axios.get(`https://kitsunekko.net/subtitles/japanese/${encodedName}/`);
  const $ = cheerio.load(response.data);

  let subTitles = [];
  $('a').each((i, element) => {
    const fileName = $(element).text().trim();
    if (fileName.endsWith('.srt') || fileName.endsWith('.vtt')) {
      subTitles.push(fileName);
    }
  });

  let bestMatch = '';
  let highestSimilarity = 0;
  season = season || 1; // Default to season 1 if not specified

  const seasonRegex = new RegExp(`(Season ${season}|S0*${season}|\\(${season}\\))`, 'i');
  const episodeRegex = new RegExp(`(Episode ${episode}|E0*${episode}|[ _-]${episode}(?![0-9]))`, 'i');

  console.log(subTitles);

  subTitles.forEach(title => {
    if (seasonRegex.test(title) && episodeRegex.test(title)) {
      const similarity = natural.JaroWinklerDistance(name, title);
      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = title;
      }
    }
  });

  console.log(name, season, episode, "|||" , bestMatch, "|||", highestSimilarity);

  return { bestMatch, highestSimilarity };
}


async function fetchSubtitles(nameEng, nameJap, season, episode) {
  console.log("ENGLISH");
  const engMatch = await fetchName(nameEng);
  console.log("JAPANESE");
  const japMatch = await fetchName(nameJap);

  // Determine the best overall match (CHANGE WHEN POSSIBLE)
  const bestOverallMatch = japMatch.highestSimilarity < 0.5 ? engMatch.bestMatch : japMatch.bestMatch;
  console.log("BEST MATCH");
  console.log(bestOverallMatch);
  const encodedBestMatch = encodeURIComponent(bestOverallMatch);

  const bestSubFile = fetchSubFile(encodedBestMatch, season, episode)

  const subtitle = {
    id: 9751926,
    url: `https://kitsunekko.net/subtitles/japanese/${encodedBestMatch}/[SubsPlease]%20Shangri-La%20Frontier%20-%2002%20(720p)%20[F6FBB395].ja.ass`,
    lang: 'jpn'
  }

  return subtitle;
}
  
module.exports = fetchSubtitles;