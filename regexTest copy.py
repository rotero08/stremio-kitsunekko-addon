import requests
from bs4 import BeautifulSoup
import re
import string
import os

# Updated patterns to include regex groups for capturing numbers
season_pattern = r'\b(?:Season\s*|S)(\d{1,2})(?!\d)'
episode_pattern = r'\b(?:S\d{1,2}E\s*|E\s*|Ep\.?\s*|Episode\s*)(\d{1,4})\b'
notSeasonOrEpisode_pattern = r'(\d+[a-zA-Z0-9-]*[a-zA-Z]|[a-zA-Z]+[a-zA-Z0-9-]*\d+)'
two_numbers_pattern = r'(\b\d+\b)\s+(\b\d+\b)'

def has_season(line):
    return re.search(season_pattern, line, re.IGNORECASE)

def has_episode(line):
    return re.search(episode_pattern, line, re.IGNORECASE) or numbers_in_line(line) == 1

def has_two_separated_numbers(line):
    return re.search(two_numbers_pattern, line, re.IGNORECASE)

def remove_pattern(line, pattern):
    return re.sub(pattern, '', line, flags=re.IGNORECASE)

def numbers_in_line(line):
    return len(re.findall(r'\d+', line))

def analyze_text(line):
    results = []
    season_match = has_season(line)
    episode_match = has_episode(line)
    
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
                    season_num, episode_num = match.groups()
                    results.append(f"CleanedLine '{line.strip()}': Season {season_num} and episode {episode_num} are the two remaining numbers found.")
                elif numbers_in_line(cleaned_line) == 2:
                    # Error since two numbers are not separated by just spaces
                    results.append(f"ERROR: CleanedLine '{line.strip()}': Two numbers found but not properly separated.")
                else:
                    # Error since there are not exactly two numbers
                    results.append(f"ERROR: CleanedLine '{line.strip()}': Incorrect number of numbers found.")
    return results

def get_anime_titles(base_url):
    response = requests.get(base_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    anime_titles = [a.text.strip() for a in soup.find_all('a') if a.text.strip()]
    return anime_titles

def get_subtitle_files(base_url, anime_title):
    formatted_title = anime_title.replace(' ', '+')
    url = f"{base_url}{formatted_title}/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    subtitles = [a.text.strip() for a in soup.find_all('a') if a.text.strip().endswith(('.srt', '.vtt'))]
    return subtitles

def main():
    base_url = 'https://kitsunekko.net/dirlist.php?dir=subtitles%2Fjapanese%2F'
    anime_titles = get_anime_titles(base_url)

    #result_files = {letter: open(f'anime_results_{letter}.txt', 'w', encoding='utf-8') for letter in string.ascii_lowercase}
    #result_files['other'] = open(f'anime_results_non_alpha.txt', 'w', encoding='utf-8')

    for anime_title in sorted(anime_titles):
        print(anime_title)
        subtitle_files = get_subtitle_files(base_url, anime_title)
        print(subtitle_files)
        results = [analyze_text(subtitle_file) for subtitle_file in subtitle_files]
        for result in results:
            print(result)
        flattened_results = [item for sublist in results for item in sublist]

        # Determine the file to write to based on the first letter of the anime title
        first_letter = anime_title[0].lower()
    #    if first_letter in result_files:
     #       target_file = result_files[first_letter]
      #  else:
       #     target_file = result_files['other']
#
 #       for result in flattened_results:
  #          target_file.write(result + '\n')

    # Close all the files
   # for file in result_files.values():
    #    file.close()

if __name__ == "__main__":
    main()