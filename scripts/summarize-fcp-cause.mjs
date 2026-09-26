#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { parse, serialize } from 'parse5';
import { chromium } from 'playwright-core';
import { benchmarkRoot, projects } from './benchmark-config.mjs';
import { startStaticServer } from './static-server.mjs';

const directories = process.argv.slice(2).map(p => resolve(p));
assert(directories.length > 0, 'Pass completed fcp-cause run directories');
const inputs = directories.map(dir => ({ dir, report: JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8')) }));
const samples = inputs.flatMap(({dir, report}) => report.samples.map(s => ({ ...s, runDirectory: relative(benchmarkRoot, dir) })));
for (const sample of samples) {
  const prefix = join(benchmarkRoot, sample.report.replace(/\.json$/, ''));
  const lhr = JSON.parse(readFileSync(`${prefix}.json`, 'utf8'));
  const metrics = lhr.audits.metrics.details.items[0];
  const trace = JSON.parse(readFileSync(`${prefix}.trace.json`, 'utf8'));
  sample.forcedLayoutsBeforeFcp = trace.traceEvents.filter(e => e.name === 'Layout' && e.ts <= metrics.observedFirstContentfulPaintTs && e.args?.beginData?.stackTrace?.length).map(e => ({
    startMs: (e.ts - metrics.observedNavigationStartTs) / 1000,
    durationMs: e.dur / 1000,
    stack: e.args.beginData.stackTrace.slice(0, 3),
  }));
}
const cases = [...new Set(samples.map(s => s.id))].map(id => ({ id, name: id, buildDir: join(inputs.find(i => i.report.samples.some(s => s.id === id)).dir, id) }));

function normalizedHtml(html) {
  const root = parse(html);
  function visit(n) {
    if (n.attrs) n.attrs = n.attrs.filter(a => a.name !== 'fetchpriority');
    if (n.childNodes) n.childNodes = n.childNodes.filter(c => !(c.tagName === 'link' && c.attrs.some(a => a.name === 'rel' && ['preconnect','modulepreload'].includes(a.value))));
    for (const c of n.childNodes ?? []) visit(c);
    if (n.content) visit(n.content);
  }
  visit(root);
  return serialize(root);
}
const hash = buffer => createHash('sha256').update(buffer).digest('hex');
const integrity = [];
// Check every snapshot, including copies from separate simulated/applied batches.
for (const {dir,report} of inputs) for (const id of new Set(report.samples.map(s=>s.id))) {
  const source = projects.find(p => p.id === (id.startsWith('bui') ? 'astro-bui' : 'nextjs-shadcn')).buildDir;
  const target = join(dir, id);
  const html = readFileSync(join(target, 'index.html'), 'utf8');
  assert.equal(normalizedHtml(html), normalizedHtml(readFileSync(join(source, 'index.html'), 'utf8')), `${id}: content changed`);
  const files = readdirSync(source, {recursive:true}).filter(f => /\.(css|js|woff2)$/.test(f));
  for (const f of files) assert(readFileSync(join(source,f)).equals(readFileSync(join(target,f))), `${id}: changed ${f}`);
  integrity.push({id, directory:relative(benchmarkRoot,dir), htmlSha256:hash(html), unchangedAssetCount:files.length, onlyPriorityAndConnectionHintsChanged:true});
}

const server = await startStaticServer({projectList:cases});
let browser;
const verification = [];
let expectedText;
try {
  browser = await chromium.launch({channel:'chrome', headless:true, args:['--host-resolver-rules=MAP *.localhost 127.0.0.1']});
  for (const width of [412,1280]) for (const entry of cases) {
    const page = await browser.newPage({viewport:{width,height:823}});
    try {
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
      await page.goto(server.urls[entry.id],{waitUntil:'networkidle'});
      const text=(await page.locator('body').innerText()).replace(/\s+/g,' ').trim();
      expectedText ??= text;
      assert.equal(text,expectedText);
      for(const label of ['Products','Solutions']) {
        await page.getByRole('button',{name:label,exact:true}).click();
        await page.getByRole('link',{name:label==='Products'?/Analytics/:/Enterprise/}).first().waitFor({state:'visible'});
        await page.keyboard.press('Escape');
      }
      const tooltip = page.getByRole('button',{name:/^More information:/}).first();
      await tooltip.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
      await page.locator('[data-slot="tooltip-content"]').filter({hasText:'Components compile to static HTML'}).waitFor({state:'visible'});
      await page.keyboard.press('Escape');
      await page.getByRole('tab',{name:'Yearly',exact:true}).click();
      await page.getByText('$278',{exact:false}).waitFor({state:'visible'});
      await page.getByRole('tab',{name:'Monthly',exact:true}).click();
      await page.getByRole('button',{name:'How is this different from shadcn/ui?',exact:true}).click();
      await page.getByText("While inspired by shadcn/ui's copy-and-own approach",{exact:false}).waitFor({state:'visible'});
      await page.locator('#company-size').click();await page.getByRole('option',{name:'1–10 employees',exact:true}).click();
      await page.locator('#interest').click();await page.getByRole('option',{name:'Product demo',exact:true}).click();
      await page.getByRole('button',{name:'React',exact:true}).hover();
      await page.getByText('A JavaScript library for building user interfaces',{exact:false}).waitFor({state:'visible'});
      const checkbox=page.getByRole('checkbox',{name:'Send me product updates and tips'});
      const before=await checkbox.isChecked();await checkbox.click();assert.notEqual(await checkbox.isChecked(),before);
      assert.deepEqual(errors,[]);
      verification.push({id:entry.id,width,visibleTextMatches:true,settledControlsPass:true,browserErrors:errors});
      console.log(`Verified ${entry.id} at ${width}px`);
    } finally {await page.close();}
  }
} finally {if(browser)await browser.close();await server.close();}

const median = values => {const a=[...values].sort((a,b)=>a-b);const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
const summaries=[];
for(const mode of new Set(samples.map(s=>s.mode)))for(const {id} of cases){
  const rows=samples.filter(s=>s.id===id&&s.mode===mode);
  if(!rows.length)continue;
  summaries.push({id,mode,count:rows.length,median:median(rows.map(s=>s.fcp)),min:Math.min(...rows.map(s=>s.fcp)),max:Math.max(...rows.map(s=>s.fcp))});
}
const result={generatedAt:new Date().toISOString(),inputs:directories.map(d=>relative(benchmarkRoot,d)),versions:inputs[0].report.versions,integrity,verification,summaries,samples};
writeFileSync(join(benchmarkRoot,'results/fcp-cause.json'),JSON.stringify(result,null,2)+'\n');
const lines=['# Why simulated FCP favors Next.js','','The main cause is script request priority and its treatment in Lighthouse’s paint simulation. Astro’s module requests are High priority; Next’s async requests are Low. In the recorded baseline graphs, Lighthouse includes Astro scripts among the resources that can delay FCP, while excluding Next scripts. Those included transfers compete with CSS and the font in the simulator.','','## Fresh browser loads','','| Variant | Method | Runs | Median FCP | Range |','|---|---|---:|---:|---:|'];
for(const s of summaries)lines.push(`| ${s.id} | ${s.mode} | ${s.count} | ${(s.median/1000).toFixed(2)} s | ${(s.min/1000).toFixed(2)}–${(s.max/1000).toFixed(2)} s |`);
lines.push('','`bui-low` adds low-priority hints to the six entry scripts. `bui-low-tree` also preloads their shared module at Low priority. `next-high` raises script and script-preload priority. The preconnect variants add Next’s connection hint to b/ui or remove it from Next. CSS, JavaScript and font files remain byte-identical to each project’s baseline. Normalized HTML is identical after removing only the experimental hints.','','## Same-trace counterfactuals','','These are model-only replays: no browser load, file size, CPU task or observed request time changes. Every fresh simulated audit is reconstructed to within 1 ms before changing the recorded script priorities. They isolate the effect of priority on the model, not a guaranteed browser improvement.','','| Baseline trace | Original FCP | All scripts Low in model | All scripts High in model |','|---|---:|---:|---:|');
for(const id of ['bui','next']){
  const s=samples.find(s=>s.id===id&&s.mode==='simulate');
  if(s)lines.push(`| ${id} | ${(s.fcp/1000).toFixed(3)} s | ${(s.model.counterfactuals.allScriptsLow/1000).toFixed(3)} s | ${(s.model.counterfactuals.allScriptsHigh/1000).toFixed(3)} s |`);
}
lines.push('', '## Where the modeled time goes', '', 'The first baseline trace from each framework has this optimistic network chain. CPU work overlaps these transfers. Times are simulator output, not observed browser request durations.', '', '| Baseline | Request | Duration | Completion after navigation |', '|---|---|---:|---:|');
for(const id of ['bui','next']) {
  const s=samples.find(s=>s.id===id&&s.mode==='simulate');
  for(const n of s?.model.optimistic.nodes.filter(n=>['Document','Stylesheet','Font'].includes(n.resourceType))??[])lines.push(`| ${id} | ${n.resourceType} | ${(n.endTime-n.startTime).toFixed(0)} ms | ${n.endTime.toFixed(0)} ms |`);
}
const outlier=samples.find(s=>s.id==='bui-low-tree'&&s.mode==='simulate'&&['Accordion.','Tabs.'].every(name=>s.model.optimistic.nodes.some(n=>n.priority==='Low'&&n.url?.includes(name)))&&s.forcedLayoutsBeforeFcp.some(l=>l.stack.some(f=>f.url.includes('Accordion.'))));
if(outlier)lines.push('', `The all-Low variant still varied. In run ${outlier.run}, FCP was ${(outlier.fcp/1000).toFixed(2)} s. The trace contains Accordion-forced layout before first paint, and the modeled CPU dependency chain retains Accordion and Tabs downloads despite their Low priority. The Accordion stack reaches its transition-duration check through getComputedStyle. This is why priority hints alone do not make every simulated run identical. Stack locations and modeled dependencies are preserved in the JSON.`);
lines.push('','## Interpretation and limits','','The experiment explains the simulated ranking; it does not establish a universal field-performance ranking. DevTools throttling measures a separately throttled browser load, and neither method is packet-level network emulation. Keep their results separate. The model can include a font that finished before paint in the unthrottled trace even when a throttled browser paints fallback text before the font arrives.','','Lowering script priority is an optimization candidate, not a production recommendation based on FCP alone. Settled controls pass at mobile and desktop widths, but these checks do not establish early interaction readiness on slow connections. No production build, dependency version, or headline benchmark result is changed by the experiment.','','[Lighthouse throttling methods](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md). [Chromium’s render-blocking priority classification](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/graph/NetworkNode.ts). The exact installed Lighthouse version, settings, graph timings, network requests, samples and checks are retained in [fcp-cause.json](fcp-cause.json).','','Run `npm run performance:cause` to repeat the full experiment and verification. Completed batches can be combined by passing their saved directories to `node scripts/summarize-fcp-cause.mjs`.','');
writeFileSync(join(benchmarkRoot,'results/fcp-cause.md'),lines.join('\n'));
console.log('Wrote results/fcp-cause.json and results/fcp-cause.md');
