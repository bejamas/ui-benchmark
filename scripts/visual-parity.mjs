#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { benchmarkRoot, projects, resultsDir, readProjectStyles, readProjectVersions } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";

// Capture the real production pages. Shared preset names alone do not prove
// identical visuals across different component implementations.
const output = join(benchmarkRoot, ".benchmark-results", "visual-parity");
mkdirSync(output, { recursive: true });
const server = await startStaticServer();
const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" }),
  args: ["--host-resolver-rules=MAP *.localhost 127.0.0.1"],
  headless: true,
});
const captures = [];
try {
  for (const width of [412, 1280]) {
    for (const project of projects) {
      const page = await browser.newPage({ viewport: { width, height: 823 }, colorScheme: "light" });
      await page.goto(server.urls[project.id], { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const screenshot = join(output, `${project.id}-${width}.png`);
      await page.screenshot({ path: screenshot, fullPage: true, animations: "disabled" });
      const elements = await page.evaluate(() => {
        const properties = ["fontFamily", "fontSize", "fontWeight", "lineHeight", "color", "backgroundColor", "borderRadius", "borderTopWidth", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "rowGap", "columnGap", "boxShadow"];
        return [...document.querySelectorAll("[data-slot]")].filter(el => el.checkVisibility()).map(el => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            slot: el.getAttribute("data-slot"),
            text: el.textContent.replace(/\s+/g, " ").trim(),
            width: Math.round(rect.width * 100) / 100,
            height: Math.round(rect.height * 100) / 100,
            styles: Object.fromEntries(properties.map(key => [key, style[key]])),
          };
        });
      });
      const landmarks = await page.evaluate(() =>
        [...document.querySelectorAll("header, main > section, footer")].map(element => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        }),
      );
      captures.push({ project: project.id, width, screenshot, elements, landmarks });
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}
writeFileSync(join(output, "captures.json"), JSON.stringify(captures, null, 2) + "\n");
const comparisons = [];
for (const width of [412, 1280]) {
  const reference = captures.find(capture => capture.project === "astro-bui" && capture.width === width);
  for (const project of projects.filter(project => project.id !== "astro-bui")) {
    const candidate = captures.find(capture => capture.project === project.id && capture.width === width);
    const key = element => `${element.slot}:${element.text.replace(/\s/g, "")}`;
    const buckets = new Map();
    for (const element of candidate.elements) {
      if (!buckets.has(key(element))) buckets.set(key(element), []);
      buckets.get(key(element)).push(element);
    }
    let matchedElements = 0;
    const differences = [];
    for (const element of reference.elements) {
      const other = buckets.get(key(element))?.shift();
      if (!other) continue;
      matchedElements++;
      if (Math.abs(element.width - other.width) > 0.5 || Math.abs(element.height - other.height) > 0.5) {
        differences.push({ slot: element.slot, text: element.text, bui: [element.width, element.height], compared: [other.width, other.height] });
      }
    }
    const landmarkDifferences = reference.landmarks.flatMap((landmark, index) => {
      const other = candidate.landmarks[index];
      return !other || Object.keys(landmark).some(key => Math.abs(landmark[key] - other[key]) > 0.5)
        ? [{ index, bui: landmark, compared: other }]
        : [];
    });
    if (reference.landmarks.length !== candidate.landmarks.length) {
      landmarkDifferences.push({ counts: [reference.landmarks.length, candidate.landmarks.length] });
    }
    comparisons.push({ width, reference: reference.project, compared: project.id, matchedElements, differences, landmarkDifferences });
  }
}
mkdirSync(resultsDir, { recursive: true });
writeFileSync(join(resultsDir, "visual-parity.json"), JSON.stringify({
  measuredAt: new Date().toISOString(),
  environment: { browser: browser.version(), styles: readProjectStyles(), versions: readProjectVersions() },
  methodology: "Compare width and height of visible data-slot elements matched by slot, whitespace-normalized text and occurrence, with 0.5px tolerance. Also compare the positions and dimensions of the header, every main section and footer. Unmatched framework wrappers are excluded. This is a settled light-mode geometry check, not pixel equality or animation equivalence. Full-page screenshots and computed styles accompany the check in .benchmark-results/visual-parity/.",
  comparisons,
}, null, 2) + "\n");
if (comparisons.some(comparison => comparison.matchedElements === 0 || comparison.differences.length > 0 || comparison.landmarkDifferences.length > 0)) {
  throw new Error("Component dimensions differ; inspect results/visual-parity.json and the screenshots.");
}
console.log(`Wrote six full-page screenshots and computed styles to ${output}`);
