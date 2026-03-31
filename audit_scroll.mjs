import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const DIR = 'C:/Users/Auguste/foreman';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Trigger all reveal animations by scrolling
  const pageHeight = await page.evaluate(() => document.querySelector('.lp-wrapper')?.scrollHeight || document.body.scrollHeight);
  console.log('Page height:', pageHeight);

  // Full page screenshot - scroll lp-wrapper
  await page.evaluate(() => {
    const el = document.querySelector('.lp-wrapper');
    if (el) el.scrollTop = 0;
  });
  await page.waitForTimeout(500);

  // Take screenshots by scrolling the lp-wrapper div
  const wrapperHeight = await page.evaluate(() => {
    const el = document.querySelector('.lp-wrapper');
    return el ? el.scrollHeight : 0;
  });
  console.log('Wrapper scroll height:', wrapperHeight);

  let sIdx = 1;
  let scrollTop = 0;
  const increment = 900;

  while (scrollTop < wrapperHeight) {
    await page.evaluate((y) => {
      const el = document.querySelector('.lp-wrapper');
      if (el) el.scrollTop = y;
    }, scrollTop);
    await page.waitForTimeout(700);
    await page.screenshot({ path: DIR + `/landing_s${sIdx}.png` });
    console.log(`s${sIdx} at scrollTop=${scrollTop}`);
    scrollTop += increment;
    sIdx++;
    if (sIdx > 20) break;
  }

  // Full page - use clip approach per section
  await page.evaluate(() => {
    const el = document.querySelector('.lp-wrapper');
    if (el) el.scrollTop = 0;
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: DIR + '/landing_full.png', fullPage: false });

  console.log('Done, screenshots:', sIdx - 1);
  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
