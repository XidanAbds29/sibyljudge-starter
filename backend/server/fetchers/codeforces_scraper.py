#!/usr/bin/env python3
import os
import time
import json
import re
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
import asyncio
from pyppeteer import launch
from pyppeteer_stealth import stealth
from postgrest.exceptions import APIError

# --- Configuration ---
load_dotenv()
SUPABASE_URL = os.getenv("PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
CODEFORCES_OJ_ID = 1
API_HEADERS = {'User-Agent': 'Mozilla/5.0'}
sleep_interval = 1  # seconds between operations

# Path to Chrome for fallback - Cross-platform support
import platform

def get_chrome_paths():
    system = platform.system()
    if system == "Darwin":  # macOS
        return [
            '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium'
        ]
    elif system == "Windows":  # Windows
        return [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
            r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
            r"C:\Users\%USERNAME%\AppData\Local\Google\Chrome\Application\chrome.exe",
            r"C:\Users\%USERNAME%\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe"
        ]
    else:  # Linux
        return [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/brave-browser',
            '/snap/bin/chromium',
            '/usr/bin/google-chrome-stable'
        ]

CHROME_PATH = None
for path in get_chrome_paths():
    # Expand environment variables for Windows paths
    expanded_path = os.path.expandvars(path)
    if os.path.exists(expanded_path):
        CHROME_PATH = expanded_path
        print(f"Found browser: {expanded_path}")
        break

if not CHROME_PATH:
    print("Warning: Chrome not found. Puppeteer fallback disabled.")
    CHROME_PATH = None

# --- Scraping Helpers ---
def html_to_text_with_newlines(element):
    """
    Convert HTML element to text while preserving newlines.
    This is crucial for sample inputs/outputs that have multiple lines.
    """
    if not element:
        return ''
    
    # Handle Codeforces specific structure with test-example-line divs
    test_lines = element.select('div.test-example-line')
    if test_lines:
        # Extract text from each test-example-line div and join with newlines
        lines = []
        for line_div in test_lines:
            line_text = line_div.get_text().strip()
            if line_text:  # Only add non-empty lines
                lines.append(line_text)
        return '\n'.join(lines)
    
    # Fallback to general HTML processing
    html_content = str(element)
    
    # Replace HTML tags that should become newlines
    html_content = re.sub(r'<br\s*/?>', '\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<div[^>]*>', '\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</div>', '', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'<p[^>]*>', '\n', html_content, flags=re.IGNORECASE)
    html_content = re.sub(r'</p>', '', html_content, flags=re.IGNORECASE)
    
    # Create a BeautifulSoup object to extract text
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text()
    
    # Clean up the text
    text = re.sub(r'\n\s*\n', '\n', text)  # Remove multiple consecutive newlines
    text = text.strip()
    
    return text

def parse_with_bs(html: str) -> dict:
    soup = BeautifulSoup(html, 'html.parser')
    stmt = soup.select_one('div.problem-statement')
    if not stmt:
        return {}
    tm = stmt.find('div', class_='time-limit')
    mm = stmt.find('div', class_='memory-limit')
    def parse_time(s):
        m = re.search(r"([\d\.]+)\s*s", s.lower())
        return int(float(m.group(1))*1000) if m else None
    def parse_mem(s):
        m = re.search(r"(\d+)\s*mb", s.lower())
        return int(m.group(1))*1024 if m else None
    details = {
        'statement_html': str(stmt),
        'input_spec': None,
        'output_spec': None,
        'samples': [],
        'time_limit_ms': parse_time(tm.text) if tm else None,
        'mem_limit_kb': parse_mem(mm.text) if mm else None
    }
    inp = stmt.find('div', class_='input-specification')
    out = stmt.find('div', class_='output-specification')
    details['input_spec'] = str(inp) if inp else None
    details['output_spec'] = str(out) if out else None
    
    # Parse samples with proper newline preservation
    sample_inputs = stmt.select('div.sample-tests div.input pre')
    sample_outputs = stmt.select('div.sample-tests div.output pre')
    
    for i in range(min(len(sample_inputs), len(sample_outputs))):
        # Use our new function to preserve newlines
        input_text = html_to_text_with_newlines(sample_inputs[i])
        output_text = html_to_text_with_newlines(sample_outputs[i])
        
        details['samples'].append({
            'input': input_text,
            'output': output_text
        })
    
    return details

async def scrape_with_puppeteer(url: str) -> dict:
    if not CHROME_PATH:
        print(f"Puppeteer disabled - Chrome not found")
        return {}
    
    browser = None
    try:
        browser = await launch(
            executablePath=CHROME_PATH,
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        )
        page = await browser.newPage()
        await stealth(page)
        await page.setUserAgent(API_HEADERS['User-Agent'])
        
        # Set a shorter timeout to avoid hanging
        await page.goto(url, {'waitUntil': 'networkidle2', 'timeout': 15000})
        html = await page.content()
        await browser.close()
        return parse_with_bs(html)
    except Exception as e:
        print(f"Puppeteer error: {e}")
        if browser:
            try:
                await browser.close()
            except:
                pass
        return {}

async def scrape_problem_details(url: str) -> dict:
    # 1) Try requests first (this works for most problems)
    try:
        r = requests.get(url, headers=API_HEADERS, timeout=30)
        if r.status_code == 200 and 'problem-statement' in r.text:
            return parse_with_bs(r.text)
    except Exception as e:
        print(f"Requests failed for {url}: {e}")
    
    # 2) Fallback to Puppeteer with timeout (only if Chrome is available)
    if CHROME_PATH:
        print(f"Puppeteer fallback for {url}")
        try:
            # Add asyncio timeout to prevent hanging
            result = await asyncio.wait_for(scrape_with_puppeteer(url), timeout=30)
            return result
        except asyncio.TimeoutError:
            print(f"Puppeteer timeout for {url} - skipping")
            return {}
        except Exception as e:
            print(f"Puppeteer error: {e}")
    else:
        print(f"Skipping {url} - no fallback available")
    
    return {}

# --- Main Logic ---
def main():
    # Fetch metadata
    try:
        resp = requests.get('https://codeforces.com/api/problemset.problems', headers=API_HEADERS, timeout=30)
        resp.raise_for_status()
    except Exception as e:
        print(f"Error fetching problem list: {e}")
        return
    problems = resp.json().get('result', {}).get('problems', [])


    # Number of problems to scrape here


    selected = [p for p in problems if 'rating' in p][:500]
    print(f"Found {len(selected)} problems to process...")

    loop = asyncio.get_event_loop()
    for i, p in enumerate(selected, 1):
        contest, idx = p['contestId'], p['index']
        ext_id = f"{contest}{idx}"
        url = f"https://codeforces.com/problemset/problem/{contest}/{idx}"
        print(f"Processing {ext_id}... ({i}/{len(selected)})")

        details = loop.run_until_complete(scrape_problem_details(url))
        if not details:  # Skip if scraping failed
            print(f"Skipping {ext_id} - could not scrape details")
            continue
        time_limit = details.get('time_limit_ms') or 2000
        mem_limit = details.get('mem_limit_kb') or 262144

        # Insert Problem (use upsert to handle duplicates)
        rec = {
            'source_oj_id': CODEFORCES_OJ_ID,
            'external_id': ext_id,
            'title': p.get('name'),
            'url': url,
            'difficulty': str(p.get('rating','')),
            'time_limit': time_limit,
            'mem_limit': mem_limit,
            'statement_html': details.get('statement_html'),
            'input_spec': details.get('input_spec'),
            'output_spec': details.get('output_spec'),
            'samples': json.dumps(details.get('samples', []))
        }
        
        # Check if problem already exists
        existing = supabase.table('Problem').select('problem_id').eq('external_id', ext_id).execute()
        if existing.data:
            print(f"Problem {ext_id} already exists, skipping...")
            continue
            
        # Insert new problem
        pr = supabase.table('Problem').insert(rec).execute()
        if not pr.data:
            print(f"Problem insert failed for {ext_id}")
            continue
        pid = pr.data[0]['problem_id']

        # Upsert Tags and link
        for tag in p.get('tags', []):
            name = tag.lower().strip()
            tr = supabase.table('Tag').upsert({'name': name}, on_conflict='name').execute()
            if not tr.data:
                print(f"Tag upsert failed: {name}")
                continue
            tag_id = tr.data[0]['tag_id']
            try:
                supabase.table('Problem_tag').insert({ 'problem_id': pid, 'tag_id': tag_id }).execute()
            except APIError as e:
                if 'duplicate key' not in e.message.lower():
                    print(f"Relation insert error: {e.message}")

        time.sleep(sleep_interval)

if __name__ == '__main__':
    main()
