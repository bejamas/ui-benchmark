# Benchmark: Astro + b/ui vs Next.js + shadcn/ui

A controlled comparison of JavaScript footprint and performance between two
identical marketing pages built with different component libraries.

## The Two Projects

| | **Astro + b/ui** | **Next.js + shadcn** |
|---|---|---|
| Framework | Astro 5 | Next.js 16 |
| Components | b/ui (data-slot) | shadcn/ui (Radix) |
| Styling | Tailwind CSS v4 | Tailwind CSS v4 |
| Rendering | Static HTML | Static (SSG) |
| Package Manager | Bun | npm |

## The Page

Both projects render the **exact same marketing onepager** with these interactive sections:

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

| Project | Raw JS | Gzipped JS | Files | Ratio |
|---|---|---|---|---|
| **Astro + b/ui** | **58.59 KB** | **22.25 KB** | 7 | 1x |
| Next.js + shadcn | 1,846.50 KB | 530.16 KB | 60 | **23.8x** |

### Astro JS Breakdown (by component)

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

## How to Reproduce

### Prerequisites

- Node.js 18+
- Bun 1.2+ (for Astro project)
- npm (for Next.js project)

### Build & Measure

```bash
# 1. Install dependencies
cd benchmarks/astro-bui && bun install
cd benchmarks/nextjs-shadcn && npm install

# 2. Build both projects
cd benchmarks/astro-bui && bun run build
cd benchmarks/nextjs-shadcn && npm run build

# 3. Run the measurement script
node benchmarks/scripts/measure.mjs
```

### Run Dev Servers

```bash
# Astro (port 4321)
cd benchmarks/astro-bui && bun run dev

# Next.js (port 3000)
cd benchmarks/nextjs-shadcn && npm run dev
```

### Manual Performance Testing

1. **Lighthouse**: Run Lighthouse in Chrome DevTools on each `preview` server
2. **INP**: Chrome DevTools → Performance tab → Record → Interact with nav, tabs, accordion, form
3. **Network tab**: Compare JavaScript transfer size in waterfall

## Why This Matters

Marketing sites are content-first. They have long text, forms, tooltips, and
navigation — but they rarely need complex client-side state.

In Next.js + shadcn, **every text node on the page must hydrate** even though
it never changes. The React runtime, Radix primitives, and reconciliation engine
are all loaded for what is essentially a static page with a few interactive
widgets.

In Astro + b/ui, only the interactive components ship JavaScript. Everything
else is pure HTML. The `data-slot` primitives provide the same UX (keyboard nav,
focus management, ARIA) at a fraction of the cost.

## Methodology Notes

- Both projects are built in **static/SSG mode** (no server rendering)
- Next.js uses Turbopack for the production build
- The measurement script counts **all `.js` files** in the build output
- Gzip sizes are computed programmatically, not from CDN headers
- Both projects use the same Tailwind CSS v4 design tokens
