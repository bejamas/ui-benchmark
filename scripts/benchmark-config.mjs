import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

export const benchmarkRoot = rootDir;
export const resultsDir = join(rootDir, "results");

export const projects = [
  {
    id: "astro-bui",
    name: "Astro + b/ui",
    buildDir: join(rootDir, "astro-bui", "dist"),
    routeFile: "index.html",
  },
  {
    id: "astro-react-shadcn",
    name: "Astro + React + shadcn (Base UI)",
    buildDir: join(rootDir, "astro-react-shadcn", "dist"),
    routeFile: "index.html",
  },
  {
    id: "nextjs-shadcn",
    name: "Next.js + shadcn (Base UI)",
    buildDir: join(rootDir, "nextjs-shadcn", "out"),
    routeFile: "index.html",
  },
];

export function readProjectStyles() {
  return Object.fromEntries(projects.map(({ id }) => [
    id, JSON.parse(readFileSync(join(rootDir, id, "components.json"), "utf8")).style,
  ]));
}

// Record installed versions, rather than package.json ranges, with each result.
export function readProjectVersions() {
  const names = ["astro", "@astrojs/react", "next", "react", "react-dom", "@base-ui/react", "tailwindcss", "bejamas"];
  return Object.fromEntries(projects.map(({ id }) => {
    const directory = join(rootDir, id);
    const pkg = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
    const declared = { ...pkg.dependencies, ...pkg.devDependencies };
    const measuredNames = [...names.filter(name => name in declared), ...Object.keys(declared).filter(name => name.startsWith("@data-slot/"))];
    if (measuredNames.some(name => name.startsWith("@data-slot/"))) measuredNames.push("@data-slot/core");
    return [id, Object.fromEntries([...new Set(measuredNames)].map(name => [
      name, JSON.parse(readFileSync(join(directory, "node_modules", name, "package.json"), "utf8")).version,
    ]))];
  }));
}
