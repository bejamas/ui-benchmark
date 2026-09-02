# Next.js + shadcn benchmark

This project implements the shared benchmark page as a Next.js static export. The page is a Server Component, and the interactive shadcn components define the Client Component boundaries. The project loads the local Geist variable font from `@fontsource-variable/geist`.

See the [benchmark README](../README.md) for the methodology and results.

## Requirements

- Node.js 24.16.0
- npm 11.13.0

## Commands

Run these commands from this directory.

| Command | Result |
|---|---|
| `npm ci` | Install the locked dependencies |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the static export in `out` |
| `npm run start` | Serve the static export locally with Wrangler |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Build and deploy the site with Wrangler |

## Cloudflare deployment

[`wrangler.jsonc`](wrangler.jsonc) deploys `out` as Worker static assets in the Bejamas OSS account.

Production: [nextjs-shadcn.bejamas-oss.workers.dev](https://nextjs-shadcn.bejamas-oss.workers.dev)
