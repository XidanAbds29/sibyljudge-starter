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

# Path to Chrome for fallback
CHROME_PATH = os.getenv('CHROME_EXECUTABLE_PATH', r"C:\Program Files\Google\Chrome\Application\chrome.exe")
if not os.path.exists(CHROME_PATH):
    raise FileNotFoundError(f"Chrome executable not found: {CHROME_PATH}")

# --- Scraping Helpers ---
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
    samples = stmt.select('div.sample-tests div.input pre, div.sample-tests div.output pre')
    for i in range(0, len(samples), 2):
        details['samples'].append({
            'input': samples[i].text.strip(),
            'output': samples[i+1].text.strip()
        })
    return details

async def scrape_with_puppeteer(url: str) -> dict:
    browser = await launch(
        executablePath=CHROME_PATH,
        headless=True,
        args=['--no-sandbox','--disable-setuid-sandbox']
    )
    page = await browser.newPage()
    await stealth(page)
    await page.setUserAgent(API_HEADERS['User-Agent'])
    await page.goto(url, {'waitUntil': 'networkidle2', 'timeout': 60000})
    html = await page.content()
    await browser.close()
    return parse_with_bs(html)

async def scrape_problem_details(url: str) -> dict:
    # 1) Try requests
    try:
        r = requests.get(url, headers=API_HEADERS, timeout=30)
        if r.status_code == 200 and 'problem-statement' in r.text:
            return parse_with_bs(r.text)
    except Exception:
        pass
    # 2) Fallback to Puppeteer
    print(f"Puppeteer fallback for {url}")
    try:
        return await scrape_with_puppeteer(url)
    except Exception as e:
        print(f"Puppeteer error: {e}")
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
    selected = [p for p in problems if 'rating' in p][:10]

    loop = asyncio.get_event_loop()
    for p in selected:
        contest, idx = p['contestId'], p['index']
        ext_id = f"{contest}{idx}"
        url = f"https://codeforces.com/problemset/problem/{contest}/{idx}"
        print(f"Processing {ext_id}...")

        details = loop.run_until_complete(scrape_problem_details(url))
        time_limit = details.get('time_limit_ms') or 2000
        mem_limit = details.get('mem_limit_kb') or 262144

        # Insert Problem
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
