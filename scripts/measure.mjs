#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import {
  brotliCompressSync,
  constants as zlibConstants,
  gzipSync,
} from "node:zlib";

import {
  benchmarkRoot,
  projects,
  resultsDir,
} from "./benchmark-config.mjs";

const JS_EXTENSION = /\.m?js$/i;
const FONT_EXTENSION = /\.(?:woff2?|ttf|otf)$/i;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KiB`;
}

function stripUrlSuffix(value) {
  return value.split(/[?#]/, 1)[0];
}

function isRemoteUrl(value) {
  return /^(?:data:|https?:|\/\/)/i.test(value);
}

function resolveAsset(buildDir, value, referrer = buildDir) {
  const cleanValue = stripUrlSuffix(value.trim());
  if (!cleanValue || isRemoteUrl(cleanValue)) return null;

  const filePath = cleanValue.startsWith("/")
    ? resolve(buildDir, `.${cleanValue}`)
    : resolve(dirname(referrer), cleanValue);
  const relativePath = relative(buildDir, filePath);

  if (
    relativePath.startsWith(`..${sep}`) ||
    relativePath === ".." ||
    isAbsolute(relativePath) ||
    !existsSync(filePath)
  ) {
    return null;
  }

  return filePath;
}

function parseAttributes(tag) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

  for (const match of tag.matchAll(pattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? "");
  }

  return attributes;
}

function collectHtmlAssets(html, buildDir, htmlPath) {
  const scripts = [];
  const stylesheets = [];

  for (const match of html.matchAll(/<script\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const source = attributes.get("src");
    if (!source || attributes.has("nomodule")) continue;

    const filePath = resolveAsset(buildDir, source, htmlPath);
    if (filePath) {
      scripts.push({
        filePath,
        isModule: attributes.get("type") === "module",
      });
    }
  }

  // Astro serializes island entry points as attributes rather than script tags.
  for (const match of html.matchAll(/(?:component-url|renderer-url)=["']([^"']+\.m?js(?:[?#][^"']*)?)["']/gi)) {
    const filePath = resolveAsset(buildDir, match[1], htmlPath);
    if (filePath) scripts.push({ filePath, isModule: true });
  }

  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    const relations = (attributes.get("rel") ?? "").toLowerCase().split(/\s+/);
    const href = attributes.get("href");
    if (!href || !relations.includes("stylesheet")) continue;

    const filePath = resolveAsset(buildDir, href, htmlPath);
    if (filePath) stylesheets.push(filePath);
  }

  return { scripts, stylesheets };
}

function parseModuleImports(source) {
  const imports = new Set();
  const pattern = /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["']([^"']+)["']/g;

  for (const match of source.matchAll(pattern)) {
    if (JS_EXTENSION.test(stripUrlSuffix(match[1]))) imports.add(match[1]);
  }

  return imports;
}

function collectJavaScript(buildDir, seeds) {
  const queue = [...seeds];
  const files = new Set();

  while (queue.length > 0) {
    const { filePath, isModule } = queue.shift();
    if (files.has(filePath)) continue;
    files.add(filePath);

    if (!isModule) continue;

    const source = readFileSync(filePath, "utf8");
    for (const importPath of parseModuleImports(source)) {
      const dependency = resolveAsset(buildDir, importPath, filePath);
      if (dependency) queue.push({ filePath: dependency, isModule: true });
    }
  }

  return [...files].sort();
}

function extractVisibleText(html) {
  const withoutNonContent = html
    .replace(/<(?:script|style|template)\b[^>]*>[\s\S]*?<\/(?:script|style|template)>/gi, " ")
    .replace(/<!--?[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ");

  return withoutNonContent.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, value) => {
    if (value[0] === "#") {
      const radix = value[1].toLowerCase() === "x" ? 16 : 10;
      const digits = radix === 16 ? value.slice(2) : value.slice(1);
      return String.fromCodePoint(Number.parseInt(digits, radix));
    }

    return {
      amp: "&",
      apos: "'",
      copy: "©",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: '"',
    }[value.toLowerCase()] ?? " ";
  });
}

function parseUnicodeRange(value) {
  return value.split(",").flatMap((part) => {
    const normalized = part.trim().replace(/^u\+/i, "");
    if (!normalized) return [];

    if (normalized.includes("?")) {
      return [[
        Number.parseInt(normalized.replaceAll("?", "0"), 16),
        Number.parseInt(normalized.replaceAll("?", "f"), 16),
      ]];
    }

    const [start, end = start] = normalized.split("-");
    return [[Number.parseInt(start, 16), Number.parseInt(end, 16)]];
  });
}

function fontFaceMatchesText(block, codePoints) {
  const range = block.match(/unicode-range\s*:\s*([^;}]+)/i)?.[1];
  if (!range) return true;

  const ranges = parseUnicodeRange(range);
  return codePoints.some((codePoint) =>
    ranges.some(([start, end]) => codePoint >= start && codePoint <= end),
  );
}

function collectFonts(buildDir, stylesheets, html) {
  const fonts = new Set();
  const codePoints = [...new Set([...extractVisibleText(html)].map((character) => character.codePointAt(0)))];

  for (const stylesheet of stylesheets) {
    const css = readFileSync(stylesheet, "utf8");
    for (const face of css.matchAll(/@font-face\s*{([^}]*)}/gi)) {
      if (!fontFaceMatchesText(face[1], codePoints)) continue;

      const url = face[1].match(/url\(\s*["']?([^"')]+)["']?\s*\)/i)?.[1];
      if (!url) continue;

      const value = stripUrlSuffix(url);
      if (!FONT_EXTENSION.test(value)) continue;

      const fontPath = resolveAsset(buildDir, value, stylesheet);
      if (fontPath) fonts.add(fontPath);
    }
  }

  return [...fonts].sort();
}

function compressFile(filePath) {
  const content = readFileSync(filePath);
  return {
    raw: content.byteLength,
    gzip: gzipSync(content, { level: 9 }).byteLength,
    brotli: brotliCompressSync(content, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).byteLength,
  };
}

function summarizeFiles(files, buildDir, compress = true) {
  const entries = files.map((filePath) => {
    const sizes = compress
      ? compressFile(filePath)
      : {
          raw: statSync(filePath).size,
          gzip: null,
          brotli: null,
        };

    return {
      path: relative(buildDir, filePath).split(sep).join("/"),
      ...sizes,
    };
  });

  return {
    files: entries,
    fileCount: entries.length,
    raw: entries.reduce((total, entry) => total + entry.raw, 0),
    gzip: compress
      ? entries.reduce((total, entry) => total + entry.gzip, 0)
      : null,
    brotli: compress
      ? entries.reduce((total, entry) => total + entry.brotli, 0)
      : null,
  };
}

function measureProject(project) {
  const htmlPath = join(project.buildDir, project.routeFile);
  if (!existsSync(htmlPath)) {
    throw new Error(`Missing build output for ${project.name}: ${relative(benchmarkRoot, htmlPath)}`);
  }

  const html = readFileSync(htmlPath, "utf8");
  const discovered = collectHtmlAssets(html, project.buildDir, htmlPath);
  const javaScript = collectJavaScript(project.buildDir, discovered.scripts);
  const stylesheets = [...new Set(discovered.stylesheets)].sort();
  const fonts = collectFonts(project.buildDir, stylesheets, html);

  const categories = {
    html: summarizeFiles([htmlPath], project.buildDir),
    javascript: summarizeFiles(javaScript, project.buildDir),
    css: summarizeFiles(stylesheets, project.buildDir),
    fonts: summarizeFiles(fonts, project.buildDir, false),
  };

  const compressible = [categories.html, categories.javascript, categories.css];
  const total = {
    fileCount: Object.values(categories).reduce((sum, category) => sum + category.fileCount, 0),
    raw: Object.values(categories).reduce((sum, category) => sum + category.raw, 0),
    gzip: compressible.reduce((sum, category) => sum + category.gzip, categories.fonts.raw),
    brotli: compressible.reduce((sum, category) => sum + category.brotli, categories.fonts.raw),
  };

  return {
    id: project.id,
    name: project.name,
    route: "/",
    categories,
    total,
  };
}

function printTable(results) {
  const headings = ["Project", "Route JS raw", "Route JS gzip", "Route JS br", "JS files"];
  const rows = results.map((result) => [
    result.name,
    formatBytes(result.categories.javascript.raw),
    formatBytes(result.categories.javascript.gzip),
    formatBytes(result.categories.javascript.brotli),
    String(result.categories.javascript.fileCount),
  ]);
  const widths = headings.map((heading, index) =>
    Math.max(heading.length, ...rows.map((row) => row[index].length)),
  );
  const render = (row) => row.map((cell, index) => cell.padEnd(widths[index])).join("  ");

  console.log(render(headings));
  console.log(widths.map((width) => "-".repeat(width)).join("  "));
  for (const row of rows) console.log(render(row));

  console.log("\nMeasured route assets (HTML + CSS + JS + fonts):");
  for (const result of results) {
    console.log(
      `- ${result.name}: ${formatBytes(result.total.raw)} raw, ${formatBytes(result.total.gzip)} gzip estimate, ${formatBytes(result.total.brotli)} Brotli estimate`,
    );
  }
}

const measuredAt = new Date().toISOString();
const measuredProjects = projects.map(measureProject);
const report = {
  schemaVersion: 1,
  measuredAt,
  environment: {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
  },
  methodology: {
    route: "/",
    scope: "HTML, stylesheets, font subsets needed by the route text, modern script tags, and recursively imported ES modules",
    compression: "Each compressible response is compressed independently with gzip level 9 and Brotli quality 11; font files use their encoded size.",
    exclusions: [
      "nomodule fallback scripts",
      "unreferenced build artifacts",
      "HTTP headers and transport overhead",
    ],
  },
  projects: measuredProjects,
};

mkdirSync(resultsDir, { recursive: true });
const outputPath = join(resultsDir, "assets.json");
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

printTable(measuredProjects);
console.log(`\nWrote ${relative(benchmarkRoot, outputPath)}`);
