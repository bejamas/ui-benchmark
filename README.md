# Benchmark: Astro + b/ui vs Next.js + shadcn/ui

A controlled comparison of JavaScript footprint and performance between three
identical marketing pages built with different component libraries.

## The Three Projects

| | **Astro + b/ui** | **Astro + React + shadcn** | **Next.js + shadcn** |
|---|---|---|---|
| Framework | Astro 5 | Astro 5 + React | Next.js 16 |
| Components | b/ui (data-slot) | shadcn/ui (Radix) | shadcn/ui (Radix) |
| Styling | Tailwind CSS v4 | Tailwind CSS v4 | Tailwind CSS v4 |
| Rendering | Static HTML | React island (`client:load`) | Static (SSG) |
| Package Manager | Bun | npm | npm |

## The Page

All three projects render the **exact same marketing onepager** with these interactive sections:

- **Header** — NavigationMenu with 2 dropdown menus, 4 items each
- **Hero** — Badge + 2 Buttons
- **Features** — 6 Cards, each with a Tooltip
- **Pricing** — Tabs (Monthly/Yearly) switching between 2 pricing grids
- **Long-form text** — 4 paragraphs with 6 inline HoverCards
- **FAQ** — Accordion with 6 collapsible items
- **Contact form** — 2 Selects, 3 Inputs, 1 Checkbox, Labels
- **Footer** — Separator + link columns

## Results

### JS Bundle Size (Production Build)

| Project | Raw JS | Gzipped JS | Files | vs b/ui |
|---|---|---|---|---|
| **Astro + b/ui** | **58.59 KB** | **22.25 KB** | 7 | 1x |
| Astro + React + shadcn | 374.03 KB | 114.47 KB | 3 | **5.1x** |
| Next.js + shadcn | 729.82 KB | 219.19 KB | 10 | **9.8x** |

### Astro + b/ui JS Breakdown (by component)

| Component | Raw | Gzipped |
|---|---|---|
| NavigationMenu | 18.86 KB | 6.72 KB |
| Shared index | 12.28 KB | 4.62 KB |
| Select | 9.24 KB | 3.67 KB |
| HoverCard | 6.15 KB | 2.29 KB |
| Tooltip | 5.09 KB | 1.98 KB |
| Tabs | 4.01 KB | 1.79 KB |
| Accordion | 2.95 KB | 1.17 KB |
| **Total** | **58.59 KB** | **22.25 KB** |

> Note: Button, Card, Badge, Input, Label, Checkbox, and Separator contribute
> **zero JavaScript** — they render as pure HTML + CSS.

### Astro + React + shadcn JS Breakdown

| File | Raw | Gzipped |
|---|---|---|
| React/ReactDOM runtime | 178.42 KB | 56.24 KB |
| MarketingPage + Radix | 183.67 KB | 53.93 KB |
| Astro island runtime | 11.94 KB | 4.30 KB |
| **Total** | **374.03 KB** | **114.47 KB** |

### What the middle version reveals

By running React inside Astro (no Next.js), we isolate two costs:
- **React + Radix alone** = ~114 KB gzip (the minimum for shadcn components)
- **Next.js adds ~105 KB** more (router, RSC, framework utils)
- **b/ui replaces both** with 22 KB of vanilla JS data-slot primitives

## How to Reproduce

### Prerequisites

- Node.js 18+
- Bun 1.2+ (for Astro b/ui project)
- npm (for Next.js and Astro React projects)

### Build & Measure

```bash
# 1. Install dependencies
cd astro-bui && bun install
cd astro-react-shadcn && npm install
cd nextjs-shadcn && npm install

# 2. Build all projects
cd astro-bui && bun run build
cd astro-react-shadcn && npx astro build
cd nextjs-shadcn && npm run build

# 3. Run the measurement script
node scripts/measure.mjs
```

### Preview Production Builds

```bash
# Astro + b/ui (port 4321)
cd astro-bui && bun run preview

# Astro + React + shadcn (port 4322)
cd astro-react-shadcn && npx astro preview --port 4322

# Next.js (port 3000)
cd nextjs-shadcn && npm run start
```

### Manual Performance Testing

1. **Lighthouse**: Run Lighthouse in Chrome DevTools on each preview server
2. **INP**: Chrome DevTools → Performance tab → Record → Interact with nav, tabs, accordion, form
3. **Network tab**: Compare JavaScript transfer size in waterfall
4. **Coverage tab**: Check % of JS actually executed vs loaded

## Why This Matters

Marketing sites are content-first. They have long text, forms, tooltips, and
navigation — but they rarely need complex client-side state.

In Next.js + shadcn, **every text node on the page must hydrate** even though
it never changes. The React runtime, Radix primitives, and reconciliation engine
are all loaded for what is essentially a static page with a few interactive
widgets.

In Astro + React + shadcn, removing Next.js cuts the JS in half — but you still
pay for React + Radix to hydrate the entire component tree.

In Astro + b/ui, only the interactive components ship JavaScript. Everything
else is pure HTML. The `data-slot` primitives provide the same UX (keyboard nav,
focus management, ARIA) at a fraction of the cost.

## Methodology Notes

- All three projects are built in **static/SSG mode** (no server rendering)
- Next.js uses Turbopack for the production build
- The measurement script counts all `.js` files in the build output
- Gzip sizes are computed programmatically, not from CDN headers
- All projects use the same Tailwind CSS v4 design tokens
- Next.js measurement scopes to `.next/static` (client-shipped JS only)
