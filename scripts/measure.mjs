#!/usr/bin/env node

/**
 * Benchmark measurement script
 * Compares JS output size between Astro + b/ui, Astro + React + shadcn, and Next.js + shadcn
 *
 * Usage: node benchmarks/scripts/measure.mjs
 */

import { readdirSync, statSync } from "fs";
import { join } from "path";
import { createReadStream } from "fs";
import { createGzip } from "zlib";

const ASTRO_BUI_DIST = join(import.meta.dirname, "..", "astro-bui", "dist");
const ASTRO_REACT_DIST = join(import.meta.dirname, "..", "astro-react-shadcn", "dist");
const NEXTJS_DIST = join(import.meta.dirname, "..", "nextjs-shadcn", ".next", "static");

function walkDir(dir, ext = ".js") {
  let results = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(walkDir(fullPath, ext));
      } else if (entry.name.endsWith(ext)) {
        const stats = statSync(fullPath);
        results.push({
          path: fullPath,
          name: entry.name,
          sizeBytes: stats.size,
        });
      }
    }
  } catch {
    // dir may not exist
  }
  return results;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}

async function getGzipSize(filePath) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const gzip = createGzip();
    const stream = createReadStream(filePath);
    stream.pipe(gzip);
    gzip.on("data", (chunk) => (size += chunk.length));
    gzip.on("end", () => resolve(size));
    gzip.on("error", reject);
  });
}

async function measureProject(name, distDir) {
  const jsFiles = walkDir(distDir, ".js");

  let totalRaw = 0;
  let totalGzip = 0;
  const files = [];

  for (const file of jsFiles) {
    const gzipSize = await getGzipSize(file.path);
    totalRaw += file.sizeBytes;
    totalGzip += gzipSize;
    files.push({
      name: file.name,
      raw: file.sizeBytes,
      gzip: gzipSize,
    });
  }

  // Sort by gzip size descending
  files.sort((a, b) => b.gzip - a.gzip);

  return {
    name,
    totalRaw,
    totalGzip,
    fileCount: jsFiles.length,
    files,
  };
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════════════");
  console.log("  JS Bundle Size Benchmark: 3-Way Comparison");
  console.log("═══════════════════════════════════════════════════════════════════════\n");

  const astroBui = await measureProject("Astro + b/ui", ASTRO_BUI_DIST);
  const astroReact = await measureProject("Astro + React + shadcn", ASTRO_REACT_DIST);
  const nextjs = await measureProject("Next.js + shadcn", NEXTJS_DIST);

  // Summary table
  console.log("┌─────────────────────────┬──────────────┬──────────────┬────────┐");
  console.log("│ Project                 │ Raw JS Size  │ Gzipped Size │ Files  │");
  console.log("├─────────────────────────┼──────────────┼──────────────┼────────┤");
  for (const p of [astroBui, astroReact, nextjs]) {
    console.log(
      `│ ${p.name.padEnd(23)} │ ${formatBytes(p.totalRaw).padStart(12)} │ ${formatBytes(p.totalGzip).padStart(12)} │ ${String(p.fileCount).padStart(6)} │`
    );
  }
  console.log("├─────────────────────────┼──────────────┼──────────────┼────────┤");

  const ratioAR = astroReact.totalGzip / astroBui.totalGzip;
  const ratioNJ = nextjs.totalGzip / astroBui.totalGzip;
  console.log(
    `│ ${"Ratio vs Astro+b/ui".padEnd(23)} │              │              │        │`
  );
  console.log(
    `│ ${"  Astro+React+shadcn".padEnd(23)} │ ${((astroReact.totalRaw / astroBui.totalRaw).toFixed(1) + "x").padStart(12)} │ ${(ratioAR.toFixed(1) + "x").padStart(12)} │        │`
  );
  console.log(
    `│ ${"  Next.js+shadcn".padEnd(23)} │ ${((nextjs.totalRaw / astroBui.totalRaw).toFixed(1) + "x").padStart(12)} │ ${(ratioNJ.toFixed(1) + "x").padStart(12)} │        │`
  );
  console.log("└─────────────────────────┴──────────────┴──────────────┴────────┘");

  // Detail sections
  for (const project of [astroBui, astroReact, nextjs]) {
    const limit = 15;
    const filesToShow = project.files.slice(0, limit);
    console.log(`\n── ${project.name} JS files (${project.fileCount > limit ? `top ${limit} of ` : ''}${project.fileCount}) ──`);
    for (const f of filesToShow) {
      console.log(
        `  ${f.name.padEnd(55)} ${formatBytes(f.raw).padStart(12)}  →  ${formatBytes(f.gzip).padStart(10)} gzip`
      );
    }
    if (project.files.length > limit) {
      console.log(`  ... and ${project.files.length - limit} more files`);
    }
    console.log(
      `  ${"TOTAL".padEnd(55)} ${formatBytes(project.totalRaw).padStart(12)}  →  ${formatBytes(project.totalGzip).padStart(10)} gzip`
    );
  }

  console.log("\n═══════════════════════════════════════════════════════════════════════");
  console.log("  Key takeaways:");
  console.log("  • Astro + b/ui ships ONLY component-specific JS via data-slot primitives");
  console.log("  • Astro + React + shadcn removes Next.js overhead but keeps React + Radix");
  console.log("  • Next.js + shadcn includes React runtime, router, and framework code");
  console.log("═══════════════════════════════════════════════════════════════════════\n");
}

main().catch(console.error);
