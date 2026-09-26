#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { parse } from 'parse5';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { basename, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright-core';
import { benchmarkRoot, projects, resultsDir, readProjectVersions } from './benchmark-config.mjs';
import { startStaticServer } from './static-server.mjs';

const runs = Number(process.env.FCP_SIZE_RUNS ?? 3);
assert(Number.isInteger(runs) && runs > 0, 'FCP_SIZE_RUNS must be positive');
const startedAt = new Date().toISOString();
const output = join(benchmarkRoot, '.benchmark-results/fcp-size', startedAt.replaceAll(':', '-'));
mkdirSync(output, { recursive: true });
const source = join(benchmarkRoot, 'astro-bui');
const baseline = readFileSync(join(source, 'dist/index.html'), 'utf8');
const stylesheet = baseline.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/)[1];
const originalCss = readFileSync(join(source, 'dist', stylesheet), 'utf8');
const htmlTree = parse(baseline, { sourceCodeLocationInfo: true });
const classAttributes = [];
function visit(node) {
  const attr = node.attrs?.find(attr => attr.name === 'class');
  if (attr) classAttributes.push({ value: attr.value, location: node.sourceCodeLocation.attrs.class });
  for (const child of node.childNodes ?? []) visit(child);
  if (node.content) visit(node.content);
}
visit(htmlTree);
const classes = [...new Set(classAttributes.flatMap(attr => attr.value.split(/\s+/)).filter(Boolean))].sort();

// Build only in a temporary source copy. Keep every production build untouched.
const temp = mkdtempSync(join(tmpdir(), 'ui-fcp-size-'));
cpSync(source, temp, { recursive: true, filter: path => !['node_modules', 'dist', '.astro', '.git'].includes(basename(path)) && !basename(path).startsWith('.env') });
symlinkSync(join(source, 'node_modules'), join(temp, 'node_modules'), 'dir');
const cssPath = join(temp, 'src/styles/globals.css');
const cssSource = readFileSync(cssPath, 'utf8');
assert(cssSource.includes('@import "tailwindcss";'));
writeFileSync(cssPath, cssSource.replace('@import "tailwindcss";', '@import "tailwindcss" source(none);') + `\n@source inline(${JSON.stringify(classes.join(' '))});\n`);
const astroPackage = JSON.parse(readFileSync(join(source, 'node_modules/astro/package.json'), 'utf8'));
const build = spawnSync(process.execPath, [join(source, 'node_modules/astro', astroPackage.bin.astro), 'build'], { cwd: temp, env: { ...process.env, BENCHMARK_INLINE_CSS: '0' }, encoding: 'utf8' });
writeFileSync(join(output, 'pruned-build.log'), build.stdout + build.stderr);
assert.equal(build.status, 0, `Pruned build failed: ${build.stderr}`);
const prunedHtml = readFileSync(join(temp, 'dist/index.html'), 'utf8');
const prunedHref = prunedHtml.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/)[1];
const prunedCss = readFileSync(join(temp, 'dist', prunedHref), 'utf8');
rmSync(temp, { recursive: true, force: true });
assert(prunedCss.length < originalCss.length, 'Pruning did not reduce CSS');

const jsFiles = readdirSync(join(source, 'dist/_astro')).filter(name => name.endsWith('.js'));
const js = jsFiles.map(name => readFileSync(join(source, 'dist/_astro', name), 'utf8')).join('\n');
const protectedFragments = new Set();
postcss.parse(originalCss).walkRules(rule => {
  selectorParser(selectors => selectors.walkAttributes(attr => {
    if (attr.attribute === 'class' && attr.value) protectedFragments.add(attr.value);
  })).processSync(rule.selector);
});
// Keep any class string referenced by JS or a CSS class-attribute selector.
const aliases = new Map(classes.filter(name => name.length > 3 && !js.includes(name) && ![...protectedFragments].some(fragment => name.includes(fragment))).map((name, i) => [name, `z${i.toString(36)}`]));
assert([...aliases.values()].every(name => !classes.includes(name)), 'Alias collision');
let shortHtml = baseline;
for (const { value, location } of [...classAttributes].sort((a, b) => b.location.startOffset - a.location.startOffset)) {
  const changed = value.split(/\s+/).map(name => aliases.get(name) ?? name).join(' ').replaceAll('&', '&amp;').replaceAll('"', '&quot;');
  shortHtml = shortHtml.slice(0, location.startOffset) + `class="${changed}"` + shortHtml.slice(location.endOffset);
}
function shortenCss(css) {
  const root = postcss.parse(css);
  root.walkRules(rule => {
    rule.selector = selectorParser(selectors => selectors.walkClasses(node => {
      const alias = aliases.get(node.value);
      if (alias) node.value = alias;
    })).processSync(rule.selector);
  });
  return root.toString();
}
writeFileSync(join(output, 'class-map.json'), JSON.stringify(Object.fromEntries(aliases), null, 2));
const variants = [
  { id: 'bui-baseline', name: 'b/ui baseline', html: baseline, css: originalCss },
  { id: 'bui-css', name: 'b/ui page-only CSS', html: baseline, css: prunedCss },
  { id: 'bui-short', name: 'b/ui short class names', html: shortHtml, css: shortenCss(originalCss) },
  { id: 'bui-both', name: 'b/ui page-only CSS + short names', html: shortHtml, css: shortenCss(prunedCss) },
];
const cases = variants.map(v => {
  const buildDir = join(output, v.id);
  cpSync(join(source, 'dist'), buildDir, { recursive: true });
  writeFileSync(join(buildDir, 'index.html'), v.html);
  writeFileSync(join(buildDir, stylesheet), v.css);
  return { id: v.id, name: v.name, buildDir };
});
const next = projects.find(p => p.id === 'nextjs-shadcn');
const nextDir = join(output, 'next-baseline');
cpSync(next.buildDir, nextDir, { recursive: true });
cases.push({ id: 'next-baseline', name: 'Next.js baseline', buildDir: nextDir });
const bytes = value => ({ raw: Buffer.byteLength(value), gzip: gzipSync(value, { level: 9 }).length });
const assets = variants.map(v => ({ id: v.id, html: bytes(v.html), css: bytes(v.css), htmlHash: createHash('sha256').update(v.html).digest('hex'), cssHash: createHash('sha256').update(v.css).digest('hex') }));
const nextHtml = readFileSync(join(nextDir, 'index.html'), 'utf8');
const nextCssPath = nextHtml.match(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/)[1];
assets.push({ id: 'next-baseline', html: bytes(nextHtml), css: bytes(readFileSync(join(nextDir, nextCssPath))) });
for (const entry of cases.slice(0, 4)) for (const name of jsFiles) assert(readFileSync(join(entry.buildDir, '_astro', name)).equals(readFileSync(join(source, 'dist/_astro', name))), 'JavaScript changed');

const server = await startStaticServer({ projectList: cases });
let chrome;
const verification = [];
const samples = [];
const settings = {};
const styleSamples = new Map();
try {
  chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP *.localhost 127.0.0.1'] });
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
  for (const width of [412, 1280]) for (const entry of cases) {
    const context = await browser.newContext({ viewport: { width, height: 823 }, deviceScaleFactor: 1 });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(server.urls[entry.id], { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
      const appearance = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().width && e.getBoundingClientRect().height).map(e => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        // Geometry captures spacing; Chrome can serialize flex auto margins as zero or used pixels.
        return [e.tagName, ...['display', 'color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'borderRadius', 'borderColor', 'padding'].map(p => s[p]), ...['x','y','width','height'].map(p => Math.round(r[p] * 10) / 10)];
      }));
      if (entry.id === 'bui-baseline') styleSamples.set(width, { text, appearance });
      assert.equal(text, styleSamples.get(width).text, `${entry.id}: visible text changed`);
      if (entry.id !== 'next-baseline') assert.deepEqual(appearance, styleSamples.get(width).appearance, `${entry.id}: layout or styles changed at ${width}px`);
      await page.screenshot({ path: join(output, `${entry.id}-${width}.png`), fullPage: true });
      for (const label of ['Products', 'Solutions']) {
        await page.getByRole('button', { name: label, exact: true }).click();
        await page.getByRole('link', { name: label === 'Products' ? /Analytics/ : /Enterprise/ }).first().waitFor({ state: 'visible' });
        await page.keyboard.press('Escape');
      }
      const trigger = page.getByRole('button', { name: /^More information:/ }).first();
      await trigger.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      await page.locator('[data-slot="tooltip-content"]').filter({ hasText: 'Components compile to static HTML' }).waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await page.getByRole('tab', { name: 'Yearly', exact: true }).click();
      await page.getByText('$278', { exact: false }).waitFor({ state: 'visible' });
      await page.getByRole('tab', { name: 'Monthly', exact: true }).click();
      await page.getByRole('button', { name: 'How is this different from shadcn/ui?', exact: true }).click();
      await page.getByText("While inspired by shadcn/ui's copy-and-own approach", { exact: false }).waitFor({ state: 'visible' });
      await page.locator('#company-size').click(); await page.getByRole('option', { name: '1–10 employees', exact: true }).click();
      assert((await page.locator('#company-size').innerText()).includes('1–10 employees'));
      await page.locator('#interest').click(); await page.getByRole('option', { name: 'Product demo', exact: true }).click();
      await page.getByRole('button', { name: 'React', exact: true }).hover();
      await page.getByText('A JavaScript library for building user interfaces', { exact: false }).waitFor({ state: 'visible' });
      const checkbox = page.getByRole('checkbox', { name: 'Send me product updates and tips' });
      const before = await checkbox.isChecked(); await checkbox.click(); assert.notEqual(await checkbox.isChecked(), before);
      assert.deepEqual(errors, [], `${entry.id}: browser errors`);
      verification.push({ id: entry.id, width, textMatches: true, initialAppearanceMatches: entry.id === 'next-baseline' ? null : true, interactionsPassed: true });
      console.log(`Verified ${entry.id} at ${width}px`);
    } finally { await context.close(); }
  }
  await browser.close();
  for (const mode of ['simulate', 'devtools']) for (let run = 0; run < runs; run++) {
    const offset = run % cases.length;
    for (const entry of [...cases.slice(offset), ...cases.slice(0, offset)]) {
      const result = await lighthouse(server.urls[entry.id], { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'], formFactor: 'mobile', throttlingMethod: mode, maxWaitForLoad: 45_000 });
      assert(result && !result.lhr.runtimeError, `${entry.id}: audit failed`);
      settings[mode] ??= result.lhr.configSettings;
      const m = result.lhr.audits.metrics.details.items[0];
      const report = join(output, `${entry.id}-${mode}-${run + 1}.json`);
      writeFileSync(report, result.report);
      const sample = { id: entry.id, mode, run: run + 1, fcp: m.firstContentfulPaint, lcp: m.largestContentfulPaint, speedIndex: m.speedIndex, observedFcp: m.observedFirstContentfulPaint, tbt: m.totalBlockingTime, cls: m.cumulativeLayoutShift, report: relative(benchmarkRoot, report) };
      samples.push(sample); writeFileSync(join(output, 'samples.json'), JSON.stringify(samples, null, 2));
      console.log(`${mode} ${run + 1}/${runs} ${entry.id}: FCP ${sample.fcp}ms`);
    }
  }
} finally { if (chrome) await chrome.kill(); await server.close(); }
const median = a => { a = [...a].sort((x,y) => x-y); return a.length % 2 ? a[Math.floor(a.length/2)] : (a[a.length/2-1]+a[a.length/2])/2; };
const summaries = ['simulate','devtools'].flatMap(mode => cases.map(entry => {
  const rows = samples.filter(s => s.id === entry.id && s.mode === mode);
  return { id: entry.id, name: entry.name, mode, metrics: Object.fromEntries(['fcp','lcp','speedIndex','tbt','cls'].map(k => [k, { median: median(rows.map(s=>s[k])), min: Math.min(...rows.map(s=>s[k])), max: Math.max(...rows.map(s=>s[k])) }])) };
}));
const report = { startedAt, completedAt: new Date().toISOString(), runs, versions: readProjectVersions(), methodology: 'Isolated copies of existing production builds. Page-only CSS generated from every class in the complete server-rendered HTML, including closed overlays. Short class names replace classes in HTML and CSS selectors together, preserving JS-referenced classes and CSS attribute-selector fragments. All b/ui JavaScript is byte-identical. No CSS inlining, script-priority changes, content removal or HTML reserialization. Unchanged Next.js control. Sequential cold-load Lighthouse runs with rotating case order, simulated and applied DevTools throttling. These page-specific experiments are not a general library optimization.', classCount: classes.length, aliasCount: aliases.size, assets, verification, settings, summaries, samples };
writeFileSync(join(resultsDir, 'fcp-size.json'), JSON.stringify(report, null, 2)+'\n');
const kb = n => (n/1024).toFixed(2);
const lines = ['# FCP size experiment', '', report.methodology, '', `Measured ${report.completedAt}. ${runs} runs per case and mode. Framework versions are recorded in the JSON report.`, '', '| Case | HTML raw KiB | HTML gzip KiB | CSS raw KiB | CSS gzip KiB |', '|---|---:|---:|---:|---:|'];
for (const a of assets) lines.push(`| ${a.id} | ${kb(a.html.raw)} | ${kb(a.html.gzip)} | ${kb(a.css.raw)} | ${kb(a.css.gzip)} |`);
for (const mode of ['simulate','devtools']) {
  lines.push('', `## ${mode}`, '', '| Case | FCP | FCP range | LCP |', '|---|---:|---|---:|');
  for (const s of summaries.filter(s=>s.mode===mode)) lines.push(`| ${s.name} | ${(s.metrics.fcp.median/1000).toFixed(2)} s | ${(s.metrics.fcp.min/1000).toFixed(2)}–${(s.metrics.fcp.max/1000).toFixed(2)} s | ${(s.metrics.lcp.median/1000).toFixed(2)} s |`);
}
lines.push('', 'All cases retain the same visible text. b/ui variants match initial geometry and sampled computed styles at mobile and desktop widths. Navigation, tooltip, pricing tabs, accordion, selects, hover card and checkbox checks pass. This does not exhaustively verify every interaction state or breakpoint. Shortening class names necessarily changes CSS too; it is not an HTML-only ablation. Transfer reductions do not isolate CSS parse cost from request scheduling. Three runs are diagnostic, not a statistical framework ranking.', '', '[Settings, samples, hashes and verification](fcp-size.json). Run `node scripts/fcp-size.mjs` to repeat; `FCP_SIZE_RUNS` controls sample count. Production sources, builds and headline benchmark results are untouched.', '');
writeFileSync(join(resultsDir, 'fcp-size.md'), lines.join('\n'));
console.log('Wrote results/fcp-size.json and results/fcp-size.md');
