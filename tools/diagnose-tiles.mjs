import { chromium } from "/workspace/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright/index.mjs";

const browser = await chromium.launch({
  executablePath: "/tmp/pw-browsers/chromium-1234/chrome-linux/chrome",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

async function measurePage(url) {
  const page = await context.newPage();
  console.log(`\n=== ${url} ===`);
  await page.goto(`http://localhost:3000${url}`, { waitUntil: "load", timeout: 60000 });
  // Scroll to trigger lazy loading
  await page.evaluate(async () => {
    await new Promise(r => {
      let y = 0;
      const step = () => { window.scrollBy(0, 400); y += 400; if (y < document.body.scrollHeight) requestAnimationFrame(step); else { window.scrollTo(0,0); r(); } };
      requestAnimationFrame(step);
    });
  });
  await page.waitForFunction(() => Array.from(document.querySelectorAll("img")).every(i => i.complete), { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll(".checkerboard"));
    return tiles.slice(0, 4).map(tile => {
      const tileRect = tile.getBoundingClientRect();
      const imgs = Array.from(tile.querySelectorAll("img"));
      return {
        tileRect: { x: tileRect.x, y: tileRect.y, w: tileRect.width, h: tileRect.height },
        imgs: imgs.map(img => {
          const r = img.getBoundingClientRect();
          const cs = getComputedStyle(img);
          return {
            src: img.src.split("/").slice(-3).join("/"),
            rect: { x: r.x, y: r.y, w: r.width, h: r.height },
            natural: { w: img.naturalWidth, h: img.naturalHeight },
            objectFit: cs.objectFit,
            objectPosition: cs.objectPosition,
            cssWidth: cs.width,
            cssHeight: cs.height,
          };
        }),
      };
    });
  });

  for (const tile of data) {
    console.log(`  tile: ${tile.tileRect.w.toFixed(1)}x${tile.tileRect.h.toFixed(1)}`);
    for (const img of tile.imgs) {
      console.log(`    img[${img.src}]:`);
      console.log(`      rect: ${img.rect.w.toFixed(1)}x${img.rect.h.toFixed(1)} at (${img.rect.x.toFixed(1)}, ${img.rect.y.toFixed(1)})`);
      console.log(`      natural: ${img.natural.w}x${img.natural.h}`);
      console.log(`      objectFit: ${img.objectFit}, cssW: ${img.cssWidth}, cssH: ${img.cssHeight}`);
      const clearL = img.rect.x - tile.tileRect.x;
      const clearR = (tile.tileRect.x + tile.tileRect.w) - (img.rect.x + img.rect.w);
      const clearT = img.rect.y - tile.tileRect.y;
      const clearB = (tile.tileRect.y + tile.tileRect.h) - (img.rect.y + img.rect.h);
      console.log(`      clearance L=${clearL.toFixed(1)} R=${clearR.toFixed(1)} T=${clearT.toFixed(1)} B=${clearB.toFixed(1)}`);
    }
  }

  // Also fetch SVG attrs for tesla and lego
  for (const svgPath of ["/logos/tesla/logo.svg", "/logos/lego/logo.svg"]) {
    try {
      const text = await page.evaluate(async (path) => {
        const r = await fetch(`http://localhost:3000${path}`);
        return r.text();
      }, svgPath);
      const widthMatch = text.match(/\bwidth="([^"]+)"/);
      const heightMatch = text.match(/\bheight="([^"]+)"/);
      const viewBoxMatch = text.match(/viewBox="([^"]+)"/);
      const paMatch = text.match(/preserveAspectRatio="([^"]+)"/);
      console.log(`  SVG ${svgPath}: width=${widthMatch?.[1]} height=${heightMatch?.[1]} viewBox=${viewBoxMatch?.[1]} preserveAspectRatio=${paMatch?.[1]}`);
    } catch(e) { console.log(`  SVG fetch error: ${e.message}`); }
  }

  await page.close();
}

await measurePage("/logos");
await measurePage("/logos/tesla");
await measurePage("/logos/lego");

await context.close();
await browser.close();
