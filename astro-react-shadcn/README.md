# Astro + React + shadcn benchmark

This project implements the shared benchmark page with static Astro markup and explicit React islands for the interactive shadcn components. See the [benchmark README](../README.md) for the methodology and results.

## Requirements

- Node.js 24.16.0
- npm 11.13.0

## Commands

Run these commands from this directory.

| Command | Result |
|---|---|
| `npm ci` | Install the locked dependencies |
| `npm run dev` | Start the Astro development server |
| `npm run build` | Build the static site in `dist` |
| `npm run preview` | Preview the production build locally |
| `npm run deploy` | Build and deploy the site with Wrangler |

## Cloudflare deployment

[`wrangler.jsonc`](wrangler.jsonc) deploys `dist` as Worker static assets in the Bejamas OSS account.

Production: [astro-react-shadcn.bejamas-oss.workers.dev](https://astro-react-shadcn.bejamas-oss.workers.dev)
