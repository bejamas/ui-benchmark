# UI benchmark: Astro + b/ui, Astro + React, and Next.js

This repository compares three static implementations of the same marketing page:

1. **Astro + b/ui** — Astro components with `data-slot` JavaScript primitives
2. **Astro + React + shadcn/ui** — static Astro markup plus explicit React islands
3. **Next.js + shadcn/ui** — a Server Component page with interactive Client Component boundaries

The benchmark is scoped to this page, component set, and the locked dependency versions in this repository. It is not a universal framework ranking.

## Current results

### Route-delivered assets

These are stable build-artifact measurements for `/`. JavaScript includes modern script tags and recursively imported ES modules; legacy `nomodule` files and unreferenced build artifacts are excluded. Each compressible response is compressed independently.

| Metric | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn |
|---|---:|---:|---:|
| Route JS files | **7** | 18 | **7** |
| Route JS raw | **99.24 KiB** | 375.05 KiB | 605.42 KiB |
| Route JS gzip | **36.26 KiB** | 124.95 KiB | 179.67 KiB |
| Route JS Brotli | **32.41 KiB** | 109.88 KiB | 155.25 KiB |
| JS gzip relative to b/ui | **1×** | 3.4× | 5.0× |
| HTML raw | 111.63 KiB | **57.90 KiB** | 112.35 KiB |
| CSS raw | 85.06 KiB | **51.97 KiB** | 53.10 KiB |
| Loaded font subset | 28.71 KiB | 28.71 KiB | 28.71 KiB |
| HTML + CSS + JS + font, gzip estimate | **89.39 KiB** | 171.42 KiB | 231.81 KiB |

The b/ui implementation sends substantially less JavaScript. It also emits more HTML than Astro React and leaves more live DOM elements after initialization than either React variant. These differences reflect the current component implementations.

Full file-level data is in [`results/assets.json`](results/assets.json).

### Lighthouse mobile lab results

Values are medians of five sequential Lighthouse 13.4.1 runs against local production builds served by one HTTP server with deterministic gzip.

| Metric | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn |
|---|---:|---:|---:|
| Performance score | **99** | **99** | 97 |
| FCP | 1.66 s | 1.44 s | **1.07 s** |
| LCP | **1.66 s** | 2.26 s | 2.47 s |
| TBT | **0 ms** | **0 ms** | 1.5 ms |
| CLS | 0.01 | **0.00** | 0.02 |
| Speed Index | 1.66 s | 1.44 s | **1.07 s** |

Protocol:

- Mobile viewport: 412×823 at 1.75 DPR
- Simulated network: 150 ms RTT, 1,638.4 Kbps throughput
- CPU slowdown: 4×
- Runs: 5 per project, sequentially
- Aggregation: median per metric
- CDN and production TTFB are intentionally excluded

These are controlled lab results, not field Core Web Vitals. Full summaries are in [`results/performance.json`](results/performance.json); the 15 complete Lighthouse reports are written to `.benchmark-results/lighthouse/` and are intentionally untracked.

### Interaction latency

Chrome Event Timing measures three scripted pointer interactions under 4× CPU slowdown. Values are five-run medians in milliseconds.

| Interaction | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn |
|---|---:|---:|---:|
| Switch pricing tab | 16 | 16 | 16 |
| Open FAQ item | 16 | 16 | 16 |
| Toggle newsletter checkbox | 16 | 16 | 16 |

These values are quantized by the Event Timing API and show no meaningful responsiveness separation at this page complexity. They are controlled lab interaction measurements, **not field INP**. Raw samples and p90 values are in [`results/interactions.json`](results/interactions.json).

### Parity and accessibility

The automated verification suite currently confirms:

- Identical normalized visible text across all variants
- The same theme tokens and one local Geist variable-font subset
- Functional navigation, tooltips, tabs, hover cards, accordion, selects, and checkbox
- Current b/ui overlay anatomy and navigation popup geometry bounded by the viewport
- Six keyboard-focusable tooltip triggers per page
- No nested interactive controls
- Zero axe-core violations
- Zero browser console or page errors

| Structural metric | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn |
|---|---:|---:|---:|
| DOM elements after initialization | 318 | **256** | 274 |
| Serialized DOM after initialization | 75.73 KiB | **56.83 KiB** | 111.58 KiB |

Astro + b/ui has 62 more live elements than Astro React and 44 more than Next.js. Its initial HTML includes closed overlay markup, but the newer primitives remove some overlay anatomy from the live DOM until opened. The Radix-based variants generally mount those overlays only when opened.

This measures real browser elements, not rendering-library data structures. React's virtual DOM and Fiber objects live in JavaScript memory and are therefore not counted. The remaining DOM difference reflects the markup each implementation keeps after initialization.

See [`results/quality.json`](results/quality.json) for the machine-readable report.

## What the comparison demonstrates

For this page and component set:

- b/ui uses the least JavaScript because static components remain HTML and interactive behavior comes from small vanilla-JavaScript primitives.
- Astro React loads React, the Astro island runtime, and the Radix/shadcn code used by its interactive islands.
- The Next page is an idiomatic Server Component. Static page text is not forced through a top-level `"use client"` boundary, but the client router/runtime and interactive shadcn components still contribute to the route bundle.
- Lower JavaScript does not mean lower output in every category: b/ui ships more HTML than Astro React and retains slightly more live DOM elements after initialization.
- All three implementations are responsive in the standardized interaction suite; the primary separation is payload and hydration architecture rather than observable interaction delay here.

Claims such as “React + Radix has a fixed bundle floor” or “Next always adds a specific number of kilobytes” are intentionally avoided. Those values change with component selection, package versions, bundler behavior, and application architecture.

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

# Build, measure assets, verify parity/a11y/interactions,
# and run five Lighthouse samples per project
npm run benchmark
```

Individual stages can also be run independently:

```bash
npm run build
npm run measure
npm run verify
npm run performance
```

Run `npm run sync:bui` to reapply the pinned Bejamas UI registry snapshot and its matching data-slot versions. Update the commit and version constants in `scripts/sync-bui.mjs` before intentionally moving the benchmark to a newer snapshot.

Use `BENCHMARK_RUNS` or `INTERACTION_RUNS` to change sample counts. The committed results use five runs for both.

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

`scripts/verify.mjs` uses Chrome to exercise the equivalent controls, collects Event Timing samples, compares rendered text and requested assets, and runs axe-core. The suite fails immediately when parity, functionality, accessibility, or console-error checks regress.

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
- Event Timing results cover three scripted interactions and should not be generalized to a full user session.
- Framework and library upgrades require regenerating and reviewing all committed result files.

## References

- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Astro framework component hydration](https://docs.astro.build/en/guides/framework-components/)
- [Lighthouse score variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
- [Interaction to Next Paint](https://web.dev/articles/inp)
