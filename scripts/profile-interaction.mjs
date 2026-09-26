#!/usr/bin/env node
// Trace one settled action without overwriting the published interaction study.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { projects } from './benchmark-config.mjs';
import { startStaticServer } from './static-server.mjs';
import { controls, scenarioControls, installProbe, measureSettled } from './interaction-probe.mjs';

const projectId = process.env.PROFILE_PROJECT ?? 'astro-bui';
const control = process.env.PROFILE_CONTROL ?? 'navigation';
const sourceProject = projects.find(p => p.id === projectId);
if (!sourceProject || !scenarioControls.settled.includes(control)) throw new Error('Unknown project or control');
const project = { ...sourceProject, buildDir: process.env.PROFILE_BUILD_DIR ? resolve(process.env.PROFILE_BUILD_DIR) : sourceProject.buildDir };
const output = resolve(process.env.PROFILE_OUTPUT ?? `.benchmark-results/profile-${projectId}-${control}`);
mkdirSync(output, { recursive: true });
const server = await startStaticServer({ project });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ locale: 'en-US', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, serviceWorkers: 'block' });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
  await page.addInitScript(installProbe, { earlyControl: null, outcomeTimeoutMs: 2000 });
  await page.goto(server.urls[projectId], { waitUntil: 'networkidle' });
  for (const key of scenarioControls.settled) {
    if (key === control) break;
    const result = await measureSettled(page, cdp, controls[key], true);
    if (result.status !== 'success') throw new Error(`Prerequisite ${key}: ${result.status}`);
  }
  await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'blink.user_timing', 'toplevel'] });
  const result = await measureSettled(page, cdp, controls[control], true);
  const trace = await browser.stopTracing();
  writeFileSync(`${output}/trace.json`, trace);
  writeFileSync(`${output}/result.json`, JSON.stringify(result, null, 2) + '\n');
  const events = JSON.parse(trace).traceEvents;
  const timing = events.find(e => e.name === 'EventTiming' && e.ph === 'b' && e.args?.data?.interactionId);
  const main = events.find(e => e.name === 'thread_name' && e.pid === timing?.pid && e.args?.name === 'CrRendererMain');
  const work = events.filter(e => e.pid === main?.pid && e.tid === main?.tid && e.ph === 'X' && e.dur);
  const metrics = ['EventDispatch', 'UpdateLayoutTree', 'Layout', 'Paint', 'FireAnimationFrame'].map(name => {
    const selected = work.filter(e => e.name === name);
    return { name, count: selected.length, totalMs: selected.reduce((sum, e) => sum + e.dur / 1000, 0), longest: selected.toSorted((a,b)=>b.dur-a.dur).slice(0,5) };
  });
  writeFileSync(`${output}/work.json`, JSON.stringify(metrics, null, 2) + '\n');
  console.log(JSON.stringify({ project: projectId, control, status: result.status, eventTiming: result.eventTiming, uiStateDelayMs: result.uiStateDelayMs, traceWindowWork: metrics.map(({longest,...rest})=>rest), output }, null, 2));
} finally {
  await browser.close();
  await server.close();
}
