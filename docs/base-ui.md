# React demo component snapshot

Both React demos use shadcn's `base-nova` registry style and `@base-ui/react` **1.8.0**. The original 13 copied components were generated on September 25, 2026 with shadcn CLI **4.21.0** from the official registry. The source files are committed in each demo, and npm lockfiles pin their dependencies.

All three demos now use Nova: `bejamas-nova` for b/ui and `base-nova` for both shadcn demos. On September 27, b/ui’s 17 component families were synchronized from the same pinned Bejamas UI commit, `218f7621d596a3b4bd33b6c96d31ee3b0e332483`, with CLI 0.4.1. `npm run sync:bui` reproduces that snapshot and rejects a different preset.

The September 27 update adds dialog, switch, popover, and dropdown-menu from the matching Nova registries. All ten data-slot packages and their core are pinned to 1.0.2. The accordion source was checked against the current b/ui registry; its generated Nova markup was already identical after icon conversion. Its behavior now comes from data-slot 1.0.2.

The new `InteractiveDemos` section uses the same React source in both React demos. Each project carries the same cookie-storage module, and verification rejects divergent copies. Cookie choices persist under a versioned localStorage key, while unsaved edits are discarded when the dialog closes. No analytics or marketing scripts are loaded. Notifications and quick settings keep state for the current visit.

The b/ui cookie trigger uses `Button` with `data-slot="dialog-trigger"` directly. This puts the ARIA attributes on the actual button instead of the registry’s `asChild` wrapper. Its close button has an explicitly sized icon. The copied library components remain unchanged.

The demos also align their page-level choices: small pill badges, standard tabs without b/ui’s optional sliding indicator, navigation link sizing, single-row feature card headers, and tooltip trigger markup. Both React contact components use an explicit spaced wrapper so the Astro island boundary does not collapse the form spacing. The b/ui select wrappers use flex layout to avoid inline baseline whitespace below each trigger. Shared theme tokens and the local Geist font are unchanged. The preset alignment does not guarantee identical implementation, generated CSS, or every animated state.

Run `npm run verify:visual` to capture all three production pages at 412px and 1280px widths. The check compares corresponding component dimensions and header, section and footer positions with a 0.5px tolerance. Its summary is saved to `results/visual-parity.json`. Screenshots and computed component styles are written to `.benchmark-results/visual-parity/`. The previous Juno reports are preserved in [the pre-Nova archive](../results/history/juno-data-slot-1.0.1-2026-09-26/README.md).

The generation command was:

```sh
npx --yes shadcn@4.21.0 add accordion badge button card checkbox hover-card input label navigation-menu select separator tabs tooltip --yes --overwrite --cwd nextjs-shadcn
```

The four additional React components were generated with `shadcn@4.21.0 add dialog popover dropdown-menu switch` on September 27. Existing button source was retained.

The generated `cn` imports use the repository's existing `@/lib/utils` helper. The same component files were copied to Astro React. Future registry calls can return newer source even with the CLI pinned; use the committed files and lockfiles to reproduce this snapshot.

The demos use Base UI's `render` composition for hover-card buttons, native navigation links, and explicit select item labels. Accordion uses Base UI's single-open default. Astro keeps its existing React islands, and Next keeps its Server Component page and component-level client boundaries.

Base UI 1.8 tooltips are visual labels. Their trigger's accessible name includes the same content. Verification uses actual keyboard navigation and checks the visible popup and accessible name, rather than expecting Radix's `role="tooltip"` markup. See [Base UI's tooltip guidelines](https://base-ui.com/react/components/tooltip#usage-guidelines).

Base UI checkboxes render a visible control beside a hidden form input. The interaction probe targets the visible checkbox, while select checks confirm the displayed label after selection.

`npm run verify` enforces Nova in all three demos and checks that both React demos retain identical component source, the same Base UI preset and version, and no direct Radix dependencies or component imports. It also verifies page text parity, controls, accessibility, browser errors and asset requests.

The [historical Radix reports](../results/history/radix-2026-09-25/README.md) are preserved separately. Their Lighthouse, CSS and interaction timings must not be attributed to these Base UI demos.

## Framework versions

The September 25 framework upgrade uses Astro 7.3.5 in both Astro demos, `@astrojs/react` 7.0.0, and Next.js 16.3.6. Both React demos use React and React DOM 19.3.0. The Astro React integration requires `oxc-transform-react` 0.145.0 for its new build pipeline. The unused Radix SSR configuration was removed. Page content, component source, theme styles, hydration boundaries and CSS-delivery settings were retained.

The [pre-upgrade Base UI reports](../results/history/base-ui-astro5-next16.1-2026-09-25/README.md) retain the previous comparison. Current asset, quality, Lighthouse and local interaction reports include installed dependency versions in `environment.versions`; physical-device reports leave that field null because local versions cannot identify remote builds.

Migration references: [Astro 6](https://docs.astro.build/en/guides/upgrade-to/v6/), [Astro 7](https://docs.astro.build/en/guides/upgrade-to/v7/), and [Next.js](https://nextjs.org/docs/app/guides/upgrading).

`npm run test:components` checks neutral navigation hover, cookie choices and reload persistence, Escape dismissal, focus restoration and trapping, modal accessibility, open-menu WCAG checks, notification read state, and keyboard menu toggles at 390px and 1280px. Set `DEMO_DEPLOYED=1` to run the same checks against the three Cloudflare demos.
