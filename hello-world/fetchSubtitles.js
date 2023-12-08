const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');
const analyzeSubFile = require('./subtitleParser')

function customEncodeURI(uri) {
  // First, use the standard encodeURIComponent
  let encodedURI = encodeURIComponent(uri);

  // Then replace any underscores with '%5F'
  encodedURI = encodedURI.replace(/_/g, '%5F');

  return encodedURI;
}

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
  const response = await axios.get(`https://kitsunekko.net/dirlist.php?dir=subtitles%2Fjapanese%2F${encodedName}/`);
  const $ = cheerio.load(response.data);

  let subtitleFiles = [];
  $('a').each((i, element) => {
    const fileName = $(element).text().trim();
    const fileLink = $(element).attr('href');
    if (fileName.endsWith('.srt') || fileName.endsWith('.vtt')) {
      subtitleFiles.push({ fileName, fileLink });
    }
  });

  let results = [];
  let fileFound, correctFile, status, seasonNumber, episodeNumber;
  for (let fileObj of subtitleFiles) {
    ({ fileFound, status, seasonNumber, episodeNumber } = await analyzeSubFile(fileObj.fileName, season, episode));
    results.push({ fileFound, status, seasonNumber, episodeNumber });

    // Break the loop if the file is found and store the correct file object
    if (fileFound) {
      correctFile = fileObj;
      break;
    }
  }

  // Output results
  for (let result of results) {
    console.log(`Found: ${result.fileFound}, Status: ${result.status} Season: ${result.seasonNumber}, Episode: ${result.episodeNumber}`);
  }

  // Return the file name and link of the correct file, if found
  return correctFile ? { fileName: correctFile.fileName, fileLink: correctFile.fileLink, seasonNumber, episodeNumber } : null;

  /*
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
  */
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

  const bestSubFile = await (await fetchSubFile(bestOverallMatch, season, episode)).fileLink

  const encodedSubFile = customEncodeURI(bestSubFile)

  console.log(encodedSubFile);
  console.log(encodeURI(bestSubFile));

  const subtitle = {
    id: 9751926,
    url: `https://kitsunekko.net/${bestSubFile}`,
    lang: 'jpn'
  }

  return subtitle;
}
  
module.exports = fetchSubtitles;