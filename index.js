require("dotenv").config();
const express = require("express");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const app = express();
const PORT = process.env.PORT || 3000;

puppeteer.use(StealthPlugin());

app.get("/nse-data", async (req, res) => {
  let browser;
  try {
    // 1. Launch browser with stealth plugin
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath:
        process.env.PUPPETEER_EXECUTABLE_PATH ||
        (process.platform === "win32"
          ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
          : "/usr/bin/google-chrome"),
    });

    const page = await browser.newPage();

    // 2. Set realistic desktop headers (looks like a normal user)
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/114.0.5735.199 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 768 });

    // 3. First visit homepage to establish session & set cookies
    await page.goto("https://www.nseindia.com", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 4. Inject cookies dynamically from environment variables
    await page.setCookie(
      {
        name: "nsit",
        value: process.env.NSIT || "dummy-nsit",
        domain: ".nseindia.com",
      },
      {
        name: "nseappid",
        value: process.env.NSEAPPID || "dummy-nseappid",
        domain: ".nseindia.com",
      }
    );

    // 5. Request the API endpoint with the correct session
    const response = await page.goto(
      "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY",
      {
        waitUntil: "networkidle2",
        timeout: 30000,
      }
    );

    // 6. Verify response is JSON
    const content = await response.text();
    if (!content.trim().startsWith("{")) {
      throw new Error(
        `Received HTML instead of JSON. Page title: ${await page.title()}`
      );
    }

    const data = JSON.parse(content);
    res.json(data);

  } catch (error) {
    console.error("Full Error:", error);
    res.status(500).json({
      error: "NSE scraping failed",
      details: error.message,
      solution: "Try again with fresh cookies after 15 minutes",
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));