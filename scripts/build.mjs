#!/usr/bin/env node

import { spawn } from "node:child_process";

import { benchmarkRoot } from "./benchmark-config.mjs";

const builds = [
  { name: "Astro + b/ui", cwd: "astro-bui", command: "bun", args: ["run", "build"] },
  { name: "Astro + React + shadcn (Base UI)", cwd: "astro-react-shadcn", command: "npm", args: ["run", "build"] },
  { name: "Next.js + shadcn (Base UI)", cwd: "nextjs-shadcn", command: "npm", args: ["run", "build"] },
];

function run({ name, cwd, command, args }) {
  console.log(`\nBuilding ${name}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: new URL(`../${cwd}/`, import.meta.url),
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${name} build failed (${signal ?? `exit ${code}`})`));
    });
  });
}

for (const build of builds) await run(build);
console.log(`\nAll production builds completed from ${benchmarkRoot}`);
