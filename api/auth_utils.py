import re

def extract_apikey(s):
    match = re.match(r'\s*Bearer\s+(\w+)', str(s))
    return match.group(1) if match else None