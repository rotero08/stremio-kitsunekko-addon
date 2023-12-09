const axios = require('axios');
const cheerio = require('cheerio');

const seasonPattern = /\b(?:Season\s*|S)(\d{1,2})(?!\d)/i;
const episodePattern = /\b(?:S\d{1,2}E\s*|E\s*|Ep\.?\s*|Episode\s*)(\d{1,4})\b/i;
const notSeasonOrEpisodePattern = /(\d+[a-zA-Z0-9-ぁ-んァ-ン一-龯]*[a-zA-Zぁ-んァ-ン一-龯]+[a-zA-Z0-9-ぁ-んァ-ン一-龯]*\d*|\d*[a-zA-Z0-9-ぁ-んァ-ン一-龯]*[a-zA-Zぁ-んァ-ン一-龯]+[a-zA-Z0-9-ぁ-んァ-ン一-龯]*\d+)/gmi;
const twoNumbersPattern = /(\b\d+\b)\s+(\b\d+\b)/gmi;

function hasSeason(line) {
    return line.match(seasonPattern);
}

function hasEpisode(line) {
    return line.match(episodePattern) || numbersInLine(line) === 1;
}

function hasTwoSeparatedNumbers(line) {
    return line.match(twoNumbersPattern);
}

function removePattern(line, pattern) {
    return line.replace(pattern, '');
}

function numbersInLine(line) {
    const matches = line.match(/\d+/g);
    return matches ? matches.length : 0;
}

function analyzeSubFile(line, season, episode) {
    let status = [];
    let fileFound = false;
    let seasonNumber = 0;
    let episodeNumber = 0;
    const seasonMatch = hasSeason(line);
    const episodeMatch = hasEpisode(line);

    if (seasonMatch) {
        seasonNumber = seasonMatch[1];
        let noSeasonLine = removePattern(line, seasonPattern);

        if (episodeMatch) {
            if (episodeMatch[1] !== undefined) {
                episodeNumber = episodeMatch[1];
                status.push(`Line '${line.trim()}': Season ${seasonNumber} and episode ${episodeNumber} found directly.`);
            } else {
                episodeNumber = noSeasonLine.match(/\d+/g)[0];
                status.push(`Line '${line.trim()}': Season ${seasonNumber} and episode is ${episodeNumber} (remaining number).`);
            }
        } else {
            let cleanedLine = removePattern(noSeasonLine, notSeasonOrEpisodePattern);
            if (numbersInLine(cleanedLine) === 1) {
                episodeNumber = cleanedLine.match(/\d+/)[0];
                status.push(`CleanedLine '${line.trim()}': Season ${seasonNumber} found, episode is ${episodeNumber} (remaining number).`);
            } else {
                status.push(`ERROR: CleanedLine '${line.trim()}': Season ${seasonNumber} found but improper episode number.`);
            }
        }
    } else {
        seasonNumber = 1;
        if (episodeMatch) {
            if (episodeMatch[1] !== undefined) {
                episodeNumber = episodeMatch[1];
                status.push(`Line '${line.trim()}': No season specified, assuming season 1; episode ${episodeNumber} found directly.`);
            } else {
                episodeNumber = line.match(/\d+/g)[0];
                status.push(`Line '${line.trim()}': No season specified, assuming season 1; episode is ${episodeNumber} (remaining number).`);
            }
        } else {
            let cleanedLine = removePattern(line, notSeasonOrEpisodePattern);
            if (numbersInLine(cleanedLine) === 1) {
                episodeNumber = cleanedLine.match(/\d+/)[0];
                status.push(`CleanedLine '${line.trim()}': No season specified, assuming season 1; episode is ${episodeNumber} (remaining number).`);
            } else {
                if (numbersInLine(cleanedLine) === 2 && hasTwoSeparatedNumbers(cleanedLine)) {
                    const match = hasTwoSeparatedNumbers(cleanedLine);
                    [seasonNumber, episodeNumber] = match;
                    status.push(`CleanedLine '${line.trim()}': Season ${seasonNumber} and episode ${episodeNumber} are the two remaining numbers found.`);
                } else if (numbersInLine(cleanedLine) === 2) {
                    status.push(`ERROR: CleanedLine '${line.trim()}': Two numbers found but not properly separated.`);
                } else {
                    // Error since there are not exactly two numbers
                    status.push(`ERROR: CleanedLine '${line.trim()}': Incorrect number of numbers found.`);
                }
            }
        }
    }

    if (parseInt(seasonNumber) === parseInt(season) && parseInt(episodeNumber) === parseInt(episode)) {
        fileFound = true;
    }

    return { fileFound, status, seasonNumber: parseInt(seasonNumber), episodeNumber: parseInt(episodeNumber) };
}

async function getSubtitleFilesForAnime(baseUrl, animeName) {
    const formattedAnimeName = encodeURIComponent(animeName)
    const url = `${baseUrl}${formattedAnimeName}/`;

    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const subtitles = $('a').toArray().map(a => $(a).text().trim()).filter(text => text.endsWith('.srt') || text.endsWith('.vtt'));
        return subtitles;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

async function main(animeName, season, episode) {
    const baseUrl = 'https://kitsunekko.net/dirlist.php?dir=subtitles%2Fjapanese%2F';
    const subtitleFiles = await getSubtitleFilesForAnime(baseUrl, animeName); // Assuming getSubtitleFilesForAnime is an async function

    let results = [];
    for (let file of subtitleFiles) {
        let { fileFound, analyzeResults, seasonNumber, episodeNumber } = analyzeSubFile(file, season, episode);
        results.push({ fileFound, analyzeResults, seasonNumber, episodeNumber });
        
        // Break the loop if the file is found
        if (fileFound) {
            break;
        }
    }

    // Output results
    for (let result of results) {
        console.log(`Season: ${result.seasonNumber}, Episode: ${result.episodeNumber}`);
    }

    console.log(results);
}

module.exports = analyzeSubFile;
