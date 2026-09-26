#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { cpus, arch, platform } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { benchmarkRoot, projects, resultsDir, readProjectVersions } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";
import { calibrateCPU, cpuProfiles, positiveInteger, summarize } from "./interaction-profiles.mjs";
import { controls, scenarioControls, dispatchInput, installProbe, measureSettled } from "./interaction-probe.mjs";

export const coldNetwork = { latency: 150, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8 };

export async function runVisit({ browser, url, profile, scenario, outcomeTimeoutMs = 2_000, network = coldNetwork }) {
  const ownContext = !profile.realDevice;
  const context = ownContext ? await browser.newContext({
    locale: "en-US", viewport: profile.viewport,
    isMobile: profile.touch, hasTouch: profile.touch, deviceScaleFactor: profile.touch ? 2 : 1,
    serviceWorkers: "block",
  }) : browser.contexts()[0];
  if (!context) throw new Error("Remote Chrome has no browser context");
  let page;
  try {
    page = await context.newPage();
    page.setDefaultTimeout(30_000);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.setBypassServiceWorker", { bypass: true });
    if (!profile.realDevice) await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.rate });
    if (scenario === "early" && !profile.realDevice) {
      await cdp.send("Network.emulateNetworkConditions", { offline: false, ...network });
    }
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const input = Promise.withResolvers();
    // A binding can reject before navigation has returned.
    input.promise.catch(() => {});
    await page.exposeBinding("__benchmarkInputReady", async (_source, point) => {
      try {
        await dispatchInput(cdp, point, profile.touch);
        input.resolve();
      } catch (error) {
        input.reject(error);
      }
    });
    await page.addInitScript(installProbe, {
      earlyControl: scenario === "early" ? controls.navigation : null, outcomeTimeoutMs,
    });
    await page.goto(url, { waitUntil: scenario === "early" ? "commit" : "networkidle" });
    const results = {};
    if (scenario === "early") {
      const timer = setTimeout(() => input.reject(new Error("No painted navigation target within 30 seconds")), 30_000);
      try { await input.promise; } finally { clearTimeout(timer); }
      results.navigation = await page.evaluate(() => globalThis.__interactionProbe.result());
    } else {
      for (const key of scenarioControls.settled) {
        const control = controls[key];
        if (control.requires && results[control.requires].status !== "success") {
          results[key] = { status: "prerequisite-failed", eventTiming: null, prerequisite: control.requires };
          continue;
        }
        try {
          results[key] = await measureSettled(page, cdp, control, profile.touch);
        } catch (error) {
          results[key] = { status: "harness-error", eventTiming: null, error: error.message };
        }
      }
    }
    const device = await page.evaluate(() => ({
      userAgent: navigator.userAgent, hardwareConcurrency: navigator.hardwareConcurrency,
      viewport: { width: innerWidth, height: innerHeight }, devicePixelRatio,
    }));
    return { results, errors, device };
  } finally {
    if (ownContext) await context.close();
    else await page?.close();
  }
}

export function summarizeSamples(samples, key) {
  const measurements = samples.flatMap((sample) => sample.results?.[key] ? [sample.results[key]] : []);
  const successful = measurements.filter((sample) => sample.status === "success");
  const timed = successful.filter((sample) => sample.eventTiming !== null);
  return {
    attempts: samples.length,
    successful: successful.length,
    failures: samples.length - successful.length,
    failureReasons: Object.fromEntries([...new Set(measurements.map((sample) => sample.status))]
      .filter((status) => status !== "success")
      .map((status) => [status, measurements.filter((sample) => sample.status === status).length])),
    harnessErrors: samples.filter((sample) => sample.harnessError || sample.results?.[key]?.status === "harness-error").length,
    unreportedTimings: successful.length - timed.length,
    inputsBeforeLoad: measurements.filter((sample) => sample.input && sample.input.loadAt === null).length,
    inputTimeMs: summarize(measurements.filter((sample) => sample.input).map((sample) => sample.input.startTime)),
    firstContentfulPaintMs: summarize(measurements.filter((sample) => sample.firstContentfulPaintMs != null).map((sample) => sample.firstContentfulPaintMs)),
    outcomeTimeMs: summarize(successful.map((sample) => sample.outcomeAt).filter((value) => value != null)),
    durationMs: summarize(timed.map((sample) => sample.eventTiming.durationMs)),
    inputDelayMs: summarize(timed.map((sample) => sample.eventTiming.inputDelayMs)),
    processingMs: summarize(timed.map((sample) => sample.eventTiming.processingMs)),
    presentationDelayMs: summarize(timed.map((sample) => sample.eventTiming.presentationDelayMs)),
    uiStateDelayMs: summarize(successful.map((sample) => sample.uiStateDelayMs)),
  };
}

export function markdownReport(report) {
  const fmt = (value) => value === null ? "unreported" : value.toFixed(1);
  const lines = [
    "# Interaction benchmark", "",
    `Measured ${report.measuredAt} with Chrome ${report.environment.browser}.`, "",
    `CPU profiles: ${report.profiles.map((profile) => `${profile.id} = ${profile.rate ?? "native"}×`).join("; ")}.`, "",
    "Scripted lab results, not field INP. Timing percentiles include successful, reported interactions only. Read failures and missing timings alongside them.", "",
    "| Profile | Scenario | Project | Control | Success | Before load | Median ms | p90 ms | Unreported |",
    "|---|---|---|---|---|---|---:|---:|---:|",
  ];
  for (const group of report.groups) {
    for (const [control, summary] of Object.entries(group.summary)) {
      lines.push(`| ${group.profile} | ${group.scenario} | ${group.project} | ${control} | ${summary.successful}/${summary.attempts} | ${summary.inputsBeforeLoad}/${summary.attempts} | ${fmt(summary.durationMs?.median ?? null)} | ${fmt(summary.durationMs?.p90 ?? null)} | ${summary.unreportedTimings} |`);
    }
  }
  const failedGroups = report.groups.flatMap((group) => Object.entries(group.summary)
    .filter(([, summary]) => summary.failures > 0)
    .map(([control, summary]) => ({ ...group, control, failureSummary: summary })));
  if (failedGroups.length) {
    lines.push("", "## Failed attempts", "",
      "Wrong-target and missing-input attempts cannot establish a handler failure. They remain in the attempt totals and are separated from missing or late UI outcomes below.", "",
      "| Profile | Scenario | Project | Control | No UI change | Too late | Wrong target | Missing input | Prerequisite failed | Harness errors |",
      "|---|---|---|---|---:|---:|---:|---:|---:|---:|");
    for (const group of failedGroups) {
      const reasons = group.failureSummary.failureReasons;
      lines.push(`| ${group.profile} | ${group.scenario} | ${group.project} | ${group.control} | ${reasons["no-ui-change"] ?? 0} | ${reasons["outcome-too-late"] ?? 0} | ${reasons["wrong-target"] ?? 0} | ${reasons["input-missing"] ?? 0} | ${reasons["prerequisite-failed"] ?? 0} | ${group.failureSummary.harnessErrors} |`);
    }
  }
  if (report.groups.some((group) => group.scenario === "early")) lines.push("", "## Early input relative to navigation", "",
    "Times below start at navigation. Outcome times include successful inputs only. A later first paint can shift input until after startup has settled; compare these times with the success and before-load counts above.", "",
    "| Profile | Project | Median FCP ms | Median input time ms | Median successful outcome time ms |",
    "|---|---|---:|---:|---:|");
  for (const group of report.groups.filter((group) => group.scenario === "early")) {
    const summary = group.summary.navigation;
    lines.push(`| ${group.profile} | ${group.project} | ${fmt(summary.firstContentfulPaintMs?.median ?? null)} | ${fmt(summary.inputTimeMs?.median ?? null)} | ${fmt(summary.outcomeTimeMs?.median ?? null)} |`);
  }
  return `${lines.join("\n")}\n`;
}

function buildFingerprint(project) {
  const hash = createHash("sha256");
  for (const file of readdirSync(project.buildDir, { recursive: true, withFileTypes: true })
    .filter((file) => file.isFile()).sort((a, b) => join(a.parentPath, a.name).localeCompare(join(b.parentPath, b.name)))) {
    const path = join(file.parentPath, file.name);
    hash.update(path.slice(project.buildDir.length)).update(readFileSync(path));
  }
  return hash.digest("hex");
}

async function main() {
  const runs = positiveInteger(process.env.INTERACTION_RUNS ?? "30", "INTERACTION_RUNS");
  const outcomeTimeoutMs = positiveInteger(process.env.INTERACTION_TIMEOUT_MS ?? "2000", "INTERACTION_TIMEOUT_MS");
  const endpoint = process.env.INTERACTION_CDP_URL;
  const requestedProjects = (process.env.INTERACTION_PROJECTS ?? projects.map(({ id }) => id).join(",")).split(",");
  if (requestedProjects.some(id => !projects.some(project => project.id === id)) || new Set(requestedProjects).size !== requestedProjects.length) {
    throw new Error(`INTERACTION_PROJECTS must be a comma-separated subset of ${projects.map(({ id }) => id).join(",")}`);
  }
  const selectedProjects = projects.filter(({ id }) => requestedProjects.includes(id));
  const scenarios = (process.env.INTERACTION_SCENARIOS ?? "settled,early").split(",");
  if (scenarios.some((id) => !Object.hasOwn(scenarioControls, id)) || new Set(scenarios).size !== scenarios.length) {
    throw new Error("INTERACTION_SCENARIOS must be a comma-separated subset of settled,early");
  }
  const requested = (process.env.INTERACTION_PROFILES ?? (endpoint ? "device" : "baseline-4x,mobile-mid,mobile-low,stress-20x")).split(",");
  const allowed = endpoint ? ["device"] : ["baseline-4x", "mobile-mid", "mobile-low", "stress-20x"];
  if (requested.some((id) => !allowed.includes(id)) || new Set(requested).size !== requested.length) {
    throw new Error(`INTERACTION_PROFILES must be a comma-separated subset of ${allowed.join(",")}`);
  }
  const deviceUrls = endpoint ? JSON.parse(process.env.INTERACTION_DEVICE_URLS ?? "null") : null;
  if (endpoint && (!process.env.INTERACTION_DEVICE_LABEL || !deviceUrls || selectedProjects.some(({ id }) => {
    try { return !["http:", "https:"].includes(new URL(deviceUrls[id]).protocol); } catch { return true; }
  }))) throw new Error("Device mode requires INTERACTION_DEVICE_LABEL and INTERACTION_DEVICE_URLS with an HTTP(S) URL for every project");
  const output = resolve(process.env.INTERACTION_OUTPUT ?? join(resultsDir, endpoint ? "interactions-device.json" : "interactions.json"));
  if (!output.endsWith(".json")) throw new Error("INTERACTION_OUTPUT must end with .json");
  const server = endpoint ? null : await startStaticServer();
  let browser;
  try {
    browser = endpoint ? await chromium.connectOverCDP(endpoint) : await chromium.launch({
      ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
      headless: true, args: ["--host-resolver-rules=MAP *.localhost 127.0.0.1"],
    });
    const needsCalibration = requested.some((id) => id.startsWith("mobile-"));
    if (needsCalibration) console.log("Calibrating mobile CPU profiles...");
    const calibration = needsCalibration ? await calibrateCPU(browser) : { tiers: {} };
    const profiles = endpoint ? [{ id: "device", label: process.env.INTERACTION_DEVICE_LABEL, realDevice: true, touch: true }]
      : cpuProfiles(calibration).filter((profile) => requested.includes(profile.id));
    const missing = requested.filter((id) => !profiles.some((profile) => profile.id === id));
    if (missing.length) throw new Error(`CPU calibration could not produce ${missing.join(", ")}: ${JSON.stringify(calibration.tiers)}. Close CPU-heavy applications and retry, or explicitly select available profiles.`);
    console.log(`Profiles: ${profiles.map((profile) => `${profile.id} ${profile.rate ?? "native"}×`).join(", ")}`);
    const report = {
      schemaVersion: 3, status: "running", measuredAt: new Date().toISOString(),
      samplesFile: basename(output.replace(/\.json$/, ".samples.jsonl")),
      environment: {
        versions: endpoint ? null : readProjectVersions(),
        node: process.version, browser: browser.version(), hostCPU: cpus()[0]?.model,
        platform: platform(), arch: arch(), gitCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: benchmarkRoot, encoding: "utf8" }).trim(),
        worktreeDirty: Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: benchmarkRoot, encoding: "utf8" }).trim()),
        buildHashes: endpoint ? null : Object.fromEntries(selectedProjects.map((project) => [project.id, buildFingerprint(project)])),
        remoteURLs: deviceUrls,
      },
      methodology: {
        label: "Scripted Chrome interaction latency; lab data, not field INP", runs, outcomeTimeoutMs,
        controls: Object.fromEntries(scenarios.map((scenario) => [scenario, scenarioControls[scenario]])),
        execution: "Sequential; project order rotates every run; profile and scenario order rotate every run",
        cache: endpoint ? "HTTP cache disabled and service workers bypassed; existing device context" : "Fresh browser context per visit; HTTP cache disabled and service workers bypassed; shared browser process",
        early: "One trusted input at the first observed painted navigation trigger, before any load or hydration wait; no retry",
        settled: "Wait for networkidle; open/close Products menu, switch Yearly/Monthly pricing tabs, expand/collapse first FAQ, open company-size select and choose 1–10 employees, check/uncheck newsletter. Fixed sequence; dependent actions skipped if their prerequisite fails; no retries.",
        earlyNetwork: endpoint ? "Native device connection; no synthetic network throttling" : coldNetwork,
        settledNetwork: "No synthetic network throttling",
        timing: "Maximum reported event duration after complete input; first-input fallback for first interaction; 8ms quantization; missing timings are null, never zero",
        breakdown: "Longest event and processing span of events sharing its paint within 8ms; phase estimates are approximate due to duration quantization",
        outcome: "Expected state within timeout from pointerdown; aria-controls content visible for opening or absent/hidden for closing; selected company size must appear in trigger; reject outcomes already present before input. uiStateDelayMs measures observed DOM state, not a paint timestamp",
        deviceScope: "Calibrated profiles approximate CPU throughput only. Mobile viewport/touch do not emulate phone GPU, memory pressure or thermals. Baseline uses a desktop viewport.",
      }, calibration, profiles, groups: [],
    };
    for (const profile of profiles) for (const scenario of scenarios) for (const project of selectedProjects) {
      report.groups.push({ profile: profile.id, scenario, project: project.id, samples: [], summary: {} });
    }
    function save() {
      for (const group of report.groups) {
        const keys = report.methodology.controls[group.scenario];
        group.summary = Object.fromEntries(keys.map((key) => [key, summarizeSamples(group.samples, key)]));
      }
      mkdirSync(dirname(output), { recursive: true });
      const roundNumbers = (_key, value) => typeof value === "number" ? Number(value.toFixed(3)) : value;
      const summary = { ...report, groups: report.groups.map(({ samples, ...group }) => ({ ...group, sampleCount: samples.length })) };
      writeFileSync(output, `${JSON.stringify(summary, roundNumbers, 2)}\n`);
      writeFileSync(output.replace(/\.json$/, ".samples.jsonl"), report.groups.flatMap((group) =>
        group.samples.map((sample) => JSON.stringify({
          profile: group.profile, scenario: group.scenario, project: group.project, ...sample,
        }, roundNumbers))).join("\n") + "\n");
      writeFileSync(output.replace(/\.json$/, ".md"), markdownReport(report));
    }
    const jobs = profiles.flatMap((profile) => scenarios.map((scenario) => ({ profile, scenario })));
    for (let run = 0; run < runs; run += 1) {
      console.log(`Interaction round ${run + 1}/${runs}`);
      for (let offset = 0; offset < jobs.length; offset += 1) {
        const { profile, scenario } = jobs[(run + offset) % jobs.length];
        for (let index = 0; index < selectedProjects.length; index += 1) {
          const project = selectedProjects[(run + index) % selectedProjects.length];
          const group = report.groups.find((item) => item.profile === profile.id && item.scenario === scenario && item.project === project.id);
          let sample;
          try {
            sample = await runVisit({ browser, url: (deviceUrls ?? server.urls)[project.id], profile, scenario, outcomeTimeoutMs });
          } catch (error) {
            sample = { harnessError: error.message };
            console.error(`${profile.id}/${scenario}/${project.id}: ${error.message}`);
          }
          group.samples.push({ run: run + 1, ...sample });
        }
      }
      save();
    }
    report.status = "complete";
    report.completedAt = new Date().toISOString();
    save();
    if (report.groups.some((group) => group.samples.some((sample) => sample.harnessError || sample.errors.length ||
      Object.values(sample.results).some((result) => result.status === "harness-error")))) process.exitCode = 1;
    console.log(`Wrote ${output} and ${output.replace(/\.json$/, ".md")}`);
  } finally {
    await browser?.close();
    await server?.close();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
