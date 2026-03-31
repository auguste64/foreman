import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = 'C:/Users/Auguste/foreman';

async function audit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to', BASE_URL);
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Full-page screenshot
  await page.screenshot({ path: SCREENSHOT_DIR + '/landing_full.png', fullPage: true });
  console.log('Full-page screenshot saved.');

  // Get total page height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  let scrollY = 0;
  let sIdx = 1;

  while (scrollY < pageHeight) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollY);
    await page.waitForTimeout(600);
    await page.screenshot({ path: SCREENSHOT_DIR + `/landing_s${sIdx}.png` });
    console.log(`Screenshot s${sIdx} at scrollY=${scrollY}`);
    scrollY += 900;
    sIdx++;
    if (sIdx > 20) break;
  }

  // Reset scroll
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Extract text content
  const textData = await page.evaluate(() => {
    const results = {};

    results.headings = [];
    document.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(el => {
      results.headings.push({
        tag: el.tagName,
        text: el.innerText.trim(),
        classes: el.className,
      });
    });

    results.paragraphs = [];
    document.querySelectorAll('p').forEach(el => {
      const t = el.innerText.trim();
      if (t.length > 0) results.paragraphs.push(t);
    });

    results.ctas = [];
    document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
      const t = el.innerText.trim();
      if (t.length > 0 && t.length < 200) {
        results.ctas.push({
          tag: el.tagName,
          text: t,
          href: el.href || null,
          classes: el.className,
        });
      }
    });

    results.navItems = [];
    document.querySelectorAll('nav a, header a').forEach(el => {
      const t = el.innerText.trim();
      if (t) results.navItems.push({ text: t, href: el.href });
    });

    results.spans = [];
    document.querySelectorAll('span').forEach(el => {
      const t = el.innerText.trim();
      if (t.length > 2 && t.length < 100) results.spans.push(t);
    });

    return results;
  });

  console.log('\n=== TEXT CONTENT ===');
  console.log(JSON.stringify(textData, null, 2));

  // Extract colors
  const colorData = await page.evaluate(() => {
    const colors = {};
    const elements = {
      body: document.body,
      nav: document.querySelector('nav, header'),
      h1: document.querySelector('h1'),
      h2: document.querySelector('h2'),
      mainBtn: document.querySelector('button'),
    };

    for (const [key, el] of Object.entries(elements)) {
      if (!el) { colors[key] = null; continue; }
      const s = window.getComputedStyle(el);
      colors[key] = {
        background: s.backgroundColor,
        color: s.color,
        fontSize: s.fontSize,
        fontFamily: s.fontFamily,
        fontWeight: s.fontWeight,
      };
    }

    const bgColors = new Set();
    document.querySelectorAll('*').forEach(el => {
      const bg = window.getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') bgColors.add(bg);
    });
    colors.uniqueBackgrounds = [...bgColors].slice(0, 30);

    const textColors = new Set();
    document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,li').forEach(el => {
      textColors.add(window.getComputedStyle(el).color);
    });
    colors.uniqueTextColors = [...textColors].slice(0, 20);

    return colors;
  });

  console.log('\n=== COLOR DATA ===');
  console.log(JSON.stringify(colorData, null, 2));

  // Images
  const images = await page.evaluate(() => {
    const imgs = [];
    document.querySelectorAll('img, svg').forEach(el => {
      if (el.tagName === 'IMG') {
        imgs.push({ type: 'img', src: el.src, alt: el.alt, width: el.naturalWidth, height: el.naturalHeight });
      } else if (el.tagName === 'SVG') {
        imgs.push({ type: 'svg', id: el.id, classes: (el.className?.baseVal || el.className || '').toString().substring(0, 80) });
      }
    });
    return imgs;
  });

  console.log('\n=== IMAGES ===');
  console.log(JSON.stringify(images, null, 2));

  // Animations
  const animations = await page.evaluate(() => {
    const animated = [];
    document.querySelectorAll('*').forEach(el => {
      const s = window.getComputedStyle(el);
      if (
        (s.animationName && s.animationName !== 'none') ||
        (s.transition && s.transition !== 'all 0s ease 0s' && s.transition !== 'none 0s ease 0s 0s' && s.transition !== 'none')
      ) {
        animated.push({
          tag: el.tagName,
          id: el.id,
          classes: (el.className || '').toString().substring(0, 100),
          animation: s.animationName,
          transition: s.transition,
        });
      }
    });
    return animated.slice(0, 60);
  });

  console.log('\n=== ANIMATIONS ===');
  console.log(JSON.stringify(animations, null, 2));

  // Meta
  const meta = await page.evaluate(() => {
    return {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.content,
      ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    };
  });
  console.log('\n=== META ===');
  console.log(JSON.stringify(meta, null, 2));

  // HTML structure summary
  const htmlStructure = await page.evaluate(() => {
    function summarize(el, depth = 0) {
      if (depth > 5) return null;
      const tag = el.tagName?.toLowerCase();
      if (!tag) return null;
      const skipTags = ['script', 'style', 'meta', 'link'];
      if (skipTags.includes(tag)) return null;
      const node = {
        tag,
        id: el.id || undefined,
        classes: (el.className || '').toString().substring(0, 80) || undefined,
        text: depth >= 3 ? (el.innerText || '').trim().substring(0, 60) || undefined : undefined,
      };
      const children = [];
      for (const child of el.children) {
        const s = summarize(child, depth + 1);
        if (s) children.push(s);
      }
      if (children.length) node.children = children;
      return node;
    }
    return summarize(document.body, 0);
  });

  console.log('\n=== HTML STRUCTURE ===');
  console.log(JSON.stringify(htmlStructure, null, 2));

  console.log('\nTotal screenshots taken:', sIdx - 1);
  await browser.close();
}

audit().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
