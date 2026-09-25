import { pageFunctions } from "lighthouse/core/lib/page-functions.js";

export const desktopViewport = { width: 1280, height: 800 };
export const mobileViewport = { width: 390, height: 844 };

export function positiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return number;
}

export function summarize(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return {
    count: sorted.length,
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    p90: sorted[Math.ceil(sorted.length * 0.9) - 1],
  };
}

// DevTools' CalibrationController targets these Lighthouse BenchmarkIndex scores.
// Use the installed, pinned Lighthouse implementation instead of vendoring it.
// https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/panels/mobile_throttling/CalibrationController.ts
export async function calibrateCPU(browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const samples = [];
  async function score(rate) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate });
    const value = await page.evaluate(pageFunctions.computeBenchmarkIndex);
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid CPU score: ${value}`);
    samples.push({ rate, score: value });
    return value;
  }
  try {
    await score(1); // Warm up V8 before calibration.
    const hostScore = summarize([await score(1), await score(1), await score(1)]).median;
    const tiers = {};
    for (const [name, targetScore] of [["mid", 1000], ["low", 264]]) {
      if (hostScore < targetScore) {
        tiers[name] = { status: "host-too-slow", targetScore, hostScore };
        continue;
      }
      let lower = 1;
      let upper = Math.max(2, hostScore / targetScore * 1.5);
      while (await score(upper) > targetScore && upper < 100) upper *= 1.5;
      let rate = 1;
      for (let iteration = 0; iteration < 9; iteration += 1) {
        rate = Math.round((lower + upper) / 2 * 100) / 100;
        const actual = await score(rate);
        if (Math.abs(actual / targetScore - 1) <= 0.03) break;
        if (actual > targetScore) lower = rate;
        else upper = rate;
      }
      const measuredScore = summarize([await score(rate), await score(rate), await score(rate)]).median;
      const relativeError = Math.abs(measuredScore / targetScore - 1);
      tiers[name] = {
        status: relativeError <= 0.15 ? "calibrated" : "unstable",
        rate, targetScore, measuredScore, relativeError,
      };
    }
    return {
      method: "Lighthouse BenchmarkIndex, DevTools target scores, bisection, three-sample validation within 15%",
      hostScore, tiers, samples,
    };
  } finally {
    await context.close();
  }
}

export function cpuProfiles(calibration) {
  return [
    { id: "baseline-4x", label: "4× desktop baseline", rate: 4, viewport: desktopViewport, touch: false },
    ...Object.entries(calibration.tiers)
      .filter(([, tier]) => tier.status === "calibrated")
      .map(([name, tier]) => ({
        id: `mobile-${name}`, label: `Calibrated ${name}-tier CPU`,
        rate: tier.rate, viewport: mobileViewport, touch: true,
      })),
    { id: "stress-20x", label: "20× mobile stress test", rate: 20, viewport: mobileViewport, touch: true },
  ];
}
