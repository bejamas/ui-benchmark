#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import axe from "axe-core";
import { chromium } from "playwright-core";

import { benchmarkRoot, projects, resultsDir } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";

const INTERACTION_RUNS = Number.parseInt(process.env.INTERACTION_RUNS ?? "5", 10);
const CPU_THROTTLING_RATE = 4;
const FIRST_FAQ = "How is this different from shadcn/ui?";
const assetReport = JSON.parse(readFileSync(join(resultsDir, "assets.json"), "utf8"));
const expectedScripts = new Map(
  assetReport.projects.map((project) => [
    project.id,
    project.categories.javascript.files.map((file) => `/${file.path}`).sort(),
  ]),
);
const styleSources = [
  "astro-bui/src/styles/globals.css",
  "astro-react-shadcn/src/styles/globals.css",
  "nextjs-shadcn/src/app/globals.css",
].map((filePath) => readFileSync(join(benchmarkRoot, filePath), "utf8"));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(percentileValue * sorted.length) - 1)];
}

async function installEventTimingObserver(page) {
  await page.evaluate(() => {
    globalThis.__benchmarkEvents = [];
    const observer = new PerformanceObserver((list) => {
      globalThis.__benchmarkEvents.push(
        ...list.getEntries().map((entry) => ({
          duration: entry.duration,
          interactionId: entry.interactionId,
          name: entry.name,
        })),
      );
    });
    observer.observe({ type: "event", durationThreshold: 0 });
  });
}

async function measureEventTiming(page, locator) {
  await locator.waitFor({ state: "visible" });
  const startIndex = await page.evaluate(() => globalThis.__benchmarkEvents.length);
  await locator.click();
  await page.waitForFunction(
    (index) => globalThis.__benchmarkEvents
      .slice(index)
      .some((entry) => entry.interactionId > 0),
    startIndex,
    { timeout: 2_000 },
  );

  return page.evaluate((index) => {
    const entries = globalThis.__benchmarkEvents
      .slice(index)
      .filter((entry) => entry.interactionId > 0);
    const interactionId = entries[0].interactionId;
    return Math.max(
      ...entries
        .filter((entry) => entry.interactionId === interactionId)
        .map((entry) => entry.duration),
    );
  }, startIndex);
}

async function verifyInteractions(page) {
  await page.getByRole("button", { name: "Products", exact: true }).click();
  await page.getByRole("link", { name: /Analytics/ }).waitFor({ state: "visible" });
  await page.keyboard.press("Escape");

  const tooltipTrigger = page.getByRole("button", { name: /^More information:/ }).first();
  await tooltipTrigger.focus();
  await page.getByRole("tooltip").first().waitFor({ state: "visible" });
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Yearly", exact: true }).click();
  await page.getByText("$278", { exact: false }).waitFor({ state: "visible" });

  await page.getByRole("button", { name: FIRST_FAQ, exact: true }).click();
  await page.getByText("While inspired by shadcn/ui's copy-and-own approach", { exact: false })
    .waitFor({ state: "visible" });

  await page.locator("#company-size").click();
  await page.getByRole("option", { name: "1–10 employees", exact: true })
    .waitFor({ state: "visible" });
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "React", exact: true }).hover();
  await page.getByText("A JavaScript library for building user interfaces", { exact: false })
    .waitFor({ state: "visible" });

  const checkbox = page.locator("#newsletter");
  const before = await checkbox.getAttribute("aria-checked") ?? await checkbox.isChecked();
  await checkbox.click();
  const after = await checkbox.getAttribute("aria-checked") ?? await checkbox.isChecked();
  assert(before !== after, "Newsletter checkbox did not change state");
}

async function collectInteractionLatency(page, cdp) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_THROTTLING_RATE });
  const samples = {
    pricingTabs: [],
    faqAccordion: [],
    newsletterCheckbox: [],
  };

  for (let run = 0; run < INTERACTION_RUNS; run += 1) {
    await page.reload({ waitUntil: "networkidle" });
    await installEventTimingObserver(page);
    samples.pricingTabs.push(
      await measureEventTiming(
        page,
        page.getByRole("tab", { name: "Yearly", exact: true }),
      ),
    );
    samples.faqAccordion.push(
      await measureEventTiming(
        page,
        page.getByRole("button", { name: FIRST_FAQ, exact: true }),
      ),
    );
    samples.newsletterCheckbox.push(
      await measureEventTiming(page, page.locator("#newsletter")),
    );
  }

  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  return Object.fromEntries(
    Object.entries(samples).map(([interaction, values]) => [interaction, {
      samplesMs: values.map(round),
      medianMs: round(median(values)),
      p90Ms: round(percentile(values, 0.9)),
    }]),
  );
}

const server = await startStaticServer();
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH }
    : { channel: "chrome" }),
  headless: true,
  args: ["--host-resolver-rules=MAP *.localhost 127.0.0.1"],
});
const browserVersion = browser.version();

const measuredAt = new Date().toISOString();
const qualityProjects = [];
const interactionProjects = [];

assert(new Set(styleSources).size === 1, "The benchmark variants do not share the same global styles");

try {
  for (const project of projects) {
    console.log(`Verifying ${project.name}`);
    const context = await browser.newContext({
      locale: "en-US",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    const browserErrors = [];

    page.on("console", (message) => {
      if (message.type() === "error") browserErrors.push(message.text());
    });
    page.on("pageerror", (error) => browserErrors.push(error.message));

    await page.goto(server.urls[project.id], { waitUntil: "networkidle" });
    const axeScript = await page.addScriptTag({ content: axe.source });

    const accessibility = await page.evaluate(async () => {
      const result = await globalThis.axe.run(document);
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.length,
      }));
    });
    await axeScript.evaluate((element) => element.remove());

    const pageData = await page.evaluate(() => ({
      normalizedText: document.body.innerText.replace(/\s+/g, " ").trim(),
      domElements: document.querySelectorAll("*").length,
      htmlBytes: new TextEncoder().encode(document.documentElement.outerHTML).byteLength,
      navLabel: document.querySelector("nav")?.getAttribute("aria-label"),
      tooltipTriggers: [...document.querySelectorAll('[data-slot="tooltip-trigger"]')]
        .map((element) => ({
          tag: element.tagName,
          name: element.getAttribute("aria-label"),
          tabIndex: element.tabIndex,
        })),
      nestedInteractiveControls: document.querySelectorAll(
        "button a, a button, button button, a a",
      ).length,
      scriptRequests: performance.getEntriesByType("resource")
        .filter((entry) => /\.js(?:$|\?)/.test(entry.name))
        .map((entry) => new URL(entry.name).pathname)
        .sort(),
      fontRequests: performance.getEntriesByType("resource")
        .filter((entry) => /\.(?:woff2?|ttf)(?:$|\?)/.test(entry.name))
        .map((entry) => new URL(entry.name).pathname)
        .sort(),
    }));

    await verifyInteractions(page);
    const interactions = await collectInteractionLatency(page, cdp);

    assert(accessibility.length === 0, `${project.name} has ${accessibility.length} axe violations`);
    assert(browserErrors.length === 0, `${project.name} logged browser errors: ${browserErrors.join("; ")}`);
    assert(pageData.navLabel === "Main", `${project.name} navigation is missing its accessible name`);
    assert(pageData.tooltipTriggers.length === 6, `${project.name} does not expose six tooltip triggers`);
    assert(
      pageData.tooltipTriggers.every((trigger) =>
        trigger.tag === "BUTTON" && trigger.tabIndex === 0 && trigger.name?.startsWith("More information:"),
      ),
      `${project.name} has a non-keyboard-accessible tooltip trigger`,
    );
    assert(pageData.nestedInteractiveControls === 0, `${project.name} contains nested interactive controls`);
    assert(pageData.fontRequests.length === 1, `${project.name} did not load exactly one font subset`);
    assert(
      JSON.stringify(pageData.scriptRequests) === JSON.stringify(expectedScripts.get(project.id)),
      `${project.name} browser requests do not match results/assets.json`,
    );

    qualityProjects.push({
      id: project.id,
      name: project.name,
      textHash: createHash("sha256").update(pageData.normalizedText).digest("hex"),
      domElements: pageData.domElements,
      hydratedHtmlBytes: pageData.htmlBytes,
      scriptRequests: pageData.scriptRequests,
      fontRequests: pageData.fontRequests,
      accessibilityViolations: accessibility,
      browserErrors,
    });
    interactionProjects.push({ id: project.id, name: project.name, interactions });

    await context.close();
  }

  assert(
    new Set(qualityProjects.map((project) => project.textHash)).size === 1,
    "The rendered page text differs between benchmark variants",
  );
} finally {
  await browser.close();
  await server.close();
}

mkdirSync(resultsDir, { recursive: true });
const qualityReport = {
  schemaVersion: 1,
  measuredAt,
  environment: {
    node: process.version,
    browser: browserVersion,
    viewport: { width: 1280, height: 800 },
  },
  checks: [
    "identical normalized visible text",
    "identical global style source and one local Geist font subset",
    "six keyboard-focusable tooltip triggers",
    "functional navigation, tooltip, tabs, hover card, accordion, selects, and checkbox",
    "zero nested interactive controls",
    "zero axe-core violations",
    "zero browser errors",
    "browser JavaScript requests match the route asset report",
  ],
  projects: qualityProjects,
};
const interactionReport = {
  schemaVersion: 1,
  measuredAt,
  methodology: {
    label: "scripted Chrome Event Timing interaction latency (lab data, not field INP)",
    runs: INTERACTION_RUNS,
    cpuThrottlingRate: CPU_THROTTLING_RATE,
    viewport: { width: 1280, height: 800 },
    aggregation: "median and nearest-rank p90",
  },
  projects: interactionProjects,
};

for (const [filename, report] of [
  ["quality.json", qualityReport],
  ["interactions.json", interactionReport],
]) {
  const outputPath = join(resultsDir, filename);
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${relative(benchmarkRoot, outputPath)}`);
}
