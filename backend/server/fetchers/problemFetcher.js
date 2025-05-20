// backend/server/fetchers/problemFetcher.js
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const axios = wrapper(axios.create());
const pool = require('../db');
const { fetchCodeforces } = require('./codeforces');
const { fetchAtCoder } = require('./atcoder');
const { fetchSpoj } = require('./spoj');
const { fetchCodeChef } = require('./codechef');

const delay = ms => new Promise(r => setTimeout(r, ms));

async function fetchProblemHtml(url, selector, options = {}) {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Set cookie if provided
    if (options.cookie) {
      await page.setCookie(...options.cookie);
    }

    await page.goto(url, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for the selector
    await page.waitForSelector(selector);

    // Get the entire problem content
    const content = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.outerHTML : null;
    }, selector);

    if (!content) {
      throw new Error(`Content not found for selector: ${selector}`);
    }

    return content;
  } finally {
    await browser.close();
  }
}

function parseCodeforcesHtml(html) {
  const $ = cheerio.load(html);
  const problemStatement = $('.problem-statement');

  // Extract sections
  const header = problemStatement.children().first();
  const mainStatement = problemStatement.find('.input-specification').prev();
  const inputSpec = problemStatement.find('.input-specification');
  const outputSpec = problemStatement.find('.output-specification');
  const samples = problemStatement.find('.sample-test .sample-test');
  
  // Parse samples
  const sampleTests = [];
  samples.each((i, elem) => {
    const input = $(elem).find('.input pre').text().trim();
    const output = $(elem).find('.output pre').text().trim();
    sampleTests.push({ input, output });
  });

  return {
    title: header.find('.title').text().trim(),
    timeLimit: header.find('.time-limit').text().replace('time limit per test', '').trim(),
    memoryLimit: header.find('.memory-limit').text().replace('memory limit per test', '').trim(),
    statement: mainStatement.html(),
    inputSpecification: inputSpec.html(),
    outputSpecification: outputSpec.html(),
    samples: sampleTests
  };
}

function parseAtCoderHtml(html) {
  const $ = cheerio.load(html);
  const part = $('.part');

  // Find sections
  const statement = part.find('#task-statement').html();
  const constraints = part.find('#task-constraints').html();
  const input = part.find('#task-input').html();
  const output = part.find('#task-output').html();

  // Parse samples
  const sampleTests = [];
  let i = 1;
  while (true) {
    const inputPre = $(`#pre-sample${i}`);
    const outputPre = $(`#pre-sample${i}-output`);
    if (!inputPre.length || !outputPre.length) break;
    
    sampleTests.push({
      input: inputPre.text().trim(),
      output: outputPre.text().trim()
    });
    i++;
  }

  return {
    statement,
    constraints,
    inputSpecification: input,
    outputSpecification: output,
    samples: sampleTests
  };
}

function parseSpojHtml(html) {
  const $ = cheerio.load(html);
  const problemBody = $('#problem-body');
  
  // SPOJ usually has everything in one block
  // We'll try to split it based on common patterns
  let content = problemBody.html() || '';
  
  // Look for common section indicators
  const inputStart = content.indexOf('Input');
  const outputStart = content.indexOf('Output');
  const exampleStart = content.match(/Example|Sample/i);

  const sections = {
    statement: content.slice(0, inputStart).trim(),
    inputSpecification: content.slice(inputStart, outputStart).trim(),
    outputSpecification: content.slice(outputStart, exampleStart ? exampleStart.index : undefined).trim(),
  };

  // Try to extract samples from pre tags
  const samples = [];
  problemBody.find('pre').each((i, elem) => {
    if (i % 2 === 0) {
      samples.push({
        input: $(elem).text().trim(),
        output: $(problemBody.find('pre').eq(i + 1)).text().trim()
      });
    }
  });

  return {
    ...sections,
    samples
  };
}

function parseCodeChefHtml(html) {
  const $ = cheerio.load(html);
  const problemStatement = $('.problem-statement');
  
  // Find standard sections
  const statement = problemStatement.find('.problem-statement__problem').html();
  const input = problemStatement.find('.problem-statement__input').html();
  const output = problemStatement.find('.problem-statement__output').html();
  const constraints = problemStatement.find('.problem-statement__constraints').html();
  
  // Parse samples
  const samples = [];
  problemStatement.find('.problem-statement__examples .example').each((i, elem) => {
    samples.push({
      input: $(elem).find('.example__input pre').text().trim(),
      output: $(elem).find('.example__output pre').text().trim()
    });
  });

  return {
    statement,
    inputSpecification: input,
    outputSpecification: output,
    constraints,
    samples
  };
}

async function fetchProblemDetails(url, judge, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let html;
        switch (judge) {
          case 'codeforces':
            html = await fetchProblemHtml(url, '.problem-statement');
            if (!html) throw new Error('No HTML content found');
            return parseCodeforcesHtml(html);
      
          case 'atcoder':
            html = await fetchProblemHtml(url, '#task-statement');
            return parseAtCoderHtml(html);
      
          case 'spoj':
            html = await fetchProblemHtml(url, '#problem-body');
            return parseSpojHtml(html);
      
          case 'codechef':
            html = await fetchProblemHtml(url, '.problem-statement', {
              cookie: [{ name: 'cookieconsent_dismissed', value: 'true', domain: '.codechef.com' }]
            });
            return parseCodeChefHtml(html);
      
          default:
            throw new Error(`Unsupported judge: ${judge}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) throw error;
        await delay(1000 * attempt);
      }
    }
}

async function fetchAllProblems() {
  try {
    // Clear existing problems
    await pool.query('DELETE FROM problem_tag');
    await pool.query('DELETE FROM submission');
    await pool.query('DELETE FROM problem');

    // Get all judges
    const { rows: judges } = await pool.query('SELECT * FROM online_judge');

    for (const judge of judges) {
      let problems = [];
      
      try {
        switch (judge.name.toLowerCase()) {
          case 'codeforces':
            problems = await fetchCodeforces(10);
            break;
          case 'atcoder':
            problems = await fetchAtCoder(10);
            break;
          case 'spoj':
            problems = await fetchSpoj(10);
            break;
          case 'codechef':
            problems = await fetchCodeChef(10);
            break;
          default:
            console.log(`Unsupported judge: ${judge.name}`);
            continue;
        }

        // Insert problems
        for (const prob of problems) {
          const result = await pool.query(
            `INSERT INTO problem (
              source_oj_id, external_id, title, url,
              difficulty, time_limit, mem_limit,
              statement_html, input_spec, output_spec, samples
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING problem_id`,
            [
              judge.judge_id,
              prob.problemId,
              prob.title,
              prob.url,
              prob.difficulty?.toString(),
              prob.timeLimit || 1000,
              prob.memoryLimit || 256000,              prob.statement || prob.sections?.statement || prob.statement_html,
              prob.input || prob.sections?.input || null,
              prob.output || prob.sections?.output || null,
              JSON.stringify(prob.samples || prob.sections?.samples || [])
            ]
          );

          // Insert tags if any
          if (prob.tags?.length) {
            for (const tagName of prob.tags) {
              // Insert tag if not exists
              const { rows } = await pool.query(
                `INSERT INTO tag (name) 
                VALUES ($1)
                ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                RETURNING tag_id`,
                [tagName]
              );
              
              // Link problem to tag
              await pool.query(
                `INSERT INTO problem_tag (problem_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING`,
                [result.rows[0].problem_id, rows[0].tag_id]
              );
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching from ${judge.name}:`, err);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error in fetchAllProblems:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { fetchProblemDetails, fetchAllProblems };
