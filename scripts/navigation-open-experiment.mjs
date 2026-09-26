#!/usr/bin/env node
// Diagnostic only: reorder observer startup in an isolated copy of the 1.0.1 build.
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { projects, readProjectVersions } from './benchmark-config.mjs';
import { startStaticServer } from './static-server.mjs';
import { runVisit, summarizeSamples } from './interactions.mjs';
import { scenarioControls } from './interaction-probe.mjs';
import { positiveInteger } from './interaction-profiles.mjs';

async function main() {
const runs = positiveInteger(process.env.NAVIGATION_EXPERIMENT_RUNS ?? '10', 'NAVIGATION_EXPERIMENT_RUNS');
assert.equal(readProjectVersions()['astro-bui']['@data-slot/navigation-menu'], '1.0.1');
const root = resolve('.benchmark-results/navigation-open-order');
const variants = ['baseline', 'tracking-after-layout'].map(id => ({ id, buildDir: `${root}/${id}`, routeFile: 'index.html' }));
for (const variant of variants) { mkdirSync(variant.buildDir, { recursive: true }); cpSync(projects[0].buildDir, variant.buildDir, { recursive: true }); }
const filename = readdirSync(`${variants[1].buildDir}/_astro`).find(name => name.startsWith('NavigationMenu.'));
const target = `${variants[1].buildDir}/_astro/${filename}`;
const original = readFileSync(target, 'utf8');
const changes = [
  ['se.get(i.content)?.enter(),Z.start(),u', 'se.get(i.content)?.enter(),u'],
  ['I=e,L=null,e===null&&X(null),Y.refreshDebug()', 'I=e,L=null,e===null&&X(null),i&&Z.start(),Y.refreshDebug()'],
];
let candidate = original;
for (const [before, after] of changes) {
  assert.equal(candidate.split(before).length, 2, `Expected one occurrence of ${before}; rebuild or update this version-specific diagnostic`);
  candidate = candidate.replace(before, after);
}
writeFileSync(target, candidate);
const server = await startStaticServer({ projectList: variants });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--host-resolver-rules=MAP *.localhost 127.0.0.1'] });
const samples = [];
try {
  for (let round=0; round<runs; round++) {
    for (const variant of round % 2 ? variants.toReversed() : variants) {
      const result = await runVisit({ browser, url: server.urls[variant.id], profile: { rate:20, touch:true, viewport:{width:390,height:844} }, scenario:'settled' });
      samples.push({ round:round+1, variant:variant.id, ...result });
      assert.equal(result.errors.length, 0);
      for (const [key, action] of Object.entries(result.results)) assert.equal(action.status,'success', `${variant.id} ${key}`);
    }
    console.log(`Navigation experiment round ${round+1}/${runs}`);
  }
  const sha = source => createHash('sha256').update(source).digest('hex');
  const report = {
    measuredAt: new Date().toISOString(), browser: browser.version(), versions:readProjectVersions()['astro-bui'],
    methodology: { runs, cpuSlowdown:20, viewport:{width:390,height:844}, touch:true, sequence:scenarioControls.settled, order:'Alternating baseline/candidate each round; fresh context per visit', scope:'Isolated generated-bundle diagnostic; production sources and outputs unchanged; not a released fix' },
    patch: { filename, baselineSha256:sha(original), candidateSha256:sha(candidate), changes },
    groups: variants.map(v=>({variant:v.id, summary:Object.fromEntries(scenarioControls.settled.map(key=>[key,summarizeSamples(samples.filter(s=>s.variant===v.id),key)]))})), samples,
  };
  writeFileSync('results/navigation-open-experiment.json', JSON.stringify(report,null,2)+'\n');
  writeSummary(report);
  for(const group of report.groups)console.log(group.variant,JSON.stringify({timing:group.summary.navigation.durationMs,openState:group.summary.navigation.uiStateDelayMs}));
} finally { await browser.close(); await server.close(); }

}

function writeSummary(report) {
  const { samples, methodology: { runs } } = report;
  const [baseline, updated] = report.groups.map(group => group.summary.navigation);
  const successful = samples.reduce((sum,sample)=>sum+Object.values(sample.results).filter(action=>action.status==='success').length,0);
  const wins = Array.from({length:runs},(_,i)=>samples.filter(s=>s.round===i+1)).map(pair =>
    pair.find(s=>s.variant==='baseline').results.navigation.eventTiming.durationMs -
    pair.find(s=>s.variant==='tracking-after-layout').results.navigation.eventTiming.durationMs);
  writeFileSync('results/navigation-open-experiment.md', [
    '# Navigation opening: observer startup experiment', '',
    `Measured ${report.measuredAt}, Chrome ${report.browser}, data-slot 1.0.1, 20× CPU slowdown. ${runs} visits per variant, alternating order.`, '',
    'This diagnostic moves navigation geometry tracking from before revealing the active panel to after the initial layout and state commit. Opening remains synchronous. It changes an isolated copy of the generated bundle; production sources, dependencies, build outputs, and headline benchmark results stay unchanged.', '',
    '| Metric | Baseline | Tracking after layout |', '|---|---:|---:|',
    `| Products opening median | ${baseline.durationMs.median} ms | ${updated.durationMs.median} ms |`,
    `| Products opening p90 | ${baseline.durationMs.p90} ms | ${updated.durationMs.p90} ms |`,
    `| Observed open-state median | ${baseline.uiStateDelayMs.median.toFixed(1)} ms | ${updated.uiStateDelayMs.median.toFixed(1)} ms |`,
    '', `All ${successful}/${samples.length*scenarioControls.settled.length} actions succeeded. Candidate opening was faster in ${wins.filter(n=>n>0).length} paired rounds, tied in ${wins.filter(n=>n===0).length}, and slower in ${wins.filter(n=>n<0).length}.`, '',
    'The result is a modest, variable improvement, not evidence that observer reordering alone solves navigation latency. Event Timing is quantized in 8 ms increments. Open-state timing is a DOM observation, not an exact pixel-presentation timestamp. Compare these paired baselines, not the 200 ms from the earlier run.', '',
    'The production trace points to repeated style/layout work during mounting, observer setup, target-size measurement, and final placement. The broader optimization to investigate is a consistent mount → measure → commit → observe sequence, sharing geometry and coalescing redundant updates while preserving focus, transitions, scroll, and resize behavior. Select and dropdown-menu also start tracking before their explicit initial position update; tooltip, popover, and hover-card already use the opposite order. Benefits beyond navigation have not been measured here.', '',
    'Reproduce from the locked 1.0.1 production build:', '', '```bash',
    'node scripts/navigation-open-experiment.mjs',
    'NAVIGATION_BUILD_DIR=.benchmark-results/navigation-open-order/tracking-after-layout npm run test:navigation',
    'node scripts/profile-interaction.mjs',
    '```', '',
    'The generated-bundle substitutions deliberately fail if the build changes. The [raw report](navigation-open-experiment.json) records exact substitutions, bundle hashes, installed versions, and every action. The [profiling script](../scripts/profile-interaction.mjs) saves Chrome traces under `.benchmark-results`; tracing adds overhead and those timings are not mixed with the untraced experiment.', '',
  ].join('\n'));
}

if (process.argv.includes("--summarize")) {
  writeSummary(JSON.parse(readFileSync("results/navigation-open-experiment.json", "utf8")));
} else {
  await main();
}
