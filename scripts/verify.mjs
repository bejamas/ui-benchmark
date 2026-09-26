#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import axe from "axe-core";
import { chromium } from "playwright-core";

import { benchmarkRoot, projects, resultsDir, readProjectVersions, readProjectStyles } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";

const FIRST_FAQ = "How is this different from shadcn/ui?";
const REQUIRED_BUI_SLOTS = [
  "checkbox-indicator",
  "hover-card-portal",
  "hover-card-positioner",
  "navigation-menu-popup",
  "navigation-menu-portal",
  "navigation-menu-positioner",
  "navigation-menu-viewport",
  "select-scroll-down-button",
  "select-scroll-up-button",
  "select-viewport",
  "tooltip-arrow",
  "tooltip-portal",
  "tooltip-positioner",
];
const assetReport = JSON.parse(
  readFileSync(join(resultsDir, "assets.json"), "utf8"),
);
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

const versions = readProjectVersions();
const buiConfig = JSON.parse(
  readFileSync(join(benchmarkRoot, "astro-bui/components.json"), "utf8"),
);
assert(buiConfig.style === "bejamas-nova", "b/ui must use Nova to match the React demos");
assert(versions["astro-bui"].astro === versions["astro-react-shadcn"].astro, "Astro demos must use the same installed Astro version");
for (const name of ["react", "react-dom"]) {
  assert(versions["astro-react-shadcn"][name] === versions["nextjs-shadcn"][name], "React demos must use the same installed " + name + " version");
}

// Keep the two React demos on the same copied shadcn implementation.
const reactProjects = ["astro-react-shadcn", "nextjs-shadcn"];
const componentNames = [
  "accordion",
  "badge",
  "button",
  "card",
  "checkbox",
  "hover-card",
  "input",
  "label",
  "navigation-menu",
  "select",
  "separator",
  "tabs",
  "tooltip",
];
for (const name of componentNames) {
  const sources = reactProjects.map((project) =>
    readFileSync(
      join(benchmarkRoot, project, "src/components/ui", name + ".tsx"),
      "utf8",
    ),
  );
  assert(sources[0] === sources[1], name + " differs between the React demos");
  assert(
    !sources.some((source) => /from ["'](?:radix-ui|@radix-ui\/)/.test(source)),
    name + " still imports Radix",
  );
}
for (const project of reactProjects) {
  const config = JSON.parse(
    readFileSync(join(benchmarkRoot, project, "components.json"), "utf8"),
  );
  const pkg = JSON.parse(
    readFileSync(join(benchmarkRoot, project, "package.json"), "utf8"),
  );
  assert(
    config.style === "base-nova",
    project + " must use the shared Base UI preset",
  );
  assert(
    pkg.dependencies["@base-ui/react"] === "1.8.0",
    project + " must use the pinned Base UI version",
  );
  assert(
    !Object.keys(pkg.dependencies).some(
      (name) => name === "radix-ui" || name.startsWith("@radix-ui/"),
    ),
    project + " still depends on Radix",
  );
}

async function verifyInteractions(page, projectId) {
  // Lazy overlays only connect their anatomy while open. Observe each open
  // state without changing the initial-DOM measurement below.
  const observedBuiSlots = new Set();
  async function captureBuiSlots() {
    if (projectId !== "astro-bui") return;
    const slots = await page
      .locator("[data-slot]")
      .evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("data-slot")),
      );
    for (const slot of slots) observedBuiSlots.add(slot);
  }
  await page.getByRole("button", { name: "Products", exact: true }).click();
  const analyticsLink = page.getByRole("link", { name: /Analytics/ });
  await analyticsLink.waitFor({ state: "visible" });
  const navigationPopup = await analyticsLink.evaluate((link, id) => {
    const content = link.closest('[data-slot="navigation-menu-content"]');
    const surface =
      id === "astro-bui"
        ? (document.querySelector('[data-slot="navigation-menu-popup"]') ??
          document.querySelector('[data-slot="navigation-menu-viewport"]'))
        : content;

    if (!(surface instanceof HTMLElement)) return null;

    const rect = surface.getBoundingClientRect();
    return {
      left: roundForBrowser(rect.left),
      right: roundForBrowser(rect.right),
      width: roundForBrowser(rect.width),
      viewportWidth: window.innerWidth,
    };

    function roundForBrowser(value) {
      return Math.round(value * 100) / 100;
    }
  }, projectId);
  assert(
    navigationPopup,
    `${projectId} navigation popup could not be measured`,
  );
  assert(
    navigationPopup.width < navigationPopup.viewportWidth * 0.75,
    `${projectId} navigation popup expanded to ${navigationPopup.width}px`,
  );
  assert(
    navigationPopup.left >= 0 &&
      navigationPopup.right <= navigationPopup.viewportWidth,
    `${projectId} navigation popup extends outside the viewport`,
  );
  await captureBuiSlots();
  await page.keyboard.press("Escape");

  const tooltipTrigger = page
    .getByRole("button", { name: /^More information:/ })
    .first();
  await tooltipTrigger.focus();
  // Base UI opens focus tooltips for keyboard input, not pointer modality.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  const tooltip = page
    .locator('[data-slot="tooltip-content"]')
    .filter({ hasText: "Components compile to static HTML" });
  await tooltip.waitFor({ state: "visible" });
  assert(
    (await tooltipTrigger.getAttribute("aria-label")).includes(
      (await tooltip.innerText()).trim(),
    ),
    "Tooltip text must also be available in the trigger's accessible name",
  );
  await captureBuiSlots();
  await page.keyboard.press("Escape");

  await page.getByRole("tab", { name: "Yearly", exact: true }).click();
  await page.getByText("$278", { exact: false }).waitFor({ state: "visible" });

  await page.getByRole("button", { name: FIRST_FAQ, exact: true }).click();
  await page
    .getByText("While inspired by shadcn/ui's copy-and-own approach", {
      exact: false,
    })
    .waitFor({ state: "visible" });

  await page.locator("#company-size").click();
  await page
    .getByRole("option", { name: "1–10 employees", exact: true })
    .waitFor({ state: "visible" });
  await captureBuiSlots();
  await page
    .getByRole("option", { name: "1–10 employees", exact: true })
    .click();
  assert(
    (await page.locator("#company-size").innerText()).includes(
      "1–10 employees",
    ),
    "Company size must display its label after selection",
  );
  await page.locator("#interest").click();
  await page.getByRole("option", { name: "Product demo", exact: true }).click();
  assert(
    (await page.locator("#interest").innerText()).includes("Product demo"),
    "Interest must display its label after selection",
  );

  await page.getByRole("button", { name: "React", exact: true }).hover();
  await page
    .getByText("A JavaScript library for building user interfaces", {
      exact: false,
    })
    .waitFor({ state: "visible" });

  await captureBuiSlots();

  const checkbox = page.getByRole("checkbox", {
    name: "Send me product updates and tips",
  });
  const before =
    (await checkbox.getAttribute("aria-checked")) ??
    (await checkbox.isChecked());
  await checkbox.click();
  const after =
    (await checkbox.getAttribute("aria-checked")) ??
    (await checkbox.isChecked());
  assert(before !== after, "Newsletter checkbox did not change state");

  return { navigationPopup, observedBuiSlots: [...observedBuiSlots].sort() };
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

assert(
  new Set(styleSources).size === 1,
  "The benchmark variants do not share the same global styles",
);

try {
  for (const project of projects) {
    console.log(`Verifying ${project.name}`);
    const context = await browser.newContext({
      locale: "en-US",
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
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
      htmlBytes: new TextEncoder().encode(document.documentElement.outerHTML)
        .byteLength,
      navLabel: document.querySelector("nav")?.getAttribute("aria-label"),
      tooltipTriggers: [
        ...document.querySelectorAll('[data-slot="tooltip-trigger"]'),
      ].map((element) => ({
        tag: element.tagName,
        name: element.getAttribute("aria-label"),
        tabIndex: element.tabIndex,
      })),
      nestedInteractiveControls: document.querySelectorAll(
        "button a, a button, button button, a a",
      ).length,
      buiSlots: [
        ...new Set(
          [...document.querySelectorAll("[data-slot]")]
            .map((element) => element.getAttribute("data-slot"))
            .filter(Boolean),
        ),
      ].sort(),
      scriptRequests: performance
        .getEntriesByType("resource")
        .filter((entry) => /\.js(?:$|\?)/.test(entry.name))
        .map((entry) => new URL(entry.name).pathname)
        .sort(),
      fontRequests: performance
        .getEntriesByType("resource")
        .filter((entry) => /\.(?:woff2?|ttf)(?:$|\?)/.test(entry.name))
        .map((entry) => new URL(entry.name).pathname)
        .sort(),
    }));

    const interactionChecks = await verifyInteractions(page, project.id);

    assert(
      accessibility.length === 0,
      `${project.name} has ${accessibility.length} axe violations`,
    );
    assert(
      browserErrors.length === 0,
      `${project.name} logged browser errors: ${browserErrors.join("; ")}`,
    );
    assert(
      pageData.navLabel === "Main",
      `${project.name} navigation is missing its accessible name`,
    );
    assert(
      pageData.tooltipTriggers.length === 6,
      `${project.name} does not expose six tooltip triggers`,
    );
    assert(
      pageData.tooltipTriggers.every(
        (trigger) =>
          trigger.tag === "BUTTON" &&
          trigger.tabIndex === 0 &&
          trigger.name?.startsWith("More information:"),
      ),
      `${project.name} has a non-keyboard-accessible tooltip trigger`,
    );
    assert(
      pageData.nestedInteractiveControls === 0,
      `${project.name} contains nested interactive controls`,
    );
    if (project.id === "astro-bui") {
      const observedSlots = new Set([
        ...pageData.buiSlots,
        ...interactionChecks.observedBuiSlots,
      ]);
      const missingSlots = REQUIRED_BUI_SLOTS.filter(
        (slot) => !observedSlots.has(slot),
      );
      assert(
        missingSlots.length === 0,
        `${project.name} is missing current b/ui anatomy: ${missingSlots.join(", ")}`,
      );
    }
    assert(
      pageData.fontRequests.length === 1,
      `${project.name} did not load exactly one font subset`,
    );
    assert(
      JSON.stringify(pageData.scriptRequests) ===
        JSON.stringify(expectedScripts.get(project.id)),
      `${project.name} browser requests do not match results/assets.json`,
    );

    qualityProjects.push({
      id: project.id,
      name: project.name,
      textHash: createHash("sha256")
        .update(pageData.normalizedText)
        .digest("hex"),
      domElements: pageData.domElements,
      hydratedHtmlBytes: pageData.htmlBytes,
      scriptRequests: pageData.scriptRequests,
      fontRequests: pageData.fontRequests,
      accessibilityViolations: accessibility,
      browserErrors,
      navigationPopup: interactionChecks.navigationPopup,
    });

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
    versions: readProjectVersions(),
    styles: readProjectStyles(),
    node: process.version,
    browser: browserVersion,
    viewport: { width: 1280, height: 800 },
  },
  checks: [
    "matching installed Astro versions and matching React / React DOM versions",
    "identical normalized visible text",
    "identical shadcn base-nova source and pinned Base UI 1.8.0 in both React demos",
    "Nova preset in all three demos (bejamas-nova and base-nova)",
    "both selects display option labels after selection",
    "identical global style source and one local Geist font subset",
    "six keyboard-focusable tooltip triggers",
    "functional navigation, tooltip, tabs, hover card, accordion, selects, and checkbox",
    "current b/ui anatomy and bounded navigation popup geometry",
    "zero nested interactive controls",
    "zero axe-core violations",
    "zero browser errors",
    "browser JavaScript requests match the route asset report",
  ],
  projects: qualityProjects,
};
const outputPath = join(resultsDir, "quality.json");
writeFileSync(outputPath, `${JSON.stringify(qualityReport, null, 2)}\n`);
console.log(`Wrote ${relative(benchmarkRoot, outputPath)}`);
