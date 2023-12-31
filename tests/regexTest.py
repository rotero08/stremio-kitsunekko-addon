import requests
from bs4 import BeautifulSoup
import re

# Updated patterns to include regex groups for capturing numbers
notSeasonOrEpisode_pattern = r'(\d+[a-zA-Z0-9-ぁ-んァ-ン一-龯]*[a-zA-Zぁ-んァ-ン一-龯]+[a-zA-Z0-9-ぁ-んァ-ン一-龯]*\d*|\d*[a-zA-Z0-9-ぁ-んァ-ン一-龯]*[a-zA-Zぁ-んァ-ン一-龯]+[a-zA-Z0-9-ぁ-んァ-ン一-龯]*\d+)'
two_numbers_pattern = r'(\b\d+\b)\s+(\b\d+\b)'

def create_patterns(season_number, episode_number):
    season_pattern = rf'\b(?:Season\s*|S)(0*{season_number})(?!\d)'
    episode_pattern = rf'\b(?:S\d{{1,2}}E\s*|E\s*|Ep\.?\s*|Episode\s*)(0*{episode_number})\b'
    return season_pattern, episode_pattern

def has_season(line, season_pattern):
    return re.search(season_pattern, line, re.IGNORECASE)

def has_episode(line, episode_pattern):
    return re.search(episode_pattern, line, re.IGNORECASE) or numbers_in_line(line) == 1

def has_two_separated_numbers(line):
    return re.search(two_numbers_pattern, line, re.IGNORECASE)

def remove_pattern(line, pattern):
    return re.sub(pattern, '', line, flags=re.IGNORECASE)

def numbers_in_line(line):
    return len(re.findall(r'\d+', line))

def analyze_text(line, season, episode):
    results = []
    file_found = False
    season_number = 0
    episode_number = 0

    season_pattern, episode_pattern = create_patterns(season, episode)
    season_match = has_season(line, season_pattern)
    episode_match = has_episode(line, episode_pattern)
    
    if season_match:
        season_number = season_match.group(1)
        no_season_line = remove_pattern(line, season_pattern)
            
        if episode_match:
            # Season and episode are specified directly
            try:
                episode_number = episode_match.group(1)
                results.append(f"Line '{line.strip()}': Season {season_number} and episode {episode_number} found directly.")
            except:
                episode_number = re.findall(r'\d+', line)[0]
                results.append(f"Line '{line.strip()}': Season {season_number} and episode is {episode_number} (remaining number).")
        else:
            # Only season is found, error if more than one number left after removing not season or episode numbers
            cleaned_line = remove_pattern(no_season_line, notSeasonOrEpisode_pattern)
            if numbers_in_line(cleaned_line) == 1:
                episode_number = re.search(r'\d+', cleaned_line).group()
                results.append(f"CleanedLine '{line.strip()}': Season {season_number} found, episode is {episode_number} (remaining number).")
            else:
                results.append(f"ERROR: CleanedLine '{line.strip()}': Season {season_number} found but improper episode number.")
    else:
        season_number = 1
        if episode_match:
            # Just one number is the episode
            try:
                episode_number = episode_match.group(1)
                results.append(f"Line '{line.strip()}': No season specified, assuming season 1; episode {episode_number} found directly.")
            except:
                episode_number = re.findall(r'\d+', line)[0]
            results.append(f"Line '{line.strip()}': No season specified, assuming season 1; episode is {episode_number} (remaining number).")
        else:
            # Not episode numbers are detected and deleted
            cleaned_line = remove_pattern(line, notSeasonOrEpisode_pattern)
            if numbers_in_line(cleaned_line) == 1:
                episode_number = re.search(r'\d+', cleaned_line).group()
                results.append(f"CleanedLine '{line.strip()}': No season specified, assuming season 1; episode is {episode_number} (remaining number).")
            else: 
                if numbers_in_line(cleaned_line) == 2 and has_two_separated_numbers(cleaned_line):
                    # There are two numbers separated by just an arbitrary number of spaces
                    match = has_two_separated_numbers(cleaned_line)
                    season_number, episode_number = match.groups()
                    results.append(f"CleanedLine '{line.strip()}': Season {season_number} and episode {episode_number} are the two remaining numbers found.")
                elif numbers_in_line(cleaned_line) == 2:
                    # Error since two numbers are not separated by just spaces
                    results.append(f"ERROR: CleanedLine '{line.strip()}': Two numbers found but not properly separated.")
                else:
                    # Error since there are not exactly two numbers
                    results.append(f"ERROR: CleanedLine '{line.strip()}': Incorrect number of numbers found.")
    if str(season_number).lstrip('0') == str(season) and str(episode_number).lstrip('0') == str(episode):
        file_found = True
    
    return file_found, results, str(season_number).lstrip('0') , str(episode_number).lstrip('0')

def get_subtitle_files_for_anime(base_url, anime_name):
    formatted_anime_name = anime_name.replace(' ', '+')
    url = f"{base_url}{formatted_anime_name}/"
    print(url)
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    subtitles = [a.text.strip() for a in soup.find_all('a') if a.text.strip().endswith(('.srt', '.vtt'))]
    return subtitles

def main(anime_name, season, episode):
    base_url = 'https://kitsunekko.net/dirlist.php?dir=subtitles%2Fjapanese%2F'
    subtitle_files = get_subtitle_files_for_anime(base_url, anime_name)

    results = []
    for file in subtitle_files:
        file_found, analyze_results, season_number, episode_number = analyze_text(file, season, episode)
        results.append((file_found, analyze_results, season_number, episode_number))
        
        # Break the loop if the file is found
        if file_found:
            break

    # Output results
    for result in results:
        print(f"Found: {result[0]}, {result[1]}, Season: {result[2]}, Episode: {result[3]}")

    #print(results)
# Example usage
if __name__ == "__main__":
    anime_name = 'Saihate no Paladin'
    season = 1
    episode = 1
    main(anime_name, season, episode)