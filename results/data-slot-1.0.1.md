# data-slot interaction comparison

Astro + b/ui at 20× CPU slowdown, with 30 visits before and 30 after the dependency upgrade.

Before: data-slot 1.0.0 with the local navigation bridge patch. After: published data-slot 1.0.1, without a local patch.

Sources: [before summary](history/data-slot-1.0.0-2026-09-26/interactions-20x.json) and [after summary](interactions.json). Each links its raw samples and records build fingerprints and installed versions.

Page and component sources, framework versions, input sequence, and the 2-second outcome deadline were held constant. The old-version b/ui run was collected first; the new-version run rotated all three projects. These are sequential lab runs on the same host, so differences can include machine and run-order variation.

Median and p90 values are milliseconds, using successful interactions with reported Event Timing only. A positive median reduction means lower latency. These are scripted interaction timings, not field INP.

| Interaction | Before median | After median | Median reduction | Before p90 | After p90 | Before success | After success | Unreported before / after |
|---|---:|---:|---:|---:|---:|---|---|---|
| Open Products menu | 256 | 200 | 21.9% | 272 | 224 | 30/30 | 30/30 | 0 / 0 |
| Close Products menu | 80 | 72 | 10.0% | 88 | 80 | 30/30 | 30/30 | 0 / 0 |
| Switch pricing to Yearly | 80 | 72 | 10.0% | 88 | 80 | 30/30 | 30/30 | 0 / 0 |
| Switch pricing to Monthly | 64 | 56 | 12.5% | 72 | 64 | 30/30 | 30/30 | 0 / 0 |
| Expand FAQ item | 72 | 64 | 11.1% | 80 | 72 | 30/30 | 30/30 | 0 / 0 |
| Collapse FAQ item | 56 | 48 | 14.3% | 64 | 56 | 30/30 | 30/30 | 0 / 0 |
| Open company-size select | 96 | 76 | 20.8% | 96 | 80 | 30/30 | 30/30 | 0 / 0 |
| Choose company size | 80 | 76 | 5.0% | 88 | 80 | 30/30 | 30/30 | 0 / 0 |
| Check newsletter box | 40 | 40 | 0.0% | 48 | 40 | 30/30 | 30/30 | 0 / 0 |
| Uncheck newsletter box | 32 | 32 | 0.0% | 40 | 40 | 30/30 | 30/30 | 0 / 0 |
