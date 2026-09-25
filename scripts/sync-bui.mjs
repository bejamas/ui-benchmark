#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile, readdir, writeFile } from "node:fs/promises";

import { benchmarkRoot } from "./benchmark-config.mjs";

const BEJAMAS_CLI_VERSION = "0.4.1";
const BEJAMAS_UI_COMMIT = "82f54f403a7e163d777436fd23e9a1fe2f7d8af5";
const DATA_SLOT_VERSION = "1.0.0";
const components = [
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
const dataSlotPackages = [
  "accordion",
  "hover-card",
  "navigation-menu",
  "select",
  "tabs",
  "tooltip",
];
const astroBuiUrl = new URL("../astro-bui/", import.meta.url);
const astroReactUrl = new URL("../astro-react-shadcn/", import.meta.url);
const nextjsUrl = new URL("../nextjs-shadcn/", import.meta.url);
const packageJsonUrls = [astroBuiUrl, astroReactUrl, nextjsUrl].map(
  (projectUrl) => new URL("package.json", projectUrl),
);
const globalStyleUrls = [
  new URL("src/styles/globals.css", astroBuiUrl),
  new URL("src/styles/globals.css", astroReactUrl),
  new URL("src/app/globals.css", nextjsUrl),
];
const registryUrl = `https://raw.githubusercontent.com/bejamas/ui/${BEJAMAS_UI_COMMIT}/apps/web/public/r`;
const selectControllerUrl = `https://raw.githubusercontent.com/bejamas/ui/${BEJAMAS_UI_COMMIT}/packages/registry/src/lib/select.ts`;

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function run({ command, args, cwd = astroBuiUrl, env = process.env }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `b/ui sync failed (${signal ?? `exit ${code}`})`,
        ),
      );
    });
  });
}

await run({
  command: process.platform === "win32" ? "npx.cmd" : "npx",
  args: [
    "--yes",
    `bejamas@${BEJAMAS_CLI_VERSION}`,
    "add",
    ...components,
    "--overwrite",
    "--yes",
  ],
  env: { ...process.env, REGISTRY_URL: registryUrl },
});

const selectControllerResponse = await fetch(selectControllerUrl);
if (!selectControllerResponse.ok) {
  throw new Error(
    `Could not fetch the b/ui Select controller (${selectControllerResponse.status}).`,
  );
}

const selectController = await selectControllerResponse.text();
if (!selectController.includes('from "@data-slot/select"')) {
  throw new Error("The pinned b/ui Select controller has an unexpected shape.");
}
await writeFile(new URL("src/lib/select.ts", astroBuiUrl), `${selectController.trimEnd()}\n`);

const uiUrl = new URL("src/ui/", astroBuiUrl);
for (const relativePath of await readdir(uiUrl, { recursive: true })) {
  if (!relativePath.endsWith(".astro") && !relativePath.endsWith(".ts")) {
    continue;
  }

  const componentUrl = new URL(relativePath, uiUrl);
  const source = await readFile(componentUrl, "utf8");
  const normalized = source.replace(/[ \t]+$/gm, "");
  if (normalized !== source) {
    await writeFile(componentUrl, normalized);
  }
}

const packageJsons = [];
for (const packageJsonUrl of packageJsonUrls) {
  const packageJson = JSON.parse(await readFile(packageJsonUrl, "utf8"));
  if (!isRecord(packageJson) || !isRecord(packageJson.dependencies)) {
    throw new Error(
      `${packageJsonUrl.pathname} does not contain a dependencies object.`,
    );
  }
  packageJsons.push(packageJson);
}

const [astroBuiPackageJson] = packageJsons;
for (const packageName of dataSlotPackages) {
  astroBuiPackageJson.dependencies[`@data-slot/${packageName}`] =
    DATA_SLOT_VERSION;
}
delete astroBuiPackageJson.dependencies["@lucide/astro"];
if (isRecord(astroBuiPackageJson.devDependencies)) {
  delete astroBuiPackageJson.devDependencies.shadcn;
}

for (const packageJson of packageJsons) {
  packageJson.dependencies.bejamas = BEJAMAS_CLI_VERSION;
}

for (let index = 0; index < packageJsons.length; index += 1) {
  await writeFile(
    packageJsonUrls[index],
    `${JSON.stringify(packageJsons[index], null, 2)}\n`,
  );
}

const bejamasCssImport = '@import "bejamas/tailwind.css";';
for (const styleUrl of globalStyleUrls) {
  const source = await readFile(styleUrl, "utf8");
  if (source.includes(bejamasCssImport)) {
    continue;
  }

  const importAnchor = '@import "tw-animate-css";';
  if (!source.includes(importAnchor)) {
    throw new Error(`${styleUrl.pathname} is missing the shared CSS import anchor.`);
  }
  await writeFile(
    styleUrl,
    source.replace(importAnchor, `${importAnchor}\n${bejamasCssImport}`),
  );
}

await run({ command: "bun", args: ["install"] });
for (const projectUrl of [astroReactUrl, nextjsUrl]) {
  await run({
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["install", "--ignore-scripts"],
    cwd: projectUrl,
  });
}

console.log(
  `Synced ${components.length} b/ui component families from bejamas/ui@${BEJAMAS_UI_COMMIT}.`,
);
console.log(`Pinned data-slot packages to ${DATA_SLOT_VERSION}.`);
console.log(`Workspace: ${benchmarkRoot}`);
