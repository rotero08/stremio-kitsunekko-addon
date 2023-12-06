import re

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

def analyze_text(text):
    results = []
    for line in text.strip().split('\n'):
        season_match = has_season(line)
        episode_match = has_episode(line)
        
        if season_match:
            season_number = season_match.group(1)
            no_season_line = remove_pattern(line, season_pattern)
            
            if episode_match:
                # Season and episode are specified directly
                episode_number = episode_match.group(1)
                results.append(f"Line '{line.strip()}': Season {season_number} and episode {episode_number} found directly.")
            else:
                # Only season is found, error if more than one number left after removing not season or episode numbers
                cleaned_line = remove_pattern(no_season_line, notSeasonOrEpisode_pattern)
                if numbers_in_line(cleaned_line) == 1:
                    episode_number = re.search(r'\d+', cleaned_line).group()
                    results.append(f"Line '{line.strip()}': Season {season_number} found, episode is {episode_number} (remaining number).")
                else:
                    results.append(f"ERROR: Line '{line.strip()}': Season {season_number} found but improper episode number.")
        else:
            if episode_match:
                # Just one number is the episode
                episode_number = episode_match.group(1)
                results.append(f"Line '{line.strip()}': No season specified, assuming season 1; episode {episode_number} found directly.")
            else:
                # Not episode numbers are detected and deleted
                cleaned_line = remove_pattern(line, notSeasonOrEpisode_pattern)
                if numbers_in_line(cleaned_line) == 1:
                    episode_number = re.search(r'\d+', cleaned_line).group()
                    results.append(f"Line '{line.strip()}': No season specified, assuming season 1; episode is {episode_number} (remaining number).")
                else: 
                    if numbers_in_line(cleaned_line) == 2 and has_two_separated_numbers(cleaned_line):
                        # There are two numbers separated by just an arbitrary number of spaces
                        match = has_two_separated_numbers(cleaned_line)
                        season_num, episode_num = match.groups()
                        results.append(f"Line '{line.strip()}': Season {season_num} and episode {episode_num} are the two remaining numbers found.")
                    elif numbers_in_line(cleaned_line) == 2:
                        # Error since two numbers are not separated by just spaces
                        results.append(f"ERROR: Line '{line.strip()}': Two numbers found but not properly separated.")
                    else:
                        # Error since there are not exactly two numbers
                        results.append(f"ERROR: Line '{line.strip()}': Incorrect number of numbers found.")
    return results

# Example usage
text = """
5-toubun no Hanayome (season 01-12) (Webrip).zip
Gotoubun No Hanayome 1 013.srt
Gotoubun No Hanayome E013.srt
Goblin Slayer.S01E01.JA.srt
[Judas] The Quintessential Quintuplets - Episode 1 01.ja.srt
[SubsPlease] Go-toubun no Hanayome S2 (12) (1080p).srt
5-toubun no Hanayome (Season 02-24) (BluRay).zip
The Legend of Heroes S03 Ep 45.mkv
Anime Adventures - Episode 123 (HD).mp4
Mystery Series.S2E07.1080p.WEB-DL.x264.mp4
FantasyWorld S4E001 - The Beginning.avi
HeroAcademy S01 Episode 10 [Dual-Audio].mkv
DragonQuest Ep 256 [Subbed].mp4
Magical Creatures S3 Ep12 (1920x1080).mkv
Galactic Battles Episode 0023 [FHD].avi
Robot Wars S5E100 - Final Battle.mp4
Ancient Myths S4 E 09 [HDRip].avi
Future Tech Ep 078 [4K UHD].mkv
Ocean Explorers Season 3 Episode 8 [720p].mp4
Space Odyssey - S2 Ep 09 [HDR].mp4
Enchanted Forest S01E02 - Magical Encounter.mp4
Virtual Reality Gaming Ep. 0104 [VR].mp4
Underwater Secrets E0156 [Documentary].mp4
Historical Events S01E20 - The Turning Point.avi
Music Legends Episode 042 [Concert Series].mp4
Alien Encounters S3E10 - Close Contact.mp4
[Romariji][Accel World][01][简繁日][720P][x264 AAC][MKV] track3 und.ass
[SubsPlease] Shangri-La Frontier - 01 (720p) [AC62F13B].ja.ass
"""

results = analyze_text(text)
for result in results:
    print(result)