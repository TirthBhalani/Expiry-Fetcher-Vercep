const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/scrape', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'Cookie': 'nsit=YOUR_VALUE; nseappid=YOUR_VALUE',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    });

    const response = await page.goto('YOUR_TARGET_URL', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));