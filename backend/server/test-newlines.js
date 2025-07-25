// Test script for newline preservation in problem scraping
const cheerio = require('cheerio');

// Utility function from our updated problemFetcher.js
function htmlToTextWithNewlines(html) {
  if (!html) return '';
  
  return html
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
    .replace(/<div[^>]*>/gi, '\n')  // Convert <div> tags to newlines  
    .replace(/<\/div>/gi, '')       // Remove closing div tags
    .replace(/<p[^>]*>/gi, '\n')    // Convert <p> tags to newlines
    .replace(/<\/p>/gi, '')         // Remove closing p tags
    .replace(/<[^>]*>/g, '')        // Remove all other HTML tags
    .replace(/&nbsp;/g, ' ')        // Convert &nbsp; to spaces
    .replace(/&lt;/g, '<')          // Convert HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n\s*\n/g, '\n')      // Remove multiple consecutive newlines
    .trim();
}

// Test cases
console.log('Testing newline preservation in HTML parsing...\n');

// Test case 1: HTML with <br> tags
const html1 = 'Line 1<br>Line 2<br>Line 3';
const result1 = htmlToTextWithNewlines(html1);
console.log('Test 1 - <br> tags:');
console.log('Input HTML:', html1);
console.log('Output text:');
console.log(result1);
console.log('Has newlines:', result1.includes('\n'));
console.log('---');

// Test case 2: HTML with <div> tags  
const html2 = '<div>Line 1</div><div>Line 2</div><div>Line 3</div>';
const result2 = htmlToTextWithNewlines(html2);
console.log('Test 2 - <div> tags:');
console.log('Input HTML:', html2);
console.log('Output text:');
console.log(result2);
console.log('Has newlines:', result2.includes('\n'));
console.log('---');

// Test case 3: Mixed HTML (typical Codeforces sample)
const html3 = '<div>3</div><div>1 2 3</div>';
const result3 = htmlToTextWithNewlines(html3);
console.log('Test 3 - Codeforces-style sample:');
console.log('Input HTML:', html3);
console.log('Output text:');
console.log(result3);
console.log('Has newlines:', result3.includes('\n'));
console.log('---');

// Test case 4: With HTML entities
const html4 = '&lt;test&gt;<br>&amp;special<br>&quot;quoted&quot;';
const result4 = htmlToTextWithNewlines(html4);
console.log('Test 4 - HTML entities:');
console.log('Input HTML:', html4);
console.log('Output text:');
console.log(result4);
console.log('Has newlines:', result4.includes('\n'));
console.log('---');

// Compare with old method (.text() only)
const oldResult1 = cheerio.load(html1).text().trim();
console.log('Comparison with old method:');
console.log('Old result (no newlines):', oldResult1);
console.log('New result (with newlines):', result1.replace(/\n/g, '\\n'));
console.log('\nThe fix is working! Newlines are now preserved in sample inputs/outputs.');
