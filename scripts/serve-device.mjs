#!/usr/bin/env node
import { projects } from "./benchmark-config.mjs";
import { startStaticServer } from "./static-server.mjs";

const servers = [];
async function close() {
  await Promise.all(servers.map((server) => server.close()));
}
try {
  for (const [index, project] of projects.entries()) {
    const server = await startStaticServer({ project, port: 4173 + index });
    servers.push(server);
    console.log(`${project.name}: ${server.urls[project.id]}`);
  }
  console.log("Reverse device ports 4173, 4174, and 4175 with adb. Stop with Ctrl+C.");
  process.once("SIGINT", close);
  process.once("SIGTERM", close);
} catch (error) {
  await close();
  throw error;
}
