# Run the interaction benchmark

Build the production pages and run the harness tests before collecting results:

```bash
npm run build
npm run measure
npm run verify
npm run test:interactions
npm run interactions
```

The default run uses 30 visits per project, profile, and scenario. It runs sequentially to avoid competition for CPU time. Close other CPU-heavy applications and keep the machine connected to power. A full run can take tens of minutes.

Read [the generated table](../results/interactions.md) together with [the methodology and summaries](../results/interactions.json). Every visit, outcome, and reported Event Timing entry is saved in [the raw samples](../results/interactions.samples.jsonl), one JSON object per line. The files update after each round. A finished report has `status: "complete"` and `completedAt`.

For a smoke test, write to a separate output path so you preserve the published results:

```bash
INTERACTION_RUNS=1 \
INTERACTION_PROFILES=baseline-4x,stress-20x \
INTERACTION_OUTPUT=.benchmark-results/interactions-smoke.json \
npm run interactions
```

## CPU profiles and scenarios

| Profile | CPU slowdown | Requested viewport | Input |
|---|---|---|---|
| `baseline-4x` | 4× | 1280 × 800 | Mouse |
| `mobile-mid` | Calibrated for this host | 390 × 844, DPR 2 | Touch |
| `mobile-low` | Calibrated for this host | 390 × 844, DPR 2 | Touch |
| `stress-20x` | 20× | 390 × 844, DPR 2 | Touch |

The baseline preserves the original CPU setting, viewport, and controls. Its results are not directly interchangeable with the old five-sample report: the new collector waits for the complete input sequence and verifies the outcome.

The mobile profiles use the pinned Lighthouse CPU benchmark and Chrome DevTools' target scores of 1000 and 264. A binary search finds the slowdown, then three additional measurements validate it within 15% of the target. The report saves every calibration measurement. This follows DevTools' approach but uses Lighthouse's one-second benchmark and additional validation, rather than the DevTools UI's shorter calibration. See [Chrome's calibration guidance](https://developer.chrome.com/blog/devtools-grounded-real-world) and [its calibration implementation](https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/panels/mobile_throttling/CalibrationController.ts).

Calibration runs before each benchmark. If the host is too slow or validation is unstable, the command fails instead of assigning a misleading mobile label. Close competing applications and retry, or select the fixed profiles explicitly.

Each profile exercises two scenarios:

- **Settled:** wait for `networkidle`, then switch the pricing tab, expand the first FAQ, and check the newsletter box. No synthetic network throttling applies.
- **Early:** start with a fresh context and disabled HTTP cache. Apply 150 ms network latency, 1.6 Mbit/s download, and 750 kbit/s upload. Send one input to the Products trigger as soon as the harness observes it painted in the viewport. Do not wait for load or hydration and do not retry a failed input.

Every desktop visit uses a new browser context, disables the HTTP cache, and bypasses service workers. The browser process remains shared, so this is not a fresh browser process or guaranteed cold V8 code cache. Project order rotates every round; profile and scenario order rotate too.

## Interpret the results

An interaction succeeds only if the input reaches the intended target and the expected state appears within two seconds of pointer-down. Controls with `aria-controls` must also expose their associated content. Failures retain their raw event durations but do not count as fast successful interactions.

The failure table separates absent UI changes, late outcomes, wrong targets, missing inputs, and harness errors. A wrong-target or missing-input attempt cannot establish a handler failure. Those attempts remain in the totals and are not silently retried.

The early scenario targets the first visible trigger the harness observes after FCP, not a guaranteed point before hydration. The main thread can delay target discovery and input delivery. This can miss an earlier input that a person could queue while JavaScript blocks the main thread. Check `inputsBeforeLoad`, `input.readyState`, `input.receivedAt`, and the paint and load timestamps. Load completion alone does not prove hydration completion. Comparisons between projects also include differences in when their controls first paint.

The collector allows 250 ms after the outcome wait for Event Timing delivery. It uses the longest reported event in the input sequence, with `first-input` as a fallback for the first interaction. Event Timing rounds durations to 8 ms increments and only exposes `event` entries above its reporting threshold. An absent timing remains `null`; it is never converted to zero or treated as an interaction failure. See [Event Timing documentation](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming).

Median and nearest-rank p90 latency use successful interactions with reported timings. Always read their counts and the unreported count. These are conditional distributions; they do not estimate missing durations. The report also records input delay, processing span, and approximate presentation delay for the longest event's paint frame. `uiStateDelayMs` measures when the harness observes the expected DOM state, not when a pixel reaches the display.

The early-input table also shows navigation-to-paint, navigation-to-input, and navigation-to-outcome times. These expose the wait before a control appears, which interaction latency alone excludes. Recompute the summaries and tables from the raw observations without another browser run:

```bash
node scripts/summarize-interactions.mjs results/interactions.json
```

Wait for collection to finish before regenerating its output. The summarizer checks sample counts and rejects missing or duplicate visits.

CPU calibration does not reproduce a phone's GPU, RAM, thermal throttling, background applications, or browser scheduling. The 4× baseline also differs from the mobile profiles in viewport and input type. Compare `mobile-mid`, `mobile-low`, and `stress-20x` to study CPU changes under the same requested mobile settings. The pages can overflow a narrow mobile screen, so Chrome may expand the layout viewport. Each raw visit records the actual viewport and DPR.

The command exits unsuccessfully for harness errors or uncaught page errors. Measured interaction failures remain in the report without stopping the run. These measurements are lab interaction latency, not field INP.

## Options

| Environment variable | Default | Meaning |
|---|---|---|
| `INTERACTION_RUNS` | `30` | Positive integer visits per combination |
| `INTERACTION_PROFILES` | All four profiles | Comma-separated profile IDs |
| `INTERACTION_TIMEOUT_MS` | `2000` | Deadline for the UI outcome, from pointer-down |
| `INTERACTION_OUTPUT` | `results/interactions.json` | Summary path; table and raw samples use the same stem |
| `CHROME_PATH` | Installed Google Chrome | Local Chrome executable |
| `INTERACTION_CDP_URL` | Unset | Remote Chrome debugging endpoint; enables device mode |
| `INTERACTION_DEVICE_LABEL` | Required in device mode | Device model, OS, and test conditions |
| `INTERACTION_DEVICE_URLS` | Required in device mode | JSON object mapping all three project IDs to reachable URLs |

## Validate on an Android phone

Use a device representative of your audience. Record the model, Android version, Chrome version, power mode, and whether it is charging. Keep Chrome foregrounded and avoid running other applications during the benchmark. Let a hot device cool before starting.

Install Android platform tools, enable USB debugging on the phone, and authorize the connected computer. Open Chrome on the phone. Then start the same production builds with the benchmark's gzip server:

```bash
npm run serve:device
```

In another terminal, forward the Chrome debugging socket and reverse the three local server ports:

```bash
adb forward tcp:9222 localabstract:chrome_devtools_remote
adb reverse tcp:4173 tcp:4173
adb reverse tcp:4174 tcp:4174
adb reverse tcp:4175 tcp:4175
```

Run the device profile. Replace the label with the actual device and conditions:

```bash
INTERACTION_CDP_URL=http://127.0.0.1:9222 \
INTERACTION_DEVICE_LABEL='DEVICE MODEL; Android VERSION; power mode; charging state' \
INTERACTION_DEVICE_URLS='{"astro-bui":"http://localhost:4173/","astro-react-shadcn":"http://localhost:4174/","nextjs-shadcn":"http://localhost:4175/"}' \
npm run interactions
```

Device mode creates and closes its own tabs in the existing Chrome context. It preserves existing tabs, uses the native viewport, sends touch input, disables the HTTP cache, and bypasses service workers. It applies no CPU or network slowdown. USB port reversal removes the cellular network from the experiment; to test the device's normal network, supply reachable deployed URLs instead and record the deployed revision separately.

Device results go to `results/interactions-device.json` and matching `.md` and `.samples.jsonl` files. The remote URLs and observed browser details are recorded, but local build hashes are not attributed to remote pages. Remote transport is covered by a separate Chrome test. A physical Android run is still required before publishing device results.

Stop the local servers with Ctrl+C after the run. Remove the forwarding rules:

```bash
adb forward --remove tcp:9222
adb reverse --remove tcp:4173
adb reverse --remove tcp:4174
adb reverse --remove tcp:4175
```
