import { dirname, join } from "node:path";
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
    name: "Astro + React + shadcn",
    buildDir: join(rootDir, "astro-react-shadcn", "dist"),
    routeFile: "index.html",
  },
  {
    id: "nextjs-shadcn",
    name: "Next.js + shadcn",
    buildDir: join(rootDir, "nextjs-shadcn", "out"),
    routeFile: "index.html",
  },
];
