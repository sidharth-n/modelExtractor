const puppeteer = require("puppeteer");
const request = require("request");
const fs = require("fs");
const urlModule = require("url");
const path = require("path");
const requestPromise = require("request-promise");

// Initialize results array
let results = [];

async function extract3DModel(url) {
  const parsedUrl = new urlModule.URL(url);

  // Extract PID and ITM from URL
  let urlParts = url.split("/");
  let itm = urlParts[urlParts.length - 1].split("?")[0];
  let pid = parsedUrl.searchParams.get("pid");

  // Create the Flipkart directory if it doesn't exist
  const directoryPath = path.join(__dirname, "flipkart");
  fs.mkdirSync(directoryPath, { recursive: true });

  const fileName = `${itm}-${pid}.glb`;
  const filePath = path.join(directoryPath, fileName);

  // Check if the model is already downloaded
  const existingResults = JSON.parse(fs.readFileSync("results.json", "utf8"));
  if (existingResults.some((result) => result.fileName === fileName)) {
    console.log(`Model ${fileName} already exists.`);
    return;
  }

  // Launch the puppeteer browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  // Search for 3D model URL
  const modelUrls = await page.evaluate(() => {
    let urls = [];
    // Get all script tags in the document
    let scripts = Array.from(document.getElementsByTagName("script"));
    scripts.forEach((script) => {
      if (script.innerText.includes(".glb")) {
        // Extract URLs ending with '.glb' from the scripts
        let matches = script.innerText.match(/https?:\/\/[^"' ]+\.glb/g);
        if (matches) {
          urls = urls.concat(matches);
        }
      }
    });
    return urls;
  });

  // Close the puppeteer browser
  await browser.close();

  // Download 3D model if available
  if (modelUrls.length > 0) {
    request(modelUrls[0])
      .pipe(fs.createWriteStream(filePath))
      .on("close", () => {
        console.log(`${fileName} downloaded successfully.`);
        results.push({
          url: url,
          hasModel: true,
          downloaded: true,
          fileName: fileName,
        });
        // Append the results to the JSON file
        fs.writeFileSync(
          "results.json",
          JSON.stringify([...existingResults, ...results], null, 4)
        );
      });
  } else {
    console.log(`${fileName} model not found !`);
    results.push({
      url: url,
      hasModel: false,
      downloaded: false,
      fileName: fileName,
    });
    // Append the results to the JSON file
    fs.writeFileSync(
      "results.json",
      JSON.stringify([...existingResults, ...results], null, 4)
    );
  }
}

// Load URLs from JSON file
const urls = JSON.parse(fs.readFileSync("urls.json", "utf8"));

// Iterate through each URL and extract the 3D model
urls.forEach((url) => extract3DModel(url));
