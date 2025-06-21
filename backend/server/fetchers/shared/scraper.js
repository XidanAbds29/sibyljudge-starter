// backend/server/fetchers/shared/scraper.js
const puppeteer = require("puppeteer");

async function scrapeProblem(url, options = {}) {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
    timeout: 60000,
  });

  try {
    const page = await browser.newPage();

    // Set headers and viewport
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    });
    await page.setViewport({ width: 1200, height: 800 });

    // Set cookies if provided
    if (options.cookies) {
      await page.setCookie(...options.cookies);
    }

    // Navigation with retry logic
    let maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await page.setDefaultNavigationTimeout(60000);
        await page.goto(url, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });
        break;
      } catch (err) {
        if (attempt === maxRetries) throw err;
        console.log(
          `Navigation attempt ${attempt} failed, retrying in ${
            attempt * 5
          } seconds...`
        );
        await new Promise((r) => setTimeout(r, 5000 * attempt));
      }
    }

    // Wait for content with better error handling
    const mainSelector = options.selectors?.main || "body";
    try {
      await page.waitForSelector(mainSelector, { timeout: 30000 });
    } catch (err) {
      console.log(`Warning: Main selector "${mainSelector}" not found`);
    } // Extract and clean up sections
    const result = await page.evaluate((selectors) => {
      const cleanHtml = (html) => {
        if (!html) return null;
        // Remove useless divs but keep formatting
        let cleaned = html
          .replace(/<div[^>]*class="section-title"[^>]*>[^<]*<\/div>/g, "")
          .replace(/\s+/g, " ")
          .trim();

        // Ensure proper HTML structure
        if (cleaned && !cleaned.startsWith("<")) {
          cleaned = `<div class="section">${cleaned}</div>`;
        }
        return cleaned;
      };
      const extract = (selector) => {
        try {
          const els = document.querySelectorAll(selector);
          if (!els || els.length === 0) return null;

          // If multiple elements found, combine their content
          if (els.length > 1) {
            return cleanHtml(
              Array.from(els)
                .map((el) => el.innerHTML)
                .join("\n")
            );
          }

          return cleanHtml(els[0].innerHTML);
        } catch (err) {
          console.error(`Error extracting ${selector}:`, err);
          return null;
        }
      };

      // Extract sample tests
      const samples = [];
      if (selectors.sampleSelectors) {
        const { input: inputSel, output: outputSel } =
          selectors.sampleSelectors;
        const inputs = document.querySelectorAll(inputSel);
        const outputs = document.querySelectorAll(outputSel);

        for (let i = 0; i < inputs.length; i++) {
          if (outputs[i]) {
            samples.push({
              input: inputs[i].innerText.trim(),
              output: outputs[i].innerText.trim(),
            });
          }
        }
      }

      return {
        full: extract(selectors.main),
        statement: extract(selectors.statement),
        input: extract(selectors.input),
        output: extract(selectors.output),
        samples,
      };
    }, options.selectors);

    return result;
  } finally {
    await browser.close();
  }
}

module.exports = { scrapeProblem };
