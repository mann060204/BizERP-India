const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_PAGE_ERROR:', error.message));
  try {
    await page.goto('http://localhost:3000/dashboard/customers/new', { waitUntil: 'networkidle0' });
  } catch (err) {
    console.log('NAVI_ERROR:', err);
  }
  await browser.close();
})();
