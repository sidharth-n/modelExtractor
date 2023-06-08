const puppeteer = require("puppeteer");
const request = require("request");
const fs = require("fs");
const urlModule = require("url");
const requestPromise = require("request-promise");

// Initialize results array
let results = [];

async function extract3DModel(url) {
  // Launch the puppeteer browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const parsedUrl = new urlModule.URL(url);
  // Extract PID and ITM from URL
  let urlParts = url.split("/");
  //let itm = urlParts[urlParts.length - 2].split("?")[0];
  let itm = urlParts[urlParts.length - 1].split("?")[0];
  let pid = parsedUrl.searchParams.get("pid");
  console.log("urlParts :" + urlParts);
  console.log("itm : " + itm);
  console.log("pid : " + pid);
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
    const fileName = `${itm}-${pid}.glb`;
    request(modelUrls[0])
      .pipe(fs.createWriteStream(fileName))
      .on("close", () => {
        console.log(`${fileName} downloaded successfully.`);
        results.push({
          url: url,
          hasModel: true,
          downloaded: true,
          fileName: fileName,
        });
        // Write the results to a JSON file
        fs.writeFileSync("results.json", JSON.stringify(results, null, 4));
      });
  } else {
    results.push({
      url: url,
      hasModel: false,
      downloaded: false,
      fileName: null,
    });
    // Write the results to a JSON file
    fs.writeFileSync("results.json", JSON.stringify(results, null, 4));
  }
}

extract3DModel(
  "https://www.flipkart.com/nothing-phone-1-black-256-gb/p/itmeea53a564de47?pid=MOBGCYGPWXYRRNB4&lid=LSTMOBGCYGPWXYRRNB426WTZ8&marketplace=FLIPKART&store=tyy%2F4io&pageUID=1686205138161"
);
