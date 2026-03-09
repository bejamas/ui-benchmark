# Benchmark Steps — Developer Article Reference

Step-by-step journal of how this benchmark was created. Can be used as the basis
for a dev article / blog post.

---

## Step 1: Set Up the Next.js + shadcn Control Version

```bash
mkdir benchmarks && cd benchmarks

# Scaffold Next.js with TypeScript, Tailwind, App Router
npx create-next-app@latest nextjs-shadcn \
  --typescript --tailwind --app --src-dir --use-npm --yes --disable-git

cd nextjs-shadcn

# Initialize shadcn
npx shadcn@latest init --yes --defaults

# Add all the components we need for a marketing page
npx shadcn@latest add \
  navigation-menu tooltip hover-card select tabs accordion \
  button card badge input label checkbox separator
```

**Components installed:** 13 (NavigationMenu, Tooltip, HoverCard, Select, Tabs,
Accordion, Button, Card, Badge, Input, Label, Checkbox, Separator)

---

## Step 2: Build the Marketing Onepager (Next.js)

Created `src/app/page.tsx` with these sections:

1. **Sticky header** with `NavigationMenu` (2 dropdown menus, 4 items each)
2. **Hero section** with `Badge` + `Button`
3. **Features grid** — 6 `Card` components, each with a `Tooltip` on an info icon
4. **Pricing section** — `Tabs` (Monthly/Yearly) with 3 pricing `Card`s per tab
5. **Long-form text** — 4 paragraphs with 6 inline `HoverCard` components
   (React, Hydration, Virtual DOM, Radix UI, Navigation Menu, data-slot)
6. **FAQ** — `Accordion` with 6 items
7. **Contact form** — `Input`, `Select` (x2), `Checkbox`, `Label`, `Button`
8. **Footer** — `Separator` + link columns

The page uses `"use client"` since all shadcn interactive components require
client-side React.

---

## Step 3: Verify Next.js Build

```bash
npm run build
```

Build succeeds, static output generated.

---

## Step 4: Set Up the Astro + b/ui Version

```bash
cd benchmarks

# Copy the b/ui Astro template
cp -r ../templates/astro astro-bui
cd astro-bui

# Install base dependencies
bun install

# Add all matching b/ui components
npx bejamas@canary add \
  navigation-menu tooltip hover-card select tabs accordion \
  button card badge input label checkbox separator --yes
```

**Components installed:** Same 13 components as the Next.js version, but as
`.astro` files using `data-slot` primitives.

---

## Step 5: Build the Marketing Onepager (Astro)

Created `src/pages/index.astro` with the **exact same layout and content** as
the Next.js version. Key differences:

- No `"use client"` — everything renders server-side
- Components are imported from `@/ui/*` (local `.astro` files)
- Interactive behavior comes from `@data-slot/*` packages (auto-included)
- Static components (Button, Card, Badge, Input, etc.) ship **zero JavaScript**

---

## Step 6: Build & Measure

```bash
# Build both
cd astro-bui && bun run build
cd ../nextjs-shadcn && npm run build

# Run measurement
node scripts/measure.mjs
```

---

## Step 7: Results

| Project | Raw JS | Gzipped JS | Ratio |
|---|---|---|---|
| **Astro + b/ui** | **58.59 KB** | **22.25 KB** | 1x |
| Next.js + shadcn | 1,846.50 KB | 530.16 KB | **23.8x** |

### Key Observations

1. **7 JS files vs 60** — Astro produces only the JS needed for interactive components
2. **Zero-JS components** — Button, Card, Badge, Input, Label, Checkbox, Separator produce no JS
3. **NavigationMenu is the heaviest** — 6.72 KB gzipped in Astro vs shared across ~530 KB in Next.js
4. **Long text with HoverCards** — In Next.js, all text nodes must hydrate; in Astro, only the HoverCard triggers have JS
5. **The React runtime alone** (~42 KB gzipped) exceeds Astro's entire JS output

---

## Step 8: Manual Performance Testing

Run each project in preview mode and use Chrome DevTools:

```bash
# Astro
cd astro-bui && bun run preview  # port 4321

# Next.js
cd nextjs-shadcn && npm run start  # port 3000
```

### What to check:

- [ ] **Network tab** → Compare total JS transferred
- [ ] **Performance tab** → Record interaction → Check INP
- [ ] **Lighthouse** → Full audit in Incognito mode
- [ ] **Coverage tab** → See how much downloaded JS is actually executed
