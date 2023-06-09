const puppeteer = require("puppeteer");
const fs = require("fs");
const urlModule = require("url");

// Initialize results array
let results = [];

async function extractProductUrls(url) {
  // Launch the puppeteer browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Go to the given URL and wait until network is idle
  await page.goto(url, { waitUntil: "networkidle2" });

  // Extract product URLs from the page
  let productUrls = await page.evaluate(() => {
    let productLinks = Array.from(
      document.querySelectorAll("div._1AtVbE a._1fQZEK")
    ); // This selector might change, please inspect the webpage to confirm the correct one
    return productLinks.map((link) => link.href);
  });

  // Close the puppeteer browser
  await browser.close();

  // Save the product URLs
  results = results.concat(productUrls);

  // Write results to the JSON file
  fs.writeFileSync("ex-urls.json", JSON.stringify(results, null, 2));
}

// Define the entry point URL
const url =
  "https://www.flipkart.com/search?q=smartphones&otracker=search&otracker1=search&marketplace=FLIPKART&as-show=on&as=off&p%5B%5D=facets.price_range.from%3DMin&p%5B%5D=facets.price_range.to%3DMax";

// Extract product URLs
extractProductUrls(url);
