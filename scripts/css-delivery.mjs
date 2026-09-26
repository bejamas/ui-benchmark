#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright-core';
import { benchmarkRoot, projects, resultsDir } from './benchmark-config.mjs';
import { startStaticServer } from './static-server.mjs';

const runs = Number(process.env.CSS_RUNS ?? 3);
assert(Number.isInteger(runs) && runs > 0, 'CSS_RUNS must be a positive integer');
const modes = ['simulate', 'devtools'];
const startedAt = new Date().toISOString();
const output = join(benchmarkRoot, '.benchmark-results', 'css-delivery', startedAt.replaceAll(':', '-'));
mkdirSync(output, { recursive: true });
const cases = projects.flatMap(project => ['baseline', 'inline'].map(delivery => ({
  ...project,
  id: `${project.id}-${delivery}`,
  projectId: project.id,
  delivery,
  buildDir: join(output, `${project.id}-${delivery}`),
})));

function build(delivery) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/build.mjs'], {
      cwd: benchmarkRoot,
      env: { ...process.env, BENCHMARK_INLINE_CSS: delivery === 'inline' ? '1' : '0' },
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Build failed: ${code}`)));
  });
}

await build('baseline');
for (const project of projects) {
  cpSync(project.buildDir, cases.find(c => c.projectId === project.id && c.delivery === 'baseline').buildDir, { recursive: true });
}
try {
  await build('inline');
  for (const project of projects) {
    cpSync(project.buildDir, cases.find(c => c.projectId === project.id && c.delivery === 'inline').buildDir, { recursive: true });
  }
} finally {
  // Keep the ordinary benchmark outputs on the freshly built baseline.
  for (const project of projects) {
    rmSync(project.buildDir, { recursive: true, force: true });
    cpSync(cases.find(c => c.projectId === project.id && c.delivery === 'baseline').buildDir, project.buildDir, { recursive: true });
  }
}

const server = await startStaticServer({ projectList: cases });
let chrome;
const samples = [];
const verification = [];
const settings = {};
try {
  chrome = await launch({
    ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP *.localhost 127.0.0.1'],
  });
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
  const baselineText = new Map();
  for (const entry of cases) {
    const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 });
    try {
      const page = await context.newPage();
      const errors = [];
      const cssRequests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('request', request => { if (request.resourceType() === 'stylesheet') cssRequests.push(request.url()); });
      await page.goto(server.urls[entry.id], { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
      if (entry.delivery === 'baseline') baselineText.set(entry.projectId, text);
      else assert.equal(text, baselineText.get(entry.projectId), `${entry.id}: visible text changed`);
      await page.screenshot({ path: join(output, `${entry.id}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Products', exact: true }).click();
      await page.getByRole('link', { name: /Analytics/ }).waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await page.getByRole('tab', { name: 'Yearly', exact: true }).click();
      await page.getByText('$278', { exact: false }).waitFor({ state: 'visible' });
      assert.deepEqual(errors, [], `${entry.id}: browser errors`);
      if (entry.delivery === 'inline') assert.equal(cssRequests.length, 0, `${entry.id}: external CSS still requested`);
      else assert(cssRequests.length > 0, `${entry.id}: baseline has no external CSS`);
      const html = readFileSync(join(entry.buildDir, 'index.html'));
      verification.push({ id: entry.id, htmlSha256: createHash('sha256').update(html).digest('hex'), htmlBytes: html.byteLength, htmlGzipBytes: gzipSync(html, { level: 9 }).byteLength, stylesheetRequests: cssRequests.map(url => new URL(url).pathname), visibleTextMatchesBaseline: true, navigationAndTabsPassed: true, browserErrors: errors });
      console.log(`Verified ${entry.id}: ${cssRequests.length} stylesheet requests`);
    } finally { await context.close(); }
  }
  await browser.close();
  for (const mode of modes) {
    for (let run = 0; run < runs; run++) {
      const offset = run % cases.length;
      const order = [...cases.slice(offset), ...cases.slice(0, offset)];
      for (const entry of order) {
        const result = await lighthouse(server.urls[entry.id], {
          port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'],
          formFactor: 'mobile', throttlingMethod: mode, maxWaitForLoad: 45_000,
        });
        assert(result && !result.lhr.runtimeError, `${entry.id}: Lighthouse failed`);
        settings[mode] ??= result.lhr.configSettings;
        const cssRequests = result.lhr.audits['network-requests'].details.items.filter(r => r.resourceType === 'Stylesheet');
        if (entry.delivery === 'inline') assert.equal(cssRequests.length, 0, `${entry.id}: audit fetched CSS`);
        const m = result.lhr.audits.metrics.details.items[0];
        const report = join(output, `${entry.id}-${mode}-${run + 1}.json`);
        writeFileSync(report, result.report);
        const sample = { id: entry.id, mode, run: run + 1, fcp: m.firstContentfulPaint, lcp: m.largestContentfulPaint, speedIndex: m.speedIndex, tbt: m.totalBlockingTime, cls: m.cumulativeLayoutShift, report: relative(benchmarkRoot, report) };
        for (const metric of ['fcp', 'lcp', 'speedIndex', 'tbt', 'cls']) assert(Number.isFinite(sample[metric]), `Missing ${metric}`);
        samples.push(sample);
        writeFileSync(join(output, 'samples.json'), `${JSON.stringify(samples, null, 2)}\n`);
        console.log(JSON.stringify(sample));
      }
    }
  }
} finally {
  if (chrome) await chrome.kill();
  await server.close();
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
const summaries = modes.flatMap(mode => cases.map(entry => {
  const selected = samples.filter(s => s.id === entry.id && s.mode === mode);
  return { id: entry.id, name: entry.name, delivery: entry.delivery, mode, metrics: Object.fromEntries(['fcp', 'lcp', 'speedIndex', 'tbt', 'cls'].map(metric => {
    const values = selected.map(s => s[metric]);
    return [metric, { median: median(values), min: Math.min(...values), max: Math.max(...values) }];
  })) };
}));
const report = {
  startedAt, completedAt: new Date().toISOString(), runsPerCasePerMode: runs,
  environment: { node: process.version, lighthouse: JSON.parse(readFileSync(join(benchmarkRoot, 'node_modules/lighthouse/package.json'), 'utf8')).version },
  methodology: 'Native production builds: Astro build.inlineStylesheets=always; Next experimental.inlineCss=true. Baseline uses framework defaults. All six cases use one gzip server, cold navigation, mobile viewport, sequential audits and rotating case order. Both throttling modes are lab approximations. No script-priority changes. Generated baseline output is restored after building inline cases.',
  settings, verification, summaries, samples,
};
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, 'css-delivery.json'), `${JSON.stringify(report, null, 2)}\n`);
const lines = [
  '# CSS delivery comparison', '',
  `Measured ${report.completedAt}. Medians of ${runs} sequential runs per case and throttling mode.`, '',
  report.methodology, '',
  'These are cold-load lab results. They do not measure repeat-visit caching or field performance. Next.js CSS inlining is experimental in the pinned version.', '',
];
for (const mode of modes) {
  lines.push(`## ${mode === 'simulate' ? 'Simulated throttling' : 'Applied DevTools throttling'}`, '', '| Implementation | CSS | FCP | LCP | Speed Index | FCP range |', '|---|---|---:|---:|---:|---:|');
  for (const row of summaries.filter(s => s.mode === mode)) {
    const seconds = value => `${(value / 1000).toFixed(2)} s`;
    lines.push(`| ${row.name} | ${row.delivery} | ${seconds(row.metrics.fcp.median)} | ${seconds(row.metrics.lcp.median)} | ${seconds(row.metrics.speedIndex.median)} | ${seconds(row.metrics.fcp.min)} to ${seconds(row.metrics.fcp.max)} |`);
  }
  lines.push('');
}
lines.push('## Verification', '', 'All inline variants made zero stylesheet requests, including during hydration and the navigation-menu and pricing-tab checks. Each inline variant retained its baseline visible text and produced no browser errors. Full-page screenshots and Lighthouse reports are saved with the build snapshots.', '', '[Raw samples, build hashes, settings, and verification](css-delivery.json).', '', 'Run `npm run performance:css` to rebuild and repeat the comparison. Set `CSS_RUNS` to change the default three runs.', '', 'Framework references: [Astro stylesheet inlining](https://docs.astro.build/en/guides/styling/) and [Next.js inlineCss](https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss).', '');
writeFileSync(join(resultsDir, 'css-delivery.md'), lines.join('\n'));
console.log('Wrote results/css-delivery.json and results/css-delivery.md');
