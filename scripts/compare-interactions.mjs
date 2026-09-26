#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import assert from "node:assert/strict";

const [beforePath, afterPath, outputPath] = process.argv.slice(2);
if (!beforePath || !afterPath || !outputPath) {
  throw new Error("Usage: node scripts/compare-interactions.mjs BEFORE.json AFTER.json OUTPUT.md");
}
const reports = [beforePath, afterPath].map(path => JSON.parse(readFileSync(path, "utf8")));
const groups = reports.map(report => report.groups.find(group =>
  group.project === "astro-bui" && group.profile === "stress-20x" && group.scenario === "settled"));
if (reports.some(report => report.status !== "complete") || groups.some(group => !group)) {
  throw new Error("Both reports must be complete and include astro-bui/stress-20x/settled");
}
if (reports[0].methodology.outcomeTimeoutMs !== reports[1].methodology.outcomeTimeoutMs ||
    JSON.stringify(reports[0].methodology.controls.settled) !== JSON.stringify(reports[1].methodology.controls.settled)) {
  throw new Error("The outcome deadline and interaction sequence must match");
}
assert.deepEqual(reports[0].profiles.find(profile => profile.id === "stress-20x"),
  reports[1].profiles.find(profile => profile.id === "stress-20x"), "CPU and input profiles must match");
for (const key of ["node", "browser", "hostCPU", "platform", "arch"]) {
  assert.equal(reports[0].environment[key], reports[1].environment[key], `${key} must match`);
}
const frameworkVersions = report => Object.fromEntries(Object.entries(report.environment.versions["astro-bui"])
  .filter(([name]) => !name.startsWith("@data-slot/")));
assert.deepEqual(frameworkVersions(reports[0]), frameworkVersions(reports[1]), "Other b/ui dependencies must match");
const labels = {
  navigation: "Open Products menu", navigationClose: "Close Products menu",
  pricingTabs: "Switch pricing to Yearly", pricingMonthly: "Switch pricing to Monthly",
  faqAccordion: "Expand FAQ item", faqCollapse: "Collapse FAQ item",
  companySelect: "Open company-size select", companyOption: "Choose company size",
  newsletterCheckbox: "Check newsletter box", newsletterUncheck: "Uncheck newsletter box",
};
const versions = reports.map(report => report.environment.versions["astro-bui"]["@data-slot/navigation-menu"]);
const link = path => relative(dirname(resolve(outputPath)), resolve(path)).replaceAll("\\", "/");
const value = number => number == null ? "unreported" : String(number);
const counts = summary => `${summary.successful}/${summary.attempts}`;
const lines = [
  "# data-slot interaction comparison", "",
  `Astro + b/ui at 20× CPU slowdown, with ${groups[0].sampleCount} visits before and ${groups[1].sampleCount} after the dependency upgrade.`, "",
  `Before: data-slot ${versions[0]} with the local navigation bridge patch. After: published data-slot ${versions[1]}, without a local patch.`, "",
  `Sources: [before summary](${link(beforePath)}) and [after summary](${link(afterPath)}). Each links its raw samples and records build fingerprints and installed versions.`, "",
  "Page and component sources, framework versions, input sequence, and the 2-second outcome deadline were held constant. The old-version b/ui run was collected first; the new-version run rotated all three projects. These are sequential lab runs on the same host, so differences can include machine and run-order variation.", "",
  "Median and p90 values are milliseconds, using successful interactions with reported Event Timing only. A positive median reduction means lower latency. These are scripted interaction timings, not field INP.", "",
  "| Interaction | Before median | After median | Median reduction | Before p90 | After p90 | Before success | After success | Unreported before / after |",
  "|---|---:|---:|---:|---:|---:|---|---|---|",
];
for (const key of reports[0].methodology.controls.settled) {
  const [before, after] = groups.map(group => group.summary[key]);
  const reduction = before.durationMs?.median > 0 && after.durationMs?.median != null
    ? `${((1 - after.durationMs.median / before.durationMs.median) * 100).toFixed(1)}%` : "unreported";
  lines.push(`| ${labels[key] ?? key} | ${value(before.durationMs?.median)} | ${value(after.durationMs?.median)} | ${reduction} | ${value(before.durationMs?.p90)} | ${value(after.durationMs?.p90)} | ${counts(before)} | ${counts(after)} | ${before.unreportedTimings} / ${after.unreportedTimings} |`);
}
writeFileSync(outputPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${outputPath}`);
