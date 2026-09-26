#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { basename, join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { benchmarkRoot, resultsDir } from './benchmark-config.mjs';

const projects = ['astro-bui', 'astro-react-shadcn'];
const families = ['accordion', 'badge', 'button', 'card', 'checkbox', 'hover-card', 'input', 'label', 'navigation-menu', 'select', 'separator', 'tabs', 'tooltip'];
const tempRoot = mkdtempSync(join(tmpdir(), 'ui-css-components-'));
const startedAt = new Date().toISOString();
const output = join(benchmarkRoot, '.benchmark-results', 'css-components', startedAt.replaceAll(':', '-'));
mkdirSync(output, { recursive: true });
const samples = [];
const prepared = new Map();
const cache = new Map();
const htmlBaseline = new Map();

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}
for (const id of projects) {
  const source = join(benchmarkRoot, id);
  const root = join(tempRoot, id);
  cpSync(source, root, { recursive: true, filter: path => !['node_modules', 'dist', '.astro', '.git'].includes(basename(path)) && !basename(path).startsWith('.env') });
  symlinkSync(join(source, 'node_modules'), join(root, 'node_modules'), 'dir');
  let previewBytesRemoved = 0;
  for (const path of files(join(root, 'src')).filter(path => /\.(astro|tsx?|jsx?)$/.test(path))) {
    const before = readFileSync(path, 'utf8');
    const after = before.replace(/\/\*\*[\s\S]*?\*\//g, comment => comment.includes('@preview') ? '' : comment);
    previewBytesRemoved += Buffer.byteLength(before) - Buffer.byteLength(after);
    writeFileSync(path, after);
  }
  const cssPath = join(root, 'src/styles/globals.css');
  let css = readFileSync(cssPath, 'utf8');
  for (const state of ['open', 'closed', 'checked', 'unchecked', 'disabled', 'active']) {
    const firstSelector = state === 'disabled' ? '[data-disabled="true"]' : `[data-state="${state}"]`;
    css += `\n@custom-variant data-${state} (&:where(${firstSelector}, [data-${state}]:not([data-${state}="false"])));\n`;
  }
  prepared.set(id, { root, cssPath, css, previewBytesRemoved });
}

function measure(id, excluded, allSources = false) {
  const key = `${id}:${allSources ? 'none' : [...excluded].sort().join(',')}`;
  if (cache.has(key)) return cache.get(key);
  const { root, cssPath, css } = prepared.get(id);
  const exclusions = excluded.map(family => `@source not "${id === 'astro-bui' ? `../ui/${family}` : `../components/ui/${family}.tsx`}";`).join('\n');
  writeFileSync(cssPath, allSources ? css.replace('@import "tailwindcss";', '@import "tailwindcss" source(none);') : `${css}\n${exclusions}\n`);
  const label = allSources ? 'no-source-utilities' : excluded.length ? `without-${excluded.join('-')}` : 'baseline';
  const result = spawnSync(process.execPath, [join(benchmarkRoot, id, 'node_modules/astro/astro.js'), 'build'], { cwd: root, env: { ...process.env, BENCHMARK_INLINE_CSS: '0' }, encoding: 'utf8' });
  writeFileSync(join(output, `${id}-${label}.log`), result.stdout + result.stderr);
  assert.equal(result.status, 0, `${id} ${label}: build failed: ${result.stderr}`);
  const html = readFileSync(join(root, 'dist/index.html'), 'utf8');
  const href = html.match(/<link rel="stylesheet" href="([^"]+)"/)[1];
  const generated = readFileSync(join(root, 'dist', href));
  const normalizedHtml = html.replace(/<link rel="stylesheet"[^>]*>/g, '');
  if (excluded.length === 0 && !allSources) htmlBaseline.set(id, normalizedHtml);
  else assert.equal(normalizedHtml, htmlBaseline.get(id), `${id}: something other than stylesheet output changed`);
  const cssFile = join(output, `${id}-${label}.css`);
  writeFileSync(cssFile, generated);
  const row = { id, excluded, allSources, cssBytes: generated.byteLength, gzipBytes: gzipSync(generated, { level: 9 }).byteLength, cssSha256: createHash('sha256').update(generated).digest('hex'), cssFile: relative(benchmarkRoot, cssFile) };
  samples.push(row);
  cache.set(key, row);
  console.log(`${id} ${label}: ${row.cssBytes} bytes CSS`);
  writeFileSync(join(output, 'samples.json'), `${JSON.stringify(samples, null, 2)}\n`);
  return row;
}
const baseline = Object.fromEntries(projects.map(id => [id, measure(id, [])]));
const single = families.map(family => {
  const saved = Object.fromEntries(projects.map(id => {
    const row = measure(id, [family]);
    return [id, { cssBytes: baseline[id].cssBytes - row.cssBytes, gzipBytes: baseline[id].gzipBytes - row.gzipBytes }];
  }));
  return { family, saved, excessBytes: saved['astro-bui'].cssBytes - saved['astro-react-shadcn'].cssBytes };
}).sort((a, b) => b.excessBytes - a.excessBytes || a.family.localeCompare(b.family));
const initialGap = baseline['astro-bui'].cssBytes - baseline['astro-react-shadcn'].cssBytes;
let previousGap = initialGap;
const cumulative = [];
const excluded = [];
for (const { family } of single) {
  excluded.push(family);
  const remaining = Object.fromEntries(projects.map(id => [id, measure(id, [...excluded]).cssBytes]));
  const gap = remaining['astro-bui'] - remaining['astro-react-shadcn'];
  cumulative.push({ family, remaining, contributionBytes: previousGap - gap, remainingGapBytes: gap });
  previousGap = gap;
}
const noSources = Object.fromEntries(projects.map(id => [id, measure(id, [], true)]));
const baseCssGap = noSources['astro-bui'].cssBytes - noSources['astro-react-shadcn'].cssBytes;
const otherSourcesContribution = previousGap - baseCssGap;
assert.equal(cumulative.reduce((sum, row) => sum + row.contributionBytes, 0) + otherSourcesContribution + baseCssGap, initialGap);
const report = { startedAt, completedAt: new Date().toISOString(), basis: 'Fresh isolated copies with @preview documentation blocks removed and six state aliases combined into single :where selectors in both projects. One family at a time is excluded from Tailwind source detection, then families are excluded cumulatively. Rendered HTML must stay byte-identical apart from the stylesheet link. These diagnostic builds deliberately omit needed styles and are not shippable optimizations.', componentSources: { 'astro-bui': 'src/ui/<family>/', 'astro-react-shadcn': 'src/components/ui/<family>.tsx' }, baseline, initialGapBytes: initialGap, single, cumulative, otherSourcesContributionBytes: otherSourcesContribution, baseCssGapBytes: baseCssGap, noSources, samples };
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, 'css-components.json'), `${JSON.stringify(report, null, 2)}\n`);
const kb = bytes => (bytes / 1024).toFixed(2);
const md = ['# Component CSS attribution', '', report.basis, '', `Measured ${report.completedAt}. The cleaned baseline is ${kb(baseline['astro-bui'].cssBytes)} KiB for b/ui and ${kb(baseline['astro-react-shadcn'].cssBytes)} KiB for Astro React, a ${kb(initialGap)} KiB raw CSS gap.`, '', '## Excluding one family at a time', '', 'These savings overlap because components share utilities. Do not add these rows. Positive excess means b/ui has more CSS uniquely dependent on that family.', '', '| Family | b/ui savings, KiB | React savings, KiB | Excess b/ui CSS, KiB |', '|---|---:|---:|---:|'];
for (const row of single) md.push(`| ${row.family} | ${kb(row.saved['astro-bui'].cssBytes)} | ${kb(row.saved['astro-react-shadcn'].cssBytes)} | ${kb(row.excessBytes)} |`);
md.push('', '## Cumulative accounting', '', 'Families are removed in the order below, sorted by their independent excess. These contributions add up, but allocation of shared utilities depends on the removal order. Negative values mean React lost more CSS at that step.', '', '| Removed family | Contribution to original gap, KiB | Remaining gap, KiB |', '|---|---:|---:|');
for (const row of cumulative) md.push(`| ${row.family} | ${kb(row.contributionBytes)} | ${kb(row.remainingGapBytes)} |`);
md.push(`| Remaining scanned sources outside component library | ${kb(otherSourcesContribution)} | ${kb(baseCssGap)} |`, `| Base CSS difference with source detection disabled | ${kb(baseCssGap)} | 0.00 |`, `| **Total accounted for** | **${kb(initialGap)}** | |`, '', 'The remaining scanned sources include page markup, React wrapper components, helpers, documentation outside preview blocks, and other text files Tailwind detects. The final source(none) build keeps CSS imports and @apply rules while disabling source-generated utilities.', '', 'Run `node scripts/css-components.mjs` to reproduce. Production sources and build outputs are untouched. Temporary build logs and every generated stylesheet are stored under `.benchmark-results/css-components/`.', '', '[Raw measurements and stylesheet hashes](css-components.json).', '');
writeFileSync(join(resultsDir, 'css-components.md'), md.join('\n'));
console.log(`Accounted for ${initialGap} bytes of excess b/ui CSS. Final base CSS gap: ${baseCssGap} bytes.`);
