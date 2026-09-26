# Why simulated FCP favors Next.js

The main cause is script request priority and its treatment in Lighthouse’s paint simulation. Astro’s module requests are High priority; Next’s async requests are Low. In the recorded baseline graphs, Lighthouse includes Astro scripts among the resources that can delay FCP, while excluding Next scripts. Those included transfers compete with CSS and the font in the simulator.

## Fresh browser loads

| Variant | Method | Runs | Median FCP | Range |
|---|---|---:|---:|---:|
| bui | simulate | 3 | 1.65 s | 1.65–1.66 s |
| bui-low | simulate | 3 | 1.28 s | 1.13–1.28 s |
| bui-preconnect | simulate | 3 | 1.65 s | 1.50–1.65 s |
| next | simulate | 3 | 1.21 s | 1.21–1.21 s |
| next-high | simulate | 3 | 2.76 s | 2.76–2.76 s |
| next-no-preconnect | simulate | 3 | 1.21 s | 1.21–1.21 s |
| bui-low-tree | simulate | 3 | 1.06 s | 1.06–1.36 s |
| bui | devtools | 3 | 1.45 s | 1.45–1.46 s |
| bui-low | devtools | 3 | 1.45 s | 1.44–1.46 s |
| next | devtools | 3 | 1.50 s | 1.50–1.51 s |
| next-high | devtools | 3 | 1.50 s | 1.50–1.51 s |
| bui-low-tree | devtools | 3 | 1.48 s | 1.48–1.48 s |

`bui-low` adds low-priority hints to the six entry scripts. `bui-low-tree` also preloads their shared module at Low priority. `next-high` raises script and script-preload priority. The preconnect variants add Next’s connection hint to b/ui or remove it from Next. CSS, JavaScript and font files remain byte-identical to each project’s baseline. Normalized HTML is identical after removing only the experimental hints.

## Same-trace counterfactuals

These are model-only replays: no browser load, file size, CPU task or observed request time changes. Every fresh simulated audit is reconstructed to within 1 ms before changing the recorded script priorities. They isolate the effect of priority on the model, not a guaranteed browser improvement.

| Baseline trace | Original FCP | All scripts Low in model | All scripts High in model |
|---|---:|---:|---:|
| bui | 1.657 s | 1.057 s | 1.657 s |
| next | 1.212 s | 1.212 s | 2.763 s |

## Where the modeled time goes

The first baseline trace from each framework has this optimistic network chain. CPU work overlaps these transfers. Times are simulator output, not observed browser request durations.

| Baseline | Request | Duration | Completion after navigation |
|---|---|---:|---:|
| bui | Document | 602 ms | 602 ms |
| bui | Stylesheet | 602 ms | 1205 ms |
| bui | Font | 452 ms | 1657 ms |
| next | Document | 754 ms | 754 ms |
| next | Stylesheet | 154 ms | 908 ms |
| next | Font | 304 ms | 1212 ms |

The all-Low variant still varied. In run 3, FCP was 1.36 s. The trace contains Accordion-forced layout before first paint, and the modeled CPU dependency chain retains Accordion and Tabs downloads despite their Low priority. The Accordion stack reaches its transition-duration check through getComputedStyle. This is why priority hints alone do not make every simulated run identical. Stack locations and modeled dependencies are preserved in the JSON.

## Interpretation and limits

The experiment explains the simulated ranking; it does not establish a universal field-performance ranking. DevTools throttling measures a separately throttled browser load, and neither method is packet-level network emulation. Keep their results separate. The model can include a font that finished before paint in the unthrottled trace even when a throttled browser paints fallback text before the font arrives.

Lowering script priority is an optimization candidate, not a production recommendation based on FCP alone. Settled controls pass at mobile and desktop widths, but these checks do not establish early interaction readiness on slow connections. No production build, dependency version, or headline benchmark result is changed by the experiment.

[Lighthouse throttling methods](https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md). [Chromium’s render-blocking priority classification](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/models/trace/lantern/graph/NetworkNode.ts). The exact installed Lighthouse version, settings, graph timings, network requests, samples and checks are retained in [fcp-cause.json](fcp-cause.json).

Run `npm run performance:cause` to repeat the full experiment and verification. Completed batches can be combined by passing their saved directories to `node scripts/summarize-fcp-cause.mjs`.
