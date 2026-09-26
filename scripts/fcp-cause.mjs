#!/usr/bin/env node
// Diagnostic build copies and Lighthouse model inspection. Never edits production output.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { getComputationDataParams } from 'lighthouse/core/computed/metrics/lantern-metric.js';
import * as Lantern from 'lighthouse/core/lib/lantern/lantern.js';
import { benchmarkRoot, projects, readProjectVersions } from './benchmark-config.mjs';
import { startStaticServer } from './static-server.mjs';

const out = join(benchmarkRoot, '.benchmark-results/fcp-cause', new Date().toISOString().replaceAll(':', '-'));
mkdirSync(out, { recursive: true });
const runs = Number(process.env.FCP_CAUSE_RUNS ?? 3);
const modes = (process.env.FCP_CAUSE_MODES ?? 'simulate,devtools').split(',');
assert(Number.isInteger(runs) && runs > 0);
assert(modes.every(mode => ['simulate', 'devtools'].includes(mode)));
const scriptPriority = (html, priority) => html.replace(/<script\b[^>]*\bsrc=[^>]*>/g, tag => tag.replace(/\sfetchpriority="[^"]*"/ig, '').replace('<script', `<script fetchpriority="${priority}"`)).replace(/(<link\b[^>]*as="script"[^>]*fetchPriority=")[^"]*/g, `$1${priority}`);
const definitions = [
  ['bui', 'astro-bui', h => h],
  ['bui-low', 'astro-bui', h => scriptPriority(h, 'low')],
  ['bui-low-tree', 'astro-bui', h => {
    const files = readdirSync(join(projects.find(p => p.id === 'astro-bui').buildDir, '_astro')).filter(n => /^dist\..*\.js$/.test(n));
    assert.equal(files.length, 1, 'Expected one shared module to preload');
    return scriptPriority(h, 'low').replace('</head>', `<link rel="modulepreload" href="/_astro/${files[0]}" fetchpriority="low"></head>`);
  }],
  ['bui-preconnect', 'astro-bui', h => h.replace('<head>', '<head><link rel="preconnect" href="/" crossorigin="">')],
  ['next', 'nextjs-shadcn', h => h],
  ['next-high', 'nextjs-shadcn', h => scriptPriority(h, 'high')],
  ['next-no-preconnect', 'nextjs-shadcn', h => h.replace(/<link\b[^>]*rel="preconnect"[^>]*>/g, '')],
];
const selected = (process.env.FCP_CAUSE_CASES ?? definitions.map(d => d[0]).join(',')).split(',');
assert(selected.every(id => definitions.some(d => d[0] === id)));
const cases = definitions.filter(d => selected.includes(d[0])).map(([id, projectId, transform]) => {
  const project = projects.find(p => p.id === projectId);
  const buildDir = join(out, id);
  cpSync(project.buildDir, buildDir, { recursive: true });
  const html = readFileSync(join(buildDir, 'index.html'), 'utf8');
  writeFileSync(join(buildDir, 'index.html'), transform(html));
  return { id, name: id, buildDir };
});

function graphRows(estimate) {
  return [...estimate.nodeTimings].map(([node, timing]) => ({
    id: node.id, type: node.type,
    ...(node.type === 'network' ? {
      url: node.request.url, resourceType: node.request.resourceType,
      priority: node.request.priority, transferSize: node.request.transferSize,
      connectionReused: node.request.connectionReused, connectionId: node.request.connectionId,
    } : { event: node.event?.name, duration: (node.endTime - node.startTime) / 1000, evaluatedScripts: [...node.getEvaluateScriptURLs()], performsLayout: node.didPerformLayout() }),
    dependencies: node.getDependencies().map(n => n.id), ...timing,
  })).sort((a,b) => a.startTime - b.startTime);
}
async function inspectModel(result) {
  const a = result.artifacts;
  const data = { trace: a.Trace, devtoolsLog: a.DevtoolsLog, gatherContext: a.GatherContext, settings: a.settings, URL: a.URL, SourceMaps: a.SourceMaps, HostDPR: a.HostDPR, simulator: null };
  const params = await getComputationDataParams(data, { computedCache: new Map() });
  const metric = Lantern.Metrics.FirstContentfulPaint.compute(params);
  assert(Math.abs(metric.timing - result.lhr.audits['first-contentful-paint'].numericValue) < 1, 'Reconstructed FCP differs');
  const resultData = { timing: metric.timing, optimistic: { timing: metric.optimisticEstimate.timeInMs, nodes: graphRows(metric.optimisticEstimate) }, pessimistic: { timing: metric.pessimisticEstimate.timeInMs, nodes: graphRows(metric.pessimisticEstimate) } };
  const requests = [];
  params.graph.traverse(n => { if (n.type === 'network') requests.push(n.request); });
  resultData.counterfactuals = {};
  // Same recorded trace, only the model's request priority changes. No browser claim.
  for (const priority of ['Low', 'High']) {
    const old = requests.map(r => r.priority);
    requests.forEach(r => { if (r.resourceType === 'Script') r.priority = priority; });
    resultData.counterfactuals[`allScripts${priority}`] = Lantern.Metrics.FirstContentfulPaint.compute(params).timing;
    requests.forEach((r,i) => { r.priority = old[i]; });
  }
  return resultData;
}

const server = await startStaticServer({ projectList: cases });
let chrome;
const samples = [];
try {
  chrome = await launch({ chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--host-resolver-rules=MAP *.localhost 127.0.0.1'] });
  for (const mode of modes) for (let run = 0; run < runs; run++) {
    const ordered = [...cases.slice(run % cases.length), ...cases.slice(0, run % cases.length)];
    for (const entry of ordered) {
      const result = await lighthouse(server.urls[entry.id], { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'], formFactor: 'mobile', throttlingMethod: mode, maxWaitForLoad: 45000 });
      assert(result && !result.lhr.runtimeError, `${entry.id} failed`);
      const prefix = `${entry.id}-${mode}-${run + 1}`;
      writeFileSync(join(out, `${prefix}.json`), result.report);
      writeFileSync(join(out, `${prefix}.trace.json`), JSON.stringify(result.artifacts.Trace));
      writeFileSync(join(out, `${prefix}.devtools.json`), JSON.stringify(result.artifacts.DevtoolsLog));
      const sample = {
        id: entry.id, mode, run: run + 1,
        fcp: result.lhr.audits['first-contentful-paint'].numericValue,
        lcp: result.lhr.audits['largest-contentful-paint'].numericValue,
        observedFcp: result.lhr.audits.metrics.details.items[0].observedFirstContentfulPaint,
        settings: result.lhr.configSettings, environment: result.lhr.environment,
        lighthouseVersion: result.lhr.lighthouseVersion,
        requests: result.lhr.audits['network-requests'].details.items,
        ...(mode === 'simulate' ? { model: await inspectModel(result) } : {}),
        report: relative(benchmarkRoot, join(out, `${prefix}.json`)),
      };
      samples.push(sample);
      writeFileSync(join(out, 'summary.json'), JSON.stringify({ versions: readProjectVersions(), samples }, null, 2));
      console.log(`${mode} ${run + 1}/${runs} ${entry.id}: FCP ${sample.fcp.toFixed(1)}ms; model priority changes ${JSON.stringify(sample.model?.counterfactuals)}`);
    }
  }
} finally { if (chrome) await chrome.kill(); await server.close(); }
console.log(`Saved ${relative(benchmarkRoot, out)}`);
if (process.env.FCP_CAUSE_SUMMARIZE !== '0') {
  const summary = spawnSync(process.execPath, [join(benchmarkRoot, 'scripts/summarize-fcp-cause.mjs'), out], { stdio: 'inherit' });
  assert.equal(summary.status, 0, 'Report verification failed');
}
