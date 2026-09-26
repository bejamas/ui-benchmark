#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

import { benchmarkRoot, projects, resultsDir, readProjectVersions, readProjectStyles } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";

const RUNS = Number.parseInt(process.env.BENCHMARK_RUNS ?? "5", 10);
if (!Number.isInteger(RUNS) || RUNS < 1) throw new Error("BENCHMARK_RUNS must be a positive integer");

const lighthousePackage = JSON.parse(
  readFileSync(join(benchmarkRoot, "node_modules", "lighthouse", "package.json"), "utf8"),
);
const metricAudits = {
  firstContentfulPaint: "first-contentful-paint",
  largestContentfulPaint: "largest-contentful-paint",
  totalBlockingTime: "total-blocking-time",
  cumulativeLayoutShift: "cumulative-layout-shift",
  speedIndex: "speed-index",
};

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

const server = await startStaticServer();
const reportsDir = join(benchmarkRoot, ".benchmark-results", "lighthouse");
mkdirSync(reportsDir, { recursive: true });

const chrome = await launch({
  ...(process.env.CHROME_PATH ? { chromePath: process.env.CHROME_PATH } : {}),
  chromeFlags: [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--host-resolver-rules=MAP *.localhost 127.0.0.1",
  ],
});

const projectResults = [];
let capturedSettings = null;

try {
  for (const project of projects) {
    const runs = [];
    const projectReportsDir = join(reportsDir, project.id);
    mkdirSync(projectReportsDir, { recursive: true });

    for (let run = 1; run <= RUNS; run += 1) {
      console.log(`${project.name}: Lighthouse mobile run ${run}/${RUNS}`);
      const result = await lighthouse(server.urls[project.id], {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        onlyCategories: ["performance"],
        formFactor: "mobile",
        throttlingMethod: "simulate",
        maxWaitForLoad: 45_000,
      });

      if (!result) throw new Error(`Lighthouse returned no result for ${project.name}`);
      capturedSettings ??= result.lhr.configSettings;

      const metrics = Object.fromEntries(
        Object.entries(metricAudits).map(([name, auditId]) => {
          const value = result.lhr.audits[auditId]?.numericValue;
          if (typeof value !== "number") throw new Error(`Missing ${auditId} for ${project.name}`);
          return [name, round(value)];
        }),
      );
      const performanceScore = result.lhr.categories.performance.score;
      if (typeof performanceScore !== "number") {
        throw new Error(`Missing performance score for ${project.name}`);
      }

      const reportPath = join(projectReportsDir, `run-${run}.json`);
      writeFileSync(reportPath, typeof result.report === "string"
        ? result.report
        : JSON.stringify(result.lhr));
      runs.push({
        run,
        performanceScore: round(performanceScore * 100),
        metrics,
        report: relative(benchmarkRoot, reportPath),
      });
    }

    const medians = {
      performanceScore: round(median(runs.map((run) => run.performanceScore))),
      metrics: Object.fromEntries(
        Object.keys(metricAudits).map((metric) => [
          metric,
          round(median(runs.map((run) => run.metrics[metric]))),
        ]),
      ),
    };
    projectResults.push({ id: project.id, name: project.name, runs, medians });
  }
} finally {
  await chrome.kill();
  await server.close();
}

const report = {
  schemaVersion: 1,
  measuredAt: new Date().toISOString(),
  environment: {
    versions: readProjectVersions(),
    styles: readProjectStyles(),
    node: process.version,
    lighthouse: lighthousePackage.version,
    runsPerProject: RUNS,
    execution: "sequential",
  },
  methodology: {
    source: "local production builds served with deterministic gzip by one HTTP server on isolated localhost hostnames",
    formFactor: "mobile",
    aggregation: "median of independent Lighthouse runs",
    fieldData: false,
    interactionMetric: "Not included; see results/interactions.json for scripted lab interaction latency.",
    lighthouseSettings: capturedSettings,
  },
  projects: projectResults,
};

mkdirSync(resultsDir, { recursive: true });
const outputPath = join(resultsDir, "performance.json");
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Wrote ${relative(benchmarkRoot, outputPath)}`);
