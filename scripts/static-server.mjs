import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

import { projects } from "./benchmark-config.mjs";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const COMPRESSIBLE_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".svg"]);

function resolveRequest(buildDir, pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const filePath = resolve(buildDir, `.${requested}`);
  const relativePath = relative(buildDir, filePath);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    return null;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) return filePath;
  return null;
}

export async function startStaticServer({ project: defaultProject = null, port = 0 } = {}) {
  const projectsByHost = new Map(
    projects.map((project) => [`${project.id}.localhost`, project]),
  );

  const server = createServer((request, response) => {
    const hostname = (request.headers.host ?? "").split(":", 1)[0];
    const project = projectsByHost.get(hostname) ?? defaultProject;
    if (!project) {
      response.writeHead(404).end("Unknown benchmark host");
      return;
    }

    const url = new URL(request.url ?? "/", `http://${hostname}`);
    const filePath = resolveRequest(project.buildDir, url.pathname);
    if (!filePath) {
      response.writeHead(404).end("Not found");
      return;
    }

    const extension = extname(filePath).toLowerCase();
    const acceptsGzip = /(?:^|,)\s*gzip\s*(?:,|$)/i.test(request.headers["accept-encoding"] ?? "");
    const content = readFileSync(filePath);
    const body = acceptsGzip && COMPRESSIBLE_EXTENSIONS.has(extension)
      ? gzipSync(content, { level: 9 })
      : content;
    const headers = {
      "Cache-Control": "no-store",
      "Content-Length": body.byteLength,
      "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
      "Vary": "Accept-Encoding",
    };
    if (body !== content) headers["Content-Encoding"] = "gzip";

    response.writeHead(200, headers);
    response.end(body);
  });

  await new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolvePromise);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not determine server port");

  return {
    port: address.port,
    urls: Object.fromEntries(
      (defaultProject ? [defaultProject] : projects).map((project) => [
        project.id,
        `http://${defaultProject ? "localhost" : `${project.id}.localhost`}:${address.port}/`,
      ]),
    ),
    close: () => new Promise((resolvePromise, reject) =>
      server.close((error) => error ? reject(error) : resolvePromise()),
    ),
  };
}
