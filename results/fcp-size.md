# FCP size experiment

Isolated copies of existing production builds. Page-only CSS generated from every class in the complete server-rendered HTML, including closed overlays. Short class names replace classes in HTML and CSS selectors together, preserving JS-referenced classes and CSS attribute-selector fragments. All b/ui JavaScript is byte-identical. No CSS inlining, script-priority changes, content removal or HTML reserialization. Unchanged Next.js control. Sequential cold-load Lighthouse runs with rotating case order, simulated and applied DevTools throttling. These page-specific experiments are not a general library optimization.

Measured 2026-09-25T21:23:19.329Z. 3 runs per case and mode. Framework versions are recorded in the JSON report.

| Case | HTML raw KiB | HTML gzip KiB | CSS raw KiB | CSS gzip KiB |
|---|---:|---:|---:|---:|
| bui-baseline | 110.49 | 10.88 | 84.79 | 13.28 |
| bui-css | 110.49 | 10.88 | 67.53 | 11.00 |
| bui-short | 53.31 | 7.62 | 70.95 | 11.78 |
| bui-both | 53.31 | 7.62 | 53.78 | 9.17 |
| next-baseline | 140.58 | 15.45 | 68.27 | 11.41 |

## simulate

| Case | FCP | FCP range | LCP |
|---|---:|---|---:|
| b/ui baseline | 1.66 s | 1.51–1.66 s | 1.66 s |
| b/ui page-only CSS | 1.58 s | 1.50–1.58 s | 1.66 s |
| b/ui short class names | 1.58 s | 1.50–1.58 s | 1.65 s |
| b/ui page-only CSS + short names | 1.58 s | 1.51–1.58 s | 1.65 s |
| Next.js baseline | 1.21 s | 1.21–1.21 s | 2.76 s |

## devtools

| Case | FCP | FCP range | LCP |
|---|---:|---|---:|
| b/ui baseline | 1.45 s | 1.45–1.47 s | 1.45 s |
| b/ui page-only CSS | 1.42 s | 1.41–1.43 s | 1.42 s |
| b/ui short class names | 1.45 s | 1.43–1.45 s | 1.45 s |
| b/ui page-only CSS + short names | 1.41 s | 1.41–1.42 s | 1.41 s |
| Next.js baseline | 1.50 s | 1.50–1.50 s | 1.50 s |

All cases retain the same visible text. b/ui variants match initial geometry and sampled computed styles at mobile and desktop widths. Navigation, tooltip, pricing tabs, accordion, selects, hover card and checkbox checks pass. This does not exhaustively verify every interaction state or breakpoint. Shortening class names necessarily changes CSS too; it is not an HTML-only ablation. Transfer reductions do not isolate CSS parse cost from request scheduling. Three runs are diagnostic, not a statistical framework ranking.

[Settings, samples, hashes and verification](fcp-size.json). Run `node scripts/fcp-size.mjs` to repeat; `FCP_SIZE_RUNS` controls sample count. Production sources, builds and headline benchmark results are untouched.
