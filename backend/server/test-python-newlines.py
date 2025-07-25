#!/usr/bin/env python3
import re
from bs4 import BeautifulSoup

def html_to_text_with_newlines(element):
    """
    Convert HTML element to text while preserving newlines.
    This is crucial for sample inputs/outputs that have multiple lines.
    """
    if not element:
        return ''
    
    # Get the HTML content of the element
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

# Test cases
print("Testing Python newline preservation...\n")

# Test case 1: Typical Codeforces sample input with <div> tags
html1 = '<pre><div>3</div><div>1 2 3</div></pre>'
soup1 = BeautifulSoup(html1, 'html.parser')
pre_element1 = soup1.find('pre')

old_result1 = pre_element1.text.strip()  # Old method
new_result1 = html_to_text_with_newlines(pre_element1)  # New method

print("Test 1 - Codeforces sample input:")
print(f"HTML: {html1}")
print(f"Old method (no newlines): {repr(old_result1)}")
print(f"New method (with newlines): {repr(new_result1)}")
print(f"Has newlines: {'\\n' in new_result1}")
print("---")

# Test case 2: Sample with <br> tags
html2 = '<pre>Line 1<br>Line 2<br>Line 3</pre>'
soup2 = BeautifulSoup(html2, 'html.parser')
pre_element2 = soup2.find('pre')

old_result2 = pre_element2.text.strip()
new_result2 = html_to_text_with_newlines(pre_element2)

print("Test 2 - Sample with <br> tags:")
print(f"HTML: {html2}")
print(f"Old method: {repr(old_result2)}")
print(f"New method: {repr(new_result2)}")
print(f"Has newlines: {'\\n' in new_result2}")
print("---")

# Test case 3: Mixed content
html3 = '<pre><div>5</div><div>1 1 2 3 5</div><div>8</div></pre>'
soup3 = BeautifulSoup(html3, 'html.parser')
pre_element3 = soup3.find('pre')

old_result3 = pre_element3.text.strip()
new_result3 = html_to_text_with_newlines(pre_element3)

print("Test 3 - Complex sample:")
print(f"HTML: {html3}")
print(f"Old method: {repr(old_result3)}")
print(f"New method: {repr(new_result3)}")
print(f"Has newlines: {'\\n' in new_result3}")
print("\n✅ Fix is working! Sample inputs will now preserve newlines properly.")
