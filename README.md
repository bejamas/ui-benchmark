# Benchmark: Astro + b/ui vs Next.js + shadcn/ui

> Same marketing page. Same components. Three approaches. Radically different JavaScript footprints.

A controlled comparison of JavaScript footprint and performance between three
identical marketing pages built with different component libraries.

---

## TL;DR

| Metric | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn | 
|---|---|---|---|
| **JS bundle (gzipped)** | **22.80 KB** | 119.88 KB | 219.22 KB |
| **JS bundle (raw)** | **60.42 KB** | 358.35 KB | 729.83 KB |
| **JS files** | **7** | 19 | 10 |
| **vs b/ui (gzip)** | **1x** | 5.3x more | 9.6x more |
| **Zero-JS components** | 7 of 13 | 3 of 13 | 0 of 13 |

---

## The Three Projects

| | **Astro + b/ui** | **Astro + React + shadcn** | **Next.js + shadcn** |
|---|---|---|---|
| Framework | Astro 5 | Astro 5 + React | Next.js 16 |
| Components | b/ui (data-slot) | shadcn/ui (Radix) | shadcn/ui (Radix) |
| Styling | Tailwind CSS v4 | Tailwind CSS v4 | Tailwind CSS v4 |
| Rendering | Static HTML | Per-section React islands | Static (SSG) |
| Package Manager | Bun | npm | npm |

The **Astro + React + shadcn** version uses per-section islands — static shadcn components (Button, Card, etc.) are server-rendered to HTML with zero JS, while interactive components (NavigationMenu, Tabs, Accordion, etc.) each hydrate as separate `client:load` islands. This isolates the cost of React + Radix without Next.js overhead.

---

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

### Components used (13 total)

| Component | Interactive? | Astro b/ui JS | Astro React + shadcn JS | Next.js JS |
|---|---|---|---|---|
| NavigationMenu | ✅ | 7.20 KB gzip | Island (5.70 KB) | Bundled in ~219 KB |
| Select (×2) | ✅ | 3.67 KB gzip | Island (14.02 KB) | Bundled in ~219 KB |
| HoverCard (×6) | ✅ | 2.29 KB gzip | Island (2.04 KB) | Bundled in ~219 KB |
| Tooltip (×6) | ✅ | 1.98 KB gzip | Island (3.25 KB) | Bundled in ~219 KB |
| Tabs | ✅ | 1.79 KB gzip | Island (4.70 KB) | Bundled in ~219 KB |
| Accordion (×6) | ✅ | 1.17 KB gzip | Island (3.32 KB) | Bundled in ~219 KB |
| Button | ❌ Static | **0 KB** | ⚠️ Partial zero-JS | Bundled in ~219 KB |
| Card | ❌ Static | **0 KB** | ⚠️ Partial zero-JS | Bundled in ~219 KB |
| Badge | ❌ Static | **0 KB** | ⚠️ Partial zero-JS | Bundled in ~219 KB |
| Input | ❌ Static | **0 KB** | **0 KB** | Bundled in ~219 KB |
| Label | ❌ Static | **0 KB** | ⚠️ Partial zero-JS | Bundled in ~219 KB |
| Checkbox | ❌ Static | **0 KB** | **0 KB** | Bundled in ~219 KB |
| Separator | ❌ Static | **0 KB** | **0 KB** | Bundled in ~219 KB |
| | | | | |
| *Shared runtime* | | *Astro (4.70 KB)* | *React + Radix + Astro (86.85 KB)* | *Included above* |
| **Total** | | **22.80 KB** | **119.88 KB** | **219.22 KB** |
> In Astro + b/ui, **7 of 13 components ship zero JavaScript**.
>
> In Astro + React + shadcn with per-section islands, **3 components are fully zero-JS** (Input, Checkbox, Separator) and **4 more are partially zero-JS** — their instances outside islands (hero buttons, feature cards) render as pure HTML, but the same components also appear inside interactive islands (PricingTabs) where they still ship JS.
>
> In Next.js, every component contributes to the JS bundle.

---

## JS Bundle Breakdown

### Astro + b/ui (7 files, 22.80 KB gzipped)

Each interactive component ships its own small JS module. Static components ship nothing.

| File | Raw | Gzipped |
|---|---|---|
| NavigationMenu (data-slot) | 20.43 KB | 7.20 KB |
| Shared index (Astro runtime) | 12.55 KB | 4.70 KB |
| Select (data-slot) | 9.24 KB | 3.67 KB |
| HoverCard (data-slot) | 6.15 KB | 2.29 KB |
| Tooltip (data-slot) | 5.09 KB | 1.98 KB |
| Tabs (data-slot) | 4.01 KB | 1.79 KB |
| Accordion (data-slot) | 2.95 KB | 1.17 KB |
| **Total** | **60.42 KB** | **22.80 KB** |

### Astro + React + shadcn (19 files, 119.88 KB gzipped)

Per-section React islands. Each interactive section hydrates independently. Static components (Button, Card, etc.) are server-rendered to HTML outside of islands.

| File | Raw | Gzipped |
|---|---|---|
| React/ReactDOM runtime | 178.42 KB | 56.24 KB |
| ContactSelects island | 40.61 KB | 14.02 KB |
| Radix shared utilities | 31.02 KB | 10.39 KB |
| React shared utilities | 26.97 KB | 10.43 KB |
| SiteNav island | 18.43 KB | 5.70 KB |
| PricingTabs island | 16.07 KB | 4.70 KB |
| Astro island runtime | 11.94 KB | 4.30 KB |
| FAQAccordion island | 8.49 KB | 3.32 KB |
| FeatureTooltip island | 8.94 KB | 3.25 KB |
| InlineHoverCard island | 5.50 KB | 2.04 KB |
| *9 smaller chunks* | 11.96 KB | 5.49 KB |
| **Total** | **358.35 KB** | **119.88 KB** |

### Next.js + shadcn (10 files, 219.22 KB gzipped)

Includes React runtime, Radix UI primitives, Next.js router, and framework code.

| File | Raw | Gzipped |
|---|---|---|
| Main framework chunk | 219.37 KB | 68.50 KB |
| Next.js router chunk | 154.61 KB | 39.30 KB |
| Framework utilities | 109.96 KB | 38.70 KB |
| Page/component code | 116.67 KB | 31.02 KB |
| Hydration/RSC chunk | 72.37 KB | 24.60 KB |
| *5 smaller chunks* | 56.85 KB | 17.10 KB |
| **Total** | **729.83 KB** | **219.22 KB** |

---

## Where Does the JavaScript Come From?

```
Astro + b/ui          ████ 22.80 KB
                      └─ 6 data-slot modules + Astro runtime

Astro + React + shadcn ████████████████████████ 119.88 KB
                       └─ React (56 KB) + 6 Radix islands (44 KB) + Astro (4 KB)

Next.js + shadcn       ████████████████████████████████████████████ 219.22 KB
                       └─ React (56 KB) + Radix/components (~54 KB)
                          + Next.js router (39 KB) + Framework (70 KB)
```

### What the Astro + React version tells us

Even with per-section islands (each interactive component as its own `client:load` boundary), the gzipped JS is **~120 KB** — slightly *more* than the single-island approach (~114 KB). Splitting into islands causes Radix utility code to duplicate across chunks.

1. **React + Radix** costs **~120 KB gzip** — that's the floor for shadcn/ui, even with optimized islands
2. **Next.js adds ~100 KB** more on top (router, RSC, framework utils)
3. **b/ui's data-slot approach** achieves the same interactive UX for **23 KB total**, because it replaces both React AND Radix with vanilla JS primitives
4. **Islands don't solve the React tax** — they help with selective hydration but can't eliminate the runtime cost

---

## Why This Happens

### The hydration tax (React-based versions)

In both React-based versions, the browser must:
1. **Download** React + ReactDOM (~56 KB gzipped)
2. **Download** Radix UI primitives for each component
3. **Parse and execute** all JavaScript
4. **Hydrate** the entire component tree — even static text

Marketing sites are content-first. They have long text, forms, tooltips, and
navigation — but they rarely need complex client-side state.

In Next.js + shadcn, **every text node on the page must hydrate** even though
it never changes. The React runtime, Radix primitives, and reconciliation engine
are all loaded for what is essentially a static page with a few interactive
widgets.

### The framework tax (Next.js only)

Next.js adds additional overhead on top of React:
1. **Client-side router** — Links, prefetching, route transitions
2. **RSC infrastructure** — Server/client component reconciliation
3. **Framework utilities** — Error boundaries, loading states, metadata

In Astro + React + shadcn, removing Next.js cuts the JS in half — but you still
pay for React + Radix to hydrate the entire component tree.

### The Astro + b/ui approach

1. Static components → **pure HTML + CSS** (zero JavaScript)
2. Interactive components → **data-slot primitives** (tiny vanilla JS)
3. **No framework runtime**, no virtual DOM, no hydration
4. JavaScript loaded **only for the 6 component types** that need it

### Why b/ui Buttons inside Tabs are still zero-JS

In b/ui, the Tabs `data-slot` JS only **toggles visibility** of pre-rendered HTML panels. It doesn't know or care what's inside them — Buttons and Cards are already compiled to static HTML at build time. The JS shows/hides a `<div>`, and the Button inside is just a `<button>` DOM node.

In React, Tabs needs to **render** its children via `React.createElement()`. Button, Card, and Badge are function calls that must exist in the JS bundle. When you switch tabs, React re-renders the subtree — so it needs the component code for everything inside.

**b/ui Tabs toggles HTML panels. React Tabs creates them.**

---

## How to Reproduce

### Prerequisites

- Node.js 18+
- Bun 1.2+ (for Astro b/ui project)
- npm (for Next.js and Astro React projects)

### Build & Measure

```bash
# Build all three
cd astro-bui && bun install && bun run build
cd astro-react-shadcn && npm install && npx astro build
cd nextjs-shadcn && npm install && npm run build

# Measure
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

### Lighthouse Results (Mobile, Incognito)

| Metric | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn |
|---|---|---|---|
| **FCP** | 1.4 s | 1.6 s | 0.8 s |
| **LCP** | **1.4 s** | 2.1 s | 2.6 s |
| **TBT** | **0 ms** | **0 ms** | 40 ms |
| **CLS** | 0.013 | 0.013 | 0 |
| **Speed Index** | 1.4 s | 1.6 s | 0.8 s |

> **Note:** Next.js has the fastest FCP/Speed Index (0.8 s) because it pre-renders
> HTML immediately — but it has the worst LCP (2.6 s) because the browser must
> download, parse, and hydrate 219 KB of JavaScript before the page becomes fully
> painted. Astro + b/ui paints and finishes in the same 1.4 s with zero blocking time.

### INP — Interaction to Next Paint (20× CPU throttle)

| | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn |
|---|---|---|---|
| **Worst INP** | ~100 ms | ~100 ms | 168 ms |

> All three are under the 200 ms "good" threshold, but Next.js interactions are
> ~70% slower due to React's reconciliation overhead on every state change.

### Code Coverage (JS + CSS, after full interaction)

| | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn |
|---|---|---|---|
| **Total loaded** | 132 KB | 424 KB | 695 KB |
| **Used** | 85.7 KB | 260 KB | 431 KB |
| **Unused** | **46.1 KB** | 163 KB | 265 KB |

> Next.js ships **5.7× more unused code** than Astro + b/ui. Even after interacting
> with every component on the page, 265 KB of downloaded JavaScript is never executed.

---

## Methodology

| Setting | Value |
|---|---|
| Astro version | 5.16.4 – 5.18.0 |
| Next.js version | 16.1.6 (Turbopack) |
| Build mode | Static (SSG) for all three |
| Measurement | All `.js` files in build output, gzipped programmatically |
| Viewport | 1280×800 |
| Components | 13 identical types, same count and placement |
| Next.js scope | `.next/static` (client-shipped JS only) |
