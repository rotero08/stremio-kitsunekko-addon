import re

def analyze_text(text):
    # Regex for season
    season_pattern = r'\b(?:Season|S)\s*\d{1,}\b'
    
    # Regex for episode
    episode_pattern = r'\b(?:E|Ep|Episode)\s*\d{1,}\b'
    
    # Regex for a name followed by a number
    name_episode_pattern = r'\b[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+\b'

    for line in text.split('\n'):
        # Check for season
        if re.search(season_pattern, line, re.IGNORECASE):
            print(f"Season found in line: '{line}'")
        # Check for episode or name followed by a number
        elif re.search(episode_pattern, line, re.IGNORECASE) or re.search(name_episode_pattern, line):
            print(f"Episode found in line: '{line}'")
        else:
            print(f"No season or episode found in line: '{line}'")

# Example usage
text = """
5-toubun no Hanayome (season 01-12) (Webrip).zip
Gotoubun No Hanayome 1 013.srt
[Judas] The Quintessential Quintuplets - S1 01.ja.srt
[SubsPlease] Go-toubun no Hanayome S2 (12) (1080p).srt
"""
analyze_text(text)