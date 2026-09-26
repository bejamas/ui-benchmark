# Navigation menu bridge fix (included in data-slot 1.0.1)

`@data-slot/navigation-menu@1.0.0` builds its hover bridge from the viewport's
animated `getBoundingClientRect()`. During b/ui's popup and viewport scale
animations, that rectangle is inset from the menu's layout bounds. The bridge
treats the inset as additional space to cover, but positions itself relative to
the unscaled menu. It can therefore extend upward over the navigation triggers
and retain those incorrect bounds after the animation finishes.

The fix uses the computed floating position and measured layout size for the
bridge snapshot. It preserves animations, pointer handling, and the bridge across
the actual gap. It was merged in [data-slot PR #34](https://github.com/bejamas/data-slot/pull/34)
and is included in version 1.0.1.

The equivalent source change in data-slot's
`packages/navigation-menu/src/navigation-menu-layout.ts`, inside `onLayout`, is:

```diff
- viewportRect: viewport.getBoundingClientRect(),
+ viewportRect: new DOMRect(pos.x, pos.y, size.width, size.height),
```

The benchmark now uses the published 1.0.1 packages without a local patch.
The old patch and lockfile are preserved in the
[1.0.0 archive](../../results/history/data-slot-1.0.0-2026-09-26/README.md).

From the repository root:

```bash
cd astro-bui
bun install --frozen-lockfile
bun run build
cd ..
npm run test:navigation
```

The production-browser test checks Products and Solutions repeatedly, tests nine
points across each trigger for interception, and covers mobile touch at 20× and
native speed, desktop mouse at 4×, hover across the real gap, and Escape.

The archived `results/history/radix-2026-09-25/interactions-expanded.*` study predates this patch. Its
failed close attempts remain historical observations; they are not replaced with
timings from a different build.
