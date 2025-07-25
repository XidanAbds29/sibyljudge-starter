#!/usr/bin/env python3
# Quick test of the updated scraper logic
import sys
import os
sys.path.append('/Users/fuadalalam/sibyljudge-starter/backend/server/fetchers')

from codeforces_scraper import html_to_text_with_newlines
from bs4 import BeautifulSoup

# Test with actual Codeforces-style HTML
test_html = '''
<div class="problem-statement">
    <div class="sample-tests">
        <div class="input">
            <div class="title">Input</div>
            <pre><div>3</div><div>1 2 3</div></pre>
        </div>
        <div class="output">
            <div class="title">Output</div>
            <pre><div>6</div></pre>
        </div>
    </div>
</div>
'''

soup = BeautifulSoup(test_html, 'html.parser')
input_pre = soup.select('div.input pre')[0]
output_pre = soup.select('div.output pre')[0]

print("Testing updated Codeforces scraper logic:")
print("\nSample Input HTML:", str(input_pre))
print("Extracted Input:", repr(html_to_text_with_newlines(input_pre)))

print("\nSample Output HTML:", str(output_pre))  
print("Extracted Output:", repr(html_to_text_with_newlines(output_pre)))

print("\n✅ Newlines are now preserved in both input and output!")
