#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { markdownReport, summarizeSamples } from "./interactions.mjs";

// Recompute tables and percentiles from saved observations without another
// browser run. This also checks that no visit disappeared during serialization.
const path = resolve(process.argv[2] ?? "results/interactions.json");
if (!path.endsWith(".json")) throw new Error("The report path must end with .json");
const report = JSON.parse(readFileSync(path, "utf8"));
const samples = readFileSync(join(dirname(path), report.samplesFile), "utf8")
  .trim().split("\n").map((line) => JSON.parse(line));
const assigned = new Set();
for (const group of report.groups) {
  const visits = samples.filter((sample) =>
    sample.profile === group.profile && sample.scenario === group.scenario && sample.project === group.project);
  const runIds = new Set(visits.map((sample) => sample.run));
  if (visits.length !== group.sampleCount || runIds.size !== visits.length ||
      visits.some((sample) => !Number.isInteger(sample.run) || sample.run < 1 || sample.run > report.methodology.runs) ||
      (report.status === "complete" && visits.length !== report.methodology.runs)) {
    throw new Error(`Missing or duplicate visits: ${group.profile}/${group.scenario}/${group.project}`);
  }
  for (const sample of visits) assigned.add(sample);
  const keys = group.scenario === "early" ? ["navigation"] : ["pricingTabs", "faqAccordion", "newsletterCheckbox"];
  group.summary = Object.fromEntries(keys.map((key) => [key, summarizeSamples(visits, key)]));
}
if (assigned.size !== samples.length) throw new Error("Raw samples contain an unknown group");
writeFileSync(path, `${JSON.stringify(report, (_key, value) => typeof value === "number" ? Number(value.toFixed(3)) : value, 2)}\n`);
writeFileSync(path.replace(/\.json$/, ".md"), markdownReport(report));
console.log(`Verified and summarized ${samples.length} visits from ${report.samplesFile}`);
