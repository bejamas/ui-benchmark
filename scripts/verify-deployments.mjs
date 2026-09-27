#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

import { projects } from "./benchmark-config.mjs";

// Compare live responses, including imported chunks, fonts, and Next.js RSC
// payloads, with the local build. A successful upload alone does not prove parity.
const assetExtensions = new Set([
  ".js", ".mjs", ".css", ".txt", ".woff", ".woff2", ".ttf", ".otf",
  ".svg", ".ico", ".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif",
]);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function assetPaths(directory, prefix = "") {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      paths.push(...await assetPaths(join(directory, entry.name), `${path}/`));
    } else if (entry.isFile() && assetExtensions.has(extname(entry.name))) {
      paths.push(path);
    }
  }
  return paths.sort();
}

for (const project of projects) {
  const origin = `https://${project.id}.bejamas-oss.workers.dev`;
  try {
    const files = [project.routeFile, ...await assetPaths(project.buildDir)];
    for (const file of files) {
      const path = file === project.routeFile ? "/" : `/${file}`;
      const response = await fetch(new URL(path, origin), {
        headers: { "Cache-Control": "no-cache" },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      const actual = hash(Buffer.from(await response.arrayBuffer()));
      const expected = hash(await readFile(join(project.buildDir, file)));
      if (actual !== expected) {
        throw new Error(`${path}: SHA-256 differs (live ${actual}, local ${expected})`);
      }
    }
    console.log(`${project.id}: ${files.length} live files match the local build`);
  } catch (error) {
    console.error(`${project.id}: ${error.message}`);
    process.exitCode = 1;
  }
}
