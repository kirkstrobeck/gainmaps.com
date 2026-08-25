const { chromium } = require('/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.js');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/ms-playwright/chromium-1187/chrome-linux/chrome'
  });
  const page = await browser.newPage();
  const fontRequests = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('.woff2')) {
      try {
        const body = await response.body();
        fontRequests.push({ url: url.replace('http://localhost:3000', ''), transferSize: body.length });
      } catch(e) {}
    }
  });

  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  for (const r of fontRequests) {
    console.log(r.transferSize, r.url);
  }

  await browser.close();
})();
