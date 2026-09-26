# UI benchmark: Astro + b/ui, Astro + React, and Next.js

This repository compares three static implementations of the same marketing page:

1. **Astro + b/ui** — Astro components with `data-slot` JavaScript primitives
2. **Astro + React + shadcn/ui + Base UI** — static Astro markup plus explicit React islands
3. **Next.js + shadcn/ui + Base UI** — a Server Component page with interactive Client Component boundaries

The benchmark is scoped to this page, component set, and the locked dependency versions in this repository. It is not a universal framework ranking.

## Current Base UI results

Frameworks updated September 25, 2026: **Astro 7.3.5** in both Astro demos, **Next.js 16.3.6**, and **React / React DOM 19.3.0** in both React demos. Astro React uses `@astrojs/react` 7.0.0. All versions are pinned in the project manifests and lockfiles. Generated reports record installed versions in `environment.versions`.

Data-slot was updated to **1.0.1** on September 26. All six b/ui primitives and their shared core use that release; the upstream navigation fix replaces the local patch.

Both React demos now use shadcn's `base-nova` components and Base UI 1.8.0. See [the component snapshot and migration details](docs/base-ui.md). Bejamas UI retains its own Juno style; matching the underlying component family does not make all generated CSS identical.

### Route-delivered assets

Fresh production build measurements for `/`. Each compressible response is compressed independently. See [the complete asset report](results/assets.json).

| Metric | Astro + b/ui | Astro + React + shadcn Base UI | Next.js + shadcn Base UI |
|---|---:|---:|---:|
| Route JS files | 7 | 21 | 7 |
| Route JS raw | 97.54 KiB | 477.12 KiB | 757.29 KiB |
| Route JS gzip | 35.26 KiB | 160.40 KiB | 230.20 KiB |
| Route JS Brotli | 31.66 KiB | 142.47 KiB | 197.40 KiB |
| HTML raw | 110.49 KiB | 65.87 KiB | 140.58 KiB |
| CSS raw | 84.72 KiB | 66.49 KiB | 68.27 KiB |
| CSS gzip | 13.26 KiB | 10.89 KiB | 11.41 KiB |
| Loaded font subset | 28.71 KiB | 28.71 KiB | 28.71 KiB |
| HTML + CSS + JS + font, gzip estimate | 88.11 KiB | 209.28 KiB | 285.76 KiB |

The current raw CSS gap between b/ui and Astro React is 18.23 KiB. The [previous Base UI baseline](results/history/base-ui-astro5-next16.1-2026-09-25/assets.json) had an 18.59 KiB gap, while the original Radix comparison had about 33 KiB. The earlier 25 KiB figure came from diagnostic CSS cleanup and is a different baseline.

### Lighthouse mobile lab results

This September 25 baseline uses data-slot 1.0.0 with the local navigation patch. Lighthouse and the FCP diagnostics below were not rerun for the 1.0.1 interaction study.

Values are medians of five sequential Lighthouse 13.4.1 mobile runs against local production builds, served by one HTTP server with deterministic gzip. All three use their default CSS delivery for this baseline. Mobile viewport 412×823, 150 ms simulated RTT, 1,638.4 Kbps throughput, and 4× CPU slowdown.

| Metric | Astro + b/ui | Astro + React + shadcn Base UI | Next.js + shadcn Base UI |
|---|---:|---:|---:|
| Performance score | 99 | 96 | 96 |
| FCP | 1.66 s | 1.80 s | 1.22 s |
| LCP | 1.66 s | 2.55 s | 2.77 s |
| TBT | 0.0 ms | 0.0 ms | 5.0 ms |
| CLS | 0.01 | 0.02 | 0.02 |
| Speed Index | 1.66 s | 1.80 s | 1.22 s |

See [the five individual samples and methodology](results/performance.json). These are controlled local lab results, not field Core Web Vitals. CDN behavior, production TTFB and repeat-visit caching are outside this comparison.

The [FCP cause investigation](results/fcp-cause.md) shows that script priority strongly affects this simulated ranking. With unchanged CSS and JavaScript files, lowering all b/ui module priorities produced a 1.06 s median, while raising Next.js script priority produced 2.76 s. The b/ui variant ranged from 1.06–1.36 s because scripts involved in initial layout can remain in Lighthouse's paint dependency graph. Under applied DevTools throttling, the baseline medians were 1.45 s for b/ui and 1.50 s for Next.js. These are separate diagnostic runs; the table above retains each framework's default output.

### Interaction latency at 20× CPU slowdown

Measured September 26, 2026: **30 visits per implementation, ten settled actions per visit** on an Apple M5 Pro wianyth Chrome 153, a 390 × 844 mobile viewport, and touch input. Each cell is median interaction latency in milliseconds; lower is faster. All **900 actions succeeded** within the 2-second outcome deadline, with no missing Event Timing samples.

| Interaction | Astro + b/ui | Astro + React + shadcn Base UI | Next.js + shadcn Base UI |
|---|---:|---:|---:|
| Open Products menu | 200 | 384 | 544 |
| Close Products menu | 72 | 112 | 112 |
| Switch pricing to Yearly | 72 | 144 | 152 |
| Switch pricing to Monthly | 56 | 104 | 112 |
| Expand FAQ item | 64 | 72 | 80 |
| Collapse FAQ item | 48 | 56 | 56 |
| Open company-size select | 76 | 40 | 40 |
| Choose company size | 76 | 216 | 224 |
| Check newsletter box | 40 | 72 | 76 |
| Uncheck newsletter box | 32 | 48 | 52 |

On this page, the largest measured changes from data-slot 1.0.0 to 1.0.1 were **opening Products: 256 → 200 ms (22% lower)** and **opening the company-size select: 96 → 76 ms (21% lower)**. FAQ expansion changed from 72 to 64 ms; checkbox medians were unchanged. The old version already had the local navigation fix, and both versions passed all 300 b/ui actions. See [the complete before/after table](results/data-slot-1.0.1.md), including p90 and success counts.

These are scripted lab interaction timings, not field INP or measurements from a physical phone. The before/after runs used the same page, framework versions, and Chrome, but ran sequentially; small differences can reflect run variation and Event Timing's 8 ms granularity. The select-opening row needs care: Base UI has lower Event Timing latency, but the expected open DOM state was observed later. The median touch-down-to-open-state delay was **69.5 ms for b/ui, 207.1 ms for Astro React, and 206.35 ms for Next.js**. This is a DOM observation, not an exact pixel-presentation timestamp. Base UI schedules opening through an animation-frame callback, so its reported next paint can precede the completed dropdown update. The 40 ms entry therefore does not establish that its dropdown appears sooner. See [all p90 values and counts](results/interactions.md), [raw samples](results/interactions.samples.jsonl), and [the reproduction and physical-device guide](docs/interactions.md).

### Parity and accessibility

[Browser verification](results/quality.json) confirms identical visible text, theme CSS and local font; working navigation, keyboard tooltips, tabs, hover cards, accordion, both select labels and checkbox; bounded navigation popups; six focusable tooltip triggers; zero nested controls, axe violations or browser errors; and requests matching the asset report. It also enforces identical Base UI component source, matching installed Astro versions, and matching React / React DOM versions.

| Structural metric | Astro + b/ui | Astro + React + shadcn Base UI | Next.js + shadcn Base UI |
|---|---:|---:|---:|
| DOM elements after initialization | 318 | 262 | 256 |
| Serialized DOM after initialization | 75.51 KiB | 65.53 KiB | 140.56 KiB |

These counts measure browser elements. They do not include React's virtual DOM or Fiber objects in JavaScript memory.

### Historical results

The [data-slot 1.0.0 archive](results/history/data-slot-1.0.0-2026-09-26/README.md) preserves the reports, dependency lockfile, and local navigation patch from before the 1.0.1 upgrade. Its separate 30-visit b/ui baseline uses the same page and framework versions as the new interaction study.

The [Base UI baseline before framework upgrades](results/history/base-ui-astro5-next16.1-2026-09-25/README.md) preserves the Astro 5.18.2 / Next.js 16.1.6 measurements and installed versions. It already uses Base UI 1.8.0, so it is the relevant baseline for this framework upgrade. The upgrade also aligns both React demos on React 19.3.0; changes in results cannot be attributed to the framework alone.

The [Radix archive](results/history/radix-2026-09-25/README.md) preserves all earlier reports, including the [CSS inlining experiment](results/history/radix-2026-09-25/css-delivery.md), [component CSS attribution](results/history/radix-2026-09-25/css-components.md), [expanded 20× interaction study](results/history/radix-2026-09-25/interactions-expanded.md), and [earlier four-profile study](results/history/radix-2026-09-25/interactions.md). Their timings describe the pre-migration code. The expanded study also predates the [b/ui navigation bridge fix](astro-bui/patches/README.md).

CSS inlining remains available through native build settings for all three projects. The old inlining numbers have not been relabeled as Base UI results. Run `npm run performance:css` for a fresh experiment.

## What the comparison demonstrates

For this page and component set:

- b/ui uses the least JavaScript because static components remain HTML and interactive behavior comes from small vanilla-JavaScript primitives.
- Astro React loads React, the Astro island runtime, and the Base UI/shadcn code used by its interactive islands.
- The Next page is an idiomatic Server Component. Static page text is not forced through a top-level `"use client"` boundary, but the client router/runtime and interactive shadcn components still contribute to the route bundle.
- Lower JavaScript does not mean lower output in every category: b/ui ships more HTML than Astro React and retains slightly more live DOM elements after initialization.
- Interaction results distinguish settled responsiveness from whether an early input produces a UI response. Read success counts alongside latency; the page's payload alone does not establish an interaction ranking.

Claims such as “React + Base UI has a fixed bundle floor” or “Next always adds a specific number of kilobytes” are intentionally avoided. Those values change with component selection, package versions, bundler behavior, and application architecture.

## Page parity

Every variant renders the same content and interaction set:

- Header navigation with two dropdown menus
- Hero badge and calls to action
- Six feature cards with tooltips
- Monthly/yearly pricing tabs
- Six inline hover cards
- Six FAQ accordion items
- Contact form with two selects and a checkbox
- Footer link columns

The projects use the same color tokens and local Geist variable font. Framework-specific DOM wrappers and runtime markers are allowed and reported rather than treated as identical markup.

## Reproduce the benchmark

### Requirements

- Node.js 24.16.0 (`.node-version`)
- npm 11.13.0
- Bun 1.3.14
- Google Chrome; set `CHROME_PATH` if it is installed in a nonstandard location

All dependency lockfiles are tracked.

```bash
# Install the benchmark tools
npm ci

# Install each project from its lockfile
(cd astro-bui && bun install --frozen-lockfile)
npm ci --prefix astro-react-shadcn
npm ci --prefix nextjs-shadcn

# Build, measure assets, verify parity and accessibility,
# run 30 interaction rounds, and run five Lighthouse samples per project
npm run benchmark
```

Individual stages can also be run independently:

```bash
npm run build
npm run measure
npm run verify
npm run test:interactions
npm run test:navigation
npm run interactions
npm run performance
npm run performance:css
npm run performance:size
npm run performance:cause
```

Run `npm run sync:bui` to reapply the pinned Bejamas UI registry snapshot and its matching data-slot versions. Update the commit and version constants in `scripts/sync-bui.mjs` before intentionally moving the benchmark to a newer snapshot.

Use `BENCHMARK_RUNS` to change the five-run Lighthouse default. Use `INTERACTION_RUNS` to change the 30-round interaction default. The full interaction matrix runs sequentially and can take tens of minutes.

`npm run performance:css` builds baseline and inline variants, saves isolated snapshots, and restores the baseline build outputs before measuring. Set `CSS_RUNS` to change its three-run default. `BENCHMARK_INLINE_CSS=1 npm run build` enables full CSS inlining in all three projects; ordinary builds retain their default CSS delivery. Next.js uses its experimental `inlineCss` setting.

`npm run performance:size` tests page-specific CSS generation and shorter class names in isolated b/ui build copies against an unchanged Next.js control. It verifies mobile and desktop appearance and controls, then measures both simulated and applied mobile throttling. Set `FCP_SIZE_RUNS` to change the three-run default. Results go to [the size experiment report](results/fcp-size.md); production builds and headline measurements stay unchanged.

`npm run performance:cause` tests script priority and preconnect hints in isolated build copies, reconstructs Lighthouse's FCP dependency graph, replays priority changes against the same trace, and checks page content and controls. It writes [the FCP cause investigation](results/fcp-cause.md). `FCP_CAUSE_RUNS`, `FCP_CAUSE_CASES`, and `FCP_CAUSE_MODES` select runs, variants, and throttling methods; defaults cover seven variants with three runs under each method. These diagnostics keep production builds and headline results unchanged.

## Measurement details

### Asset measurement

`scripts/measure.mjs` begins at each generated `index.html` and includes:

- The route HTML response
- Referenced stylesheets
- Font subsets whose Unicode ranges match the rendered route text
- Modern JavaScript script tags
- JavaScript reached through static or dynamic ES module imports

It excludes:

- `nomodule` fallback bundles in modern-browser totals
- Manifests and chunks not referenced by `/`
- HTTP headers and protocol overhead

Gzip level 9 and Brotli quality 11 are calculated independently per response. These are reproducible compression estimates, not claims about a production CDN's negotiated encoding.

### Performance measurement

`scripts/performance.mjs` serves all production outputs through the same local server, runs Lighthouse sequentially, stores every full report, and commits a compact median summary. Running audits concurrently is deliberately avoided because resource contention distorts results.

### Interaction and accessibility verification

`scripts/verify.mjs` uses Chrome to exercise the equivalent controls, compare rendered text and requested assets, and run axe-core. The suite fails immediately when parity, functionality, accessibility, or console-error checks regress.

`scripts/interactions.mjs` separately calibrates CPU profiles and collects complete input sequences and UI outcomes. It rotates execution order, saves raw samples, and generates the result table. `npm run test:interactions` checks ignored inputs, slow handlers, delayed outcomes, missed deadlines, opening and closing controls, selected values, failed prerequisites, and remote Chrome transport. See [the interaction benchmark guide](docs/interactions.md).

## Deployments

The projects are configured as Cloudflare static-asset Workers in the `Bejamas OSS` account:

| Project | Production URL | Build output |
|---|---|---|
| Astro + b/ui | [astro-bui.bejamas-oss.workers.dev](https://astro-bui.bejamas-oss.workers.dev) | `astro-bui/dist` |
| Astro + React + shadcn | [astro-react-shadcn.bejamas-oss.workers.dev](https://astro-react-shadcn.bejamas-oss.workers.dev) | `astro-react-shadcn/dist` |
| Next.js + shadcn | [nextjs-shadcn.bejamas-oss.workers.dev](https://nextjs-shadcn.bejamas-oss.workers.dev) | `nextjs-shadcn/out` |

Deployments are intentionally separate from the benchmark command:

```bash
(cd astro-bui && bun run deploy)
(cd astro-react-shadcn && npm run deploy)
(cd nextjs-shadcn && npm run deploy)
```

## Limitations

- This is one content-heavy marketing page, not a representative sample of every application type.
- Results apply to the exact locked dependencies and implementation choices in this repository.
- Local Lighthouse runs isolate application cost but do not represent production geography, caching, CDN behavior, or real-user hardware.
- No CrUX or other field dataset is available, so the benchmark does not publish field LCP, CLS, or INP.
- The current interaction study uses 30 visits per implementation at 20× CPU slowdown, with ten settled actions per visit. It does not cover early input in this run or represent a full user session.
- CPU-calibrated mobile profiles are approximations. Physical-device results require a separate run; missing Event Timing entries remain unreported.
- Framework and library upgrades require regenerating and reviewing all committed result files.

## References

- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Astro framework component hydration](https://docs.astro.build/en/guides/framework-components/)
- [Lighthouse score variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
- [Interaction to Next Paint](https://web.dev/articles/inp)
