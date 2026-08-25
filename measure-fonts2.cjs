const { chromium } = require('/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.js');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/ms-playwright/chromium-1187/chrome-linux/chrome'
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');

  const requestPriority = {};
  
  client.on('Network.requestWillBeSent', (params) => {
    if (params.request.url.includes('.woff2')) {
      requestPriority[params.request.url] = params.request.initialPriority || 'unknown';
    }
  });

  const fontRequests = {};
  
  client.on('Network.loadingFinished', async (params) => {
    // We'll get size from response body later
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.woff2')) {
      try {
        const body = await response.body();
        fontRequests[url] = body.length;
      } catch(e) {}
    }
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const sortedKeys = Object.keys(fontRequests).sort((a, b) => fontRequests[b] - fontRequests[a]);
  for (const url of sortedKeys) {
    const shortUrl = url.replace('http://localhost:3000', '');
    const priority = requestPriority[url] || 'unknown';
    console.log(`${fontRequests[url]} bytes | priority: ${priority} | ${shortUrl}`);
  }

  await browser.close();
})();
