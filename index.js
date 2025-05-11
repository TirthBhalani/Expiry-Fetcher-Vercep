const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/scrape', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    
    // Set cookies as headers for ALL requests
    await page.setExtraHTTPHeaders({
      'Cookie': 'nsit=bHd4teT68_aRCfOx5EXeeF-G; nseappid=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkubnNlIiwiYXVkIjoiYXBpLm5zZSIsImlhdCI6MTc0NjkzMTgzOSwiZXhwIjoxNzQ2OTM5MDM5fQ.KFhfTNMl1S6BQyKKzitcx1qS5ZM7DX_pZLSu6I3iLsg',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    // Bypass bot detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    // Make the request
    const response = await page.goto('https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });

    // Get response body
    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Scrape failed:', error);
    res.status(500).json({ 
      error: 'Scraping failed',
      details: error.message 
    });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/', (req, res) => {
  res.send('Hi! Go to /scrape to get data.');
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));