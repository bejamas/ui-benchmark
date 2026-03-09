# Benchmark: Astro + b/ui vs Next.js + shadcn/ui

> Same marketing page. Same components. Three approaches. Radically different JavaScript footprints.

A controlled comparison of JavaScript footprint and performance between three
identical marketing pages built with different component libraries.

---

## TL;DR

| Metric | Astro + b/ui | Astro + React + shadcn | Next.js + shadcn | 
|---|---|---|---|
| **JS bundle (gzipped)** | **22.80 KB** | 114.47 KB | 219.22 KB |
| **JS bundle (raw)** | **60.42 KB** | 374.03 KB | 729.83 KB |
| **JS files** | **7** | 3 | 10 |
| **vs b/ui (gzip)** | **1x** | 5.0x more | 9.6x more |
| **Zero-JS components** | 7 of 13 | 0 of 13 | 0 of 13 |

---

## The Three Projects

| | **Astro + b/ui** | **Astro + React + shadcn** | **Next.js + shadcn** |
|---|---|---|---|
| Framework | Astro 5 | Astro 5 + React | Next.js 16 |
| Components | b/ui (data-slot) | shadcn/ui (Radix) | shadcn/ui (Radix) |
| Styling | Tailwind CSS v4 | Tailwind CSS v4 | Tailwind CSS v4 |
| Rendering | Static HTML | React island (`client:load`) | Static (SSG) |
| Package Manager | Bun | npm | npm |

The **Astro + React + shadcn** version isolates the cost of React itself. By running React inside Astro (as a `client:load` island), we remove the Next.js router, framework code, and RSC overhead — leaving only React + Radix.

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
| NavigationMenu | ✅ | 7.20 KB gzip | Bundled in ~114 KB | Bundled in ~219 KB |
| Select (×2) | ✅ | 3.67 KB gzip | Bundled in ~114 KB | Bundled in ~219 KB |
| HoverCard (×6) | ✅ | 2.29 KB gzip | Bundled in ~114 KB | Bundled in ~219 KB |
| Tooltip (×6) | ✅ | 1.98 KB gzip | Bundled in ~114 KB | Bundled in ~219 KB |
| Tabs | ✅ | 1.79 KB gzip | Bundled in ~114 KB | Bundled in ~219 KB |
| Accordion (×6) | ✅ | 1.17 KB gzip | Bundled in ~114 KB | Bundled in ~219 KB |
| Button | ❌ Static | **0 KB** | Bundled in ~114 KB | Bundled in ~219 KB |
| Card | ❌ Static | **0 KB** | Bundled in ~114 KB | Bundled in ~219 KB |
| Badge | ❌ Static | **0 KB** | Bundled in ~114 KB | Bundled in ~219 KB |
| Input | ❌ Static | **0 KB** | Bundled in ~114 KB | Bundled in ~219 KB |
| Label | ❌ Static | **0 KB** | Bundled in ~114 KB | Bundled in ~219 KB |
| Checkbox | ❌ Static | **0 KB** | Bundled in ~114 KB | Bundled in ~219 KB |
| Separator | ❌ Static | **0 KB** | Bundled in ~114 KB | Bundled in ~219 KB |

> In Astro + b/ui, **7 of 13 components ship zero JavaScript**. In both React-based versions, every component contributes to the JS bundle because the entire component tree must hydrate.

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

### Astro + React + shadcn (3 files, 114.47 KB gzipped)

React + Radix running inside an Astro island. No Next.js router or framework code.

| File | Raw | Gzipped |
|---|---|---|
| React/ReactDOM runtime | 178.42 KB | 56.24 KB |
| MarketingPage + Radix components | 183.67 KB | 53.93 KB |
| Astro island runtime | 11.94 KB | 4.30 KB |
| **Total** | **374.03 KB** | **114.47 KB** |

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

Astro + React + shadcn ██████████████████████ 114.47 KB
                       └─ React (56 KB) + Radix/components (54 KB) + Astro (4 KB)

Next.js + shadcn       ████████████████████████████████████████████ 219.22 KB
                       └─ React (56 KB) + Radix/components (~54 KB)
                          + Next.js router (39 KB) + Framework (70 KB)
```

### What the Astro + React version tells us

By removing Next.js from the equation, we isolate two separate costs:

1. **React + Radix alone** costs **~114 KB gzip** — that's the minimum JS for using shadcn/ui components, regardless of framework
2. **Next.js adds ~105 KB** more on top (router, RSC, hydration, framework utils)
3. **b/ui's data-slot approach** achieves the same interactive UX for **23 KB total**, because it replaces both React AND Radix with vanilla JS primitives

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
| **LCP** | **1.4 s** | 1.8 s | 2.6 s |
| **TBT** | **0 ms** | **0 ms** | 40 ms |
| **CLS** | 0.013 | 0 | 0 |
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
| **Total loaded** | 132 KB | 440 KB | 695 KB |
| **Used** | 85.7 KB | 278 KB | 431 KB |
| **Unused** | **46.1 KB** | 161 KB | 265 KB |

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
