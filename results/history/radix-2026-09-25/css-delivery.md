# CSS delivery comparison

Measured 2026-09-25T20:15:15.181Z. Medians of 3 sequential runs per case and throttling mode.

Native production builds: Astro build.inlineStylesheets=always; Next experimental.inlineCss=true. Baseline uses framework defaults. All six cases use one gzip server, cold navigation, mobile viewport, sequential audits and rotating case order. Both throttling modes are lab approximations. No script-priority changes. Generated baseline output is restored after building inline cases.

These are cold-load lab results. They do not measure repeat-visit caching or field performance. Next.js CSS inlining is experimental in the pinned version.

## Simulated throttling

| Implementation | CSS | FCP | LCP | Speed Index | FCP range |
|---|---|---:|---:|---:|---:|
| Astro + b/ui | baseline | 1.65 s | 1.65 s | 1.65 s | 1.65 s to 1.66 s |
| Astro + b/ui | inline | 1.50 s | 1.50 s | 1.50 s | 1.50 s to 1.51 s |
| Astro + React + shadcn | baseline | 1.43 s | 2.25 s | 1.43 s | 1.06 s to 1.66 s |
| Astro + React + shadcn | inline | 1.66 s | 2.27 s | 1.66 s | 1.44 s to 1.66 s |
| Next.js + shadcn | baseline | 1.06 s | 2.45 s | 1.06 s | 1.06 s to 1.06 s |
| Next.js + shadcn | inline | 1.06 s | 2.46 s | 1.06 s | 1.06 s to 1.07 s |

## Applied DevTools throttling

| Implementation | CSS | FCP | LCP | Speed Index | FCP range |
|---|---|---:|---:|---:|---:|
| Astro + b/ui | baseline | 1.44 s | 1.44 s | 1.58 s | 1.43 s to 1.48 s |
| Astro + b/ui | inline | 0.67 s | 0.71 s | 0.86 s | 0.67 s to 0.67 s |
| Astro + React + shadcn | baseline | 1.22 s | 1.28 s | 1.43 s | 1.22 s to 1.24 s |
| Astro + React + shadcn | inline | 0.64 s | 0.71 s | 0.87 s | 0.64 s to 0.65 s |
| Next.js + shadcn | baseline | 1.48 s | 1.48 s | 1.57 s | 1.48 s to 1.50 s |
| Next.js + shadcn | inline | 0.67 s | 0.73 s | 0.85 s | 0.66 s to 0.67 s |

## Verification

All inline variants made zero stylesheet requests, including during hydration and the navigation-menu and pricing-tab checks. Each inline variant retained its baseline visible text and produced no browser errors. Full-page screenshots and Lighthouse reports are saved with the build snapshots.

[Raw samples, build hashes, settings, and verification](css-delivery.json).

Run `npm run performance:css` to rebuild and repeat the comparison. Set `CSS_RUNS` to change the default three runs.

Framework references: [Astro stylesheet inlining](https://docs.astro.build/en/guides/styling/) and [Next.js inlineCss](https://nextjs.org/docs/app/api-reference/config/next-config-js/inlineCss).
