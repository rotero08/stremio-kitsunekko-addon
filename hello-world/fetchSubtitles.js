const axios = require('axios');
const cheerio = require('cheerio');
const natural = require('natural');

async function fetchName(name) {
  const response = await axios.get('https://kitsunekko.net/dirlist.php?dir=subtitles%2Fjapanese%2F');
  const $ = cheerio.load(response.data);

  console.log("Hasta después de cherio");
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

  console.log(name, bestMatch, highestSimilarity, 3);

  return { bestMatch, highestSimilarity };
}


async function fetchSubtitles(nameEng, nameJap, season, episode) {
  console.log("Hasta aca llego");
  const engMatch = await fetchName(nameEng);
  const japMatch = await fetchName(nameJap);

  // Determine the best overall match
  const bestOverallMatch = japMatch.highestSimilarity < 0.5 ? engMatch.bestMatch : japMatch.bestMatch;
  console.log(bestOverallMatch, 4);
  const encodedBestMatch = encodeURIComponent(bestOverallMatch);

  const subtitle = {
    id: 9751926,
    url: `https://kitsunekko.net/subtitles/japanese/${encodedBestMatch}/[SubsPlease]%20Shangri-La%20Frontier%20-%2002%20(720p)%20[F6FBB395].ja.ass`,
    lang: 'jpn'
  }

  return subtitle;
}
  
module.exports = fetchSubtitles;