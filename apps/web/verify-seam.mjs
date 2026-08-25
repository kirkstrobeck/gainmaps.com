// Seam slider regression test — runs against the already-running dev/prod server.
// Usage: node apps/web/verify-seam.mjs
import { chromium } from '@playwright/test';
import { mkdirSync, readdirSync } from 'fs';
import path from 'path';

const BASE      = 'http://127.0.0.1:3000';

function findChromium() {
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH ?? '/ms-playwright';
  const entries = readdirSync(base);
  const dir = entries.find(e => e.startsWith('chromium-') && !e.includes('headless'));
  if (!dir) { throw new Error(`No chromium-* dir in ${base}`); }
  return path.join(base, dir, 'chrome-linux', 'chrome');
}
const CHROME = findChromium();
const REPORT    = '/workspace/reports/land';
mkdirSync(REPORT, { recursive: true });

let failures = 0;
const ok   = (lbl, note = '') => console.log(`  OK   ${lbl}${note ? '  ' + note : ''}`);
const fail = (lbl, note = '') => { console.log(`  FAIL ${lbl}${note ? '  ' + note : ''}`); failures++; };
function near(a, b, tol, lbl) {
  const d = Math.abs(a - b);
  d > tol ? fail(lbl, `|${a.toFixed(2)}-${b.toFixed(2)}|=${d.toFixed(2)} > ${tol}`)
           : ok(lbl, `${a.toFixed(2)}≈${b.toFixed(2)} ±${tol}px`);
}

async function measure(page, idx) {
  return page.evaluate(i => {
    const inst   = document.querySelectorAll('.inst')[i];
    const seam   = inst.querySelector('.inst-seam');
    const handle = inst.querySelector('.inst-handle');
    const ir = inst.getBoundingClientRect();
    const sr = seam.getBoundingClientRect();
    const hr = handle.getBoundingClientRect();
    return {
      inst:   { left: ir.left, width: ir.width },
      seam:   { cx: sr.left + sr.width  / 2 },
      handle: { cx: hr.left + hr.width  / 2 },
    };
  }, idx);
}

async function runViewport(browser, w, h, label) {
  console.log(`\n${'═'.repeat(56)}`);
  console.log(`Viewport: ${label}  ${w}×${h}`);
  console.log('═'.repeat(56));

  const ctx  = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const msgs = [];
  page.on('console',   m => msgs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', e => msgs.push(`[pageerror] ${e.message}`));

  await page.goto(BASE, { waitUntil: 'networkidle' });
  const n = await page.locator('.inst').count();
  console.log(`${n} .inst elements`);

  for (let i = 0; i < n; i++) {
    console.log(`\n─── instrument ${i} ───`);

    // ── 1. First paint ──────────────────────────────────────────
    const m0  = await measure(page, i);
    const mid = m0.inst.left + m0.inst.width / 2;
    console.log(`  container left=${m0.inst.left.toFixed(1)} width=${m0.inst.width.toFixed(1)} mid=${mid.toFixed(1)}`);
    console.log(`  seam.cx=${m0.seam.cx.toFixed(1)}  handle.cx=${m0.handle.cx.toFixed(1)}`);
    near(m0.handle.cx, m0.seam.cx, 2, 'handle≈seam (first paint)');
    near(m0.seam.cx,   mid,        2, 'seam≈midpoint (first paint)');
    near(m0.handle.cx, mid,        2, 'handle≈midpoint (first paint)');

    // ── 2. Drag to 25% ──────────────────────────────────────────
    const ib = await page.locator('.inst').nth(i).boundingBox();
    const hb = await page.locator('.inst').nth(i).locator('.inst-handle').boundingBox();
    const sx  = hb.x + hb.width  / 2;
    const sy  = hb.y + hb.height / 2;
    const tx  = ib.x + ib.width  * 0.25;

    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(tx, sy, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(120);

    const m1   = await measure(page, i);
    const ex25 = m0.inst.left + m0.inst.width * 0.25;
    console.log(`  after drag → 25%: seam.cx=${m1.seam.cx.toFixed(1)} handle.cx=${m1.handle.cx.toFixed(1)} expected=${ex25.toFixed(1)}`);
    near(m1.handle.cx, ex25,          3, 'handle at 25% after drag');
    near(m1.seam.cx,   m1.handle.cx,  2, 'seam≈handle after drag');

    await page.screenshot({ path: path.join(REPORT, `${label}-inst${i}-drag.png`) });
    console.log(`  screenshot → reports/land/${label}-inst${i}-drag.png`);

    // ── 3. Corner buttons ────────────────────────────────────────
    await page.locator('.inst').nth(i).getByRole('button', { name: 'Show Standard' }).click();
    await page.waitForTimeout(400);
    const m2   = await measure(page, i);
    const ex100 = m0.inst.left + m0.inst.width;
    console.log(`  after SDR:   handle.cx=${m2.handle.cx.toFixed(1)}  expected≈${ex100.toFixed(1)}`);
    near(m2.handle.cx, ex100, m0.inst.width * 0.04, 'handle at ~100% after SDR');

    await page.locator('.inst').nth(i).getByRole('button', { name: 'Show Ultra' }).click();
    await page.waitForTimeout(400);
    const m3  = await measure(page, i);
    const ex0 = m0.inst.left;
    console.log(`  after Ultra: handle.cx=${m3.handle.cx.toFixed(1)}  expected≈${ex0.toFixed(1)}`);
    near(m3.handle.cx, ex0, m0.inst.width * 0.04, 'handle at ~0% after Ultra');
  }

  // ── 4. Console messages ──────────────────────────────────────
  console.log('\n─── console messages ───');
  if (msgs.length === 0) { console.log('  zero console messages'); }
  else                   { msgs.forEach(m => console.log(' ', m)); }

  // ── 5. Hero images ───────────────────────────────────────────
  console.log('\n─── hero instrument images ───');
  const imgs = await page.evaluate(() => {
    const inst = document.querySelector('.inst');
    if (!inst) return [];
    return Array.from(inst.querySelectorAll('img')).map(img =>
      ({ src: img.src, w: img.naturalWidth, h: img.naturalHeight })
    );
  });
  if (!imgs.length) { console.log('  (no <img> in first .inst)'); }
  for (const img of imgs) {
    console.log(`  src=${img.src}  naturalWidth=${img.w}  naturalHeight=${img.h}`);
    img.w > 0 ? ok(`naturalWidth=${img.w} > 0`) : fail(`naturalWidth=0`, img.src);
  }

  await ctx.close();
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
try {
  await runViewport(browser, 1440, 900, 'desktop');
  await runViewport(browser, 390,  844, 'mobile');
} finally {
  await browser.close();
}

console.log(`\n${'═'.repeat(56)}`);
if (failures > 0) {
  console.log(`FAILED — ${failures} assertion(s)`);
  process.exit(1);
} else {
  console.log('ALL ASSERTIONS PASSED');
}
