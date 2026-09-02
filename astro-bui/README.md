# Astro + b/ui benchmark

This project implements the shared benchmark page with Astro components and data-slot behavior. See the [benchmark README](../README.md) for the methodology and results.

## Requirements

- Node.js 24.16.0
- Bun 1.3.14

## Commands

Run these commands from this directory.

| Command | Result |
|---|---|
| `bun install --frozen-lockfile` | Install the locked dependencies |
| `bun run dev` | Start the Astro development server |
| `bun run build` | Build the static site in `dist` |
| `bun run preview` | Preview the production build locally |
| `bun run deploy` | Build and deploy the site with Wrangler |

## Cloudflare deployment

[`wrangler.jsonc`](wrangler.jsonc) deploys `dist` as Worker static assets in the Bejamas OSS account.

Production: [astro-bui.bejamas-oss.workers.dev](https://astro-bui.bejamas-oss.workers.dev)
