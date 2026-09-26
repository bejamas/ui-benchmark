# Navigation opening: observer startup experiment

Measured 2026-09-26T08:29:32.726Z, Chrome 153.0.8010.53, data-slot 1.0.1, 20× CPU slowdown. 10 visits per variant, alternating order.

This diagnostic moves navigation geometry tracking from before revealing the active panel to after the initial layout and state commit. Opening remains synchronous. It changes an isolated copy of the generated bundle; production sources, dependencies, build outputs, and headline benchmark results stay unchanged.

| Metric | Baseline | Tracking after layout |
|---|---:|---:|
| Products opening median | 228 ms | 216 ms |
| Products opening p90 | 248 ms | 232 ms |
| Observed open-state median | 220.9 ms | 211.0 ms |

All 200/200 actions succeeded. Candidate opening was faster in 6 paired rounds, tied in 2, and slower in 2.

The result is a modest, variable improvement, not evidence that observer reordering alone solves navigation latency. Event Timing is quantized in 8 ms increments. Open-state timing is a DOM observation, not an exact pixel-presentation timestamp. Compare these paired baselines, not the 200 ms from the earlier run.

The production trace points to repeated style/layout work during mounting, observer setup, target-size measurement, and final placement. The broader optimization to investigate is a consistent mount → measure → commit → observe sequence, sharing geometry and coalescing redundant updates while preserving focus, transitions, scroll, and resize behavior. Select and dropdown-menu also start tracking before their explicit initial position update; tooltip, popover, and hover-card already use the opposite order. Benefits beyond navigation have not been measured here.

Reproduce from the locked 1.0.1 production build:

```bash
node scripts/navigation-open-experiment.mjs
NAVIGATION_BUILD_DIR=.benchmark-results/navigation-open-order/tracking-after-layout npm run test:navigation
node scripts/profile-interaction.mjs
```

The generated-bundle substitutions deliberately fail if the build changes. The [raw report](navigation-open-experiment.json) records exact substitutions, bundle hashes, installed versions, and every action. The [profiling script](../scripts/profile-interaction.mjs) saves Chrome traces under `.benchmark-results`; tracing adds overhead and those timings are not mixed with the untraced experiment.
