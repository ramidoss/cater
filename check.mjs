/* Renders the built pages in a real browser and reports anything broken:
 * script errors, horizontal page overflow, and the interactions the design
 * depends on. Screenshots land in shots/ for eyeballing layout, which the
 * checks below cannot do.
 *
 *   node build.mjs && node check.mjs
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PROTO = 'file://' + process.cwd() + '/dist/north-prototype.html';
const STUDY = 'file://' + process.cwd() + '/dist/north-metric-system.html';

mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
let failures = 0;

function report(name, errors, overflow, extra = '') {
  const bad = errors.length || overflow;
  if (bad) failures++;
  const detail = [...errors, overflow ? 'HORIZONTAL PAGE OVERFLOW' : ''].filter(Boolean).join(' | ');
  console.log(`${bad ? 'FAIL' : ' ok '}  ${name}${detail ? '  — ' + detail : ''}${extra}`);
}

async function open(url, opts = {}) {
  const page = await browser.newPage({ deviceScaleFactor: 2, ...opts });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(url);
  await page.waitForTimeout(600);
  page.errors = errors;
  page.overflows = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  return page;
}

// ---- every view of the prototype renders ----------------------------------
{
  const page = await open(PROTO, { viewport: { width: 1560, height: 1000 } });
  const views = {
    overview: null,
    revenue: p => p.getByRole('button', { name: 'Revenue' }).first().click(),
    product: p => p.getByRole('button', { name: 'Product' }).first().click(),
    customers: p => p.getByRole('button', { name: 'Customers' }).first().click(),
    metric: async p => {
      await p.getByRole('button', { name: 'Product' }).first().click();
      await p.waitForTimeout(200);
      await p.locator('.mcard.is-clickable').first().click();
    },
    investigation: p => p.locator('.sig').first().click(),
    'inv-where': p => p.locator('.chips .chip', { hasText: 'Which segment caused it?' }).click(),
    'inv-step': p => p.locator('.chips .chip', { hasText: 'At which step?' }).click(),
    'inv-cohorts': p => p.locator('.chips .chip', { hasText: 'Is it affecting retention?' }).click(),
    'inv-who': p => p.locator('.chips .chip', { hasText: 'Which customers?' }).click(),
    'inv-together': p => p.locator('.chips .chip', { hasText: 'What changed at the same time?' }).click()
  };
  for (const [name, step] of Object.entries(views)) {
    page.errors.length = 0;
    try {
      if (step) await step(page);
      await page.waitForTimeout(450);
      await page.screenshot({ path: `shots/${name}.png`, fullPage: true });
      report(name, page.errors, await page.overflows());
    } catch (e) { failures++; console.log(`FAIL  ${name} — ${e.message.split('\n')[0]}`); }
  }
  await page.close();
}

// ---- both themes, and every width down to a phone -------------------------
for (const [name, url, opts] of [
  ['study', STUDY, { viewport: { width: 1280, height: 1000 } }],
  ['prototype · dark', PROTO, { viewport: { width: 1560, height: 1000 }, colorScheme: 'dark' }],
  ['study · dark', STUDY, { viewport: { width: 1280, height: 1000 }, colorScheme: 'dark' }],
  ['prototype · 1100', PROTO, { viewport: { width: 1100, height: 900 } }],
  ['prototype · 820', PROTO, { viewport: { width: 820, height: 900 } }],
  ['prototype · 420', PROTO, { viewport: { width: 420, height: 900 } }],
  ['study · 420', STUDY, { viewport: { width: 420, height: 900 } }]
]) {
  const page = await open(url, opts);
  await page.screenshot({ path: `shots/${name.replace(/[^a-z0-9]+/gi, '-')}.png`, fullPage: true });
  report(name, page.errors, await page.overflows());
  await page.close();
}

// ---- the interactions the design leans on ---------------------------------
{
  const page = await open(PROTO, { viewport: { width: 1560, height: 1000 } });
  const chart = page.locator('.card').filter({ hasText: 'Activation rate' }).first();

  await page.getByRole('button', { name: /Compare to previous period/ }).click();
  await page.waitForTimeout(400);
  const compared = await chart.locator('.viz-legend-item').count();

  // aim at the crosshair's own hit layer, scrolled into view, rather than
  // guessing at a point on the card
  const plot = chart.locator('rect[role="application"]').first();
  const box = await plot.boundingBox();
  await plot.hover({ position: { x: box.width * 0.3, y: box.height * 0.5 } });
  await page.waitForTimeout(300);
  const tip = await page.locator('.viz-tip.is-on').count();

  await page.getByRole('button', { name: 'Table', exact: true }).first().click();
  await page.waitForTimeout(250);
  const table = await page.locator('.viz-table table').first().isVisible();

  await page.getByRole('button', { name: /Compare to previous period/ }).click();
  await page.waitForTimeout(350);
  await page.locator('.anomaly.is-clickable').first().click();
  await page.waitForTimeout(400);
  const opened = (await page.locator('.finding-label').first().textContent()) === 'NORTH investigation';

  await page.getByRole('button', { name: 'Overview' }).first().click();
  await page.waitForTimeout(350);
  await chart.click();
  await page.waitForTimeout(250);
  const questions = await page.locator('.qbtn').allTextContents();
  const contextual = questions[0] === 'Why did activation drop?';

  const checks = {
    'previous-period overlay': compared === 2,
    'crosshair tooltip': tip > 0,
    'table view': table,
    'anomaly opens investigation': opened,
    'contextual Ask NORTH': contextual
  };
  for (const [name, ok] of Object.entries(checks)) {
    if (!ok) failures++;
    console.log(`${ok ? ' ok ' : 'FAIL'}  interaction · ${name}`);
  }
  report('interactions', page.errors, await page.overflows());
  await page.close();
}

await browser.close();
console.log(failures ? `\n${failures} failing` : '\nall checks passed');
process.exit(failures ? 1 : 0);
