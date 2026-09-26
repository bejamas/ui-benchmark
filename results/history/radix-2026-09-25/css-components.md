# Component CSS attribution

Fresh isolated copies with @preview documentation blocks removed and six state aliases combined into single :where selectors in both projects. One family at a time is excluded from Tailwind source detection, then families are excluded cumulatively. Rendered HTML must stay byte-identical apart from the stylesheet link. These diagnostic builds deliberately omit needed styles and are not shippable optimizations.

Measured 2026-09-25T20:28:24.329Z. The cleaned baseline is 76.99 KiB for b/ui and 51.97 KiB for Astro React, a 25.01 KiB raw CSS gap.

## Excluding one family at a time

These savings overlap because components share utilities. Do not add these rows. Positive excess means b/ui has more CSS uniquely dependent on that family.

| Family | b/ui savings, KiB | React savings, KiB | Excess b/ui CSS, KiB |
|---|---:|---:|---:|
| tabs | 10.90 | 4.99 | 5.91 |
| navigation-menu | 13.17 | 8.27 | 4.91 |
| card | 3.80 | 0.99 | 2.81 |
| button | 4.20 | 1.65 | 2.55 |
| hover-card | 2.09 | 0.16 | 1.93 |
| tooltip | 2.59 | 0.80 | 1.79 |
| checkbox | 1.78 | 0.73 | 1.05 |
| accordion | 2.29 | 1.52 | 0.78 |
| input | 1.56 | 1.06 | 0.51 |
| badge | 1.26 | 1.13 | 0.13 |
| label | 0.35 | 0.35 | 0.00 |
| separator | 0.02 | 0.31 | -0.29 |
| select | 2.13 | 2.50 | -0.37 |

## Cumulative accounting

Families are removed in the order below, sorted by their independent excess. These contributions add up, but allocation of shared utilities depends on the removal order. Negative values mean React lost more CSS at that step.

| Removed family | Contribution to original gap, KiB | Remaining gap, KiB |
|---|---:|---:|
| tabs | 5.91 | 19.11 |
| navigation-menu | 4.91 | 14.20 |
| card | 3.09 | 11.11 |
| button | 2.71 | 8.40 |
| hover-card | 2.35 | 6.05 |
| tooltip | 4.14 | 1.91 |
| checkbox | 1.33 | 0.58 |
| accordion | 0.74 | -0.16 |
| input | 0.42 | -0.58 |
| badge | 0.67 | -1.25 |
| label | 0.00 | -1.25 |
| separator | -0.30 | -0.95 |
| select | -1.14 | 0.18 |
| Remaining scanned sources outside component library | 0.18 | 0.00 |
| Base CSS difference with source detection disabled | 0.00 | 0.00 |
| **Total accounted for** | **25.01** | |

The remaining scanned sources include page markup, React wrapper components, helpers, documentation outside preview blocks, and other text files Tailwind detects. The final source(none) build keeps CSS imports and @apply rules while disabling source-generated utilities.

Run `node scripts/css-components.mjs` to reproduce. Production sources and build outputs are untouched. Temporary build logs and every generated stylesheet are stored under `.benchmark-results/css-components/`.

[Raw measurements and stylesheet hashes](css-components.json).
