# data-slot 1.0.0 before the 1.0.1 upgrade

The asset, quality, Lighthouse, and three-visit interaction reports preserve the current Base UI comparison before the September 26 dependency upgrade. They use Astro 7.3.5, Next.js 16.3.6, and React 19.3.0.

The separate [30-visit 20× baseline](interactions-20x.md) was collected immediately before installing 1.0.1, with all ten settled actions on the current b/ui page. It uses data-slot 1.0.0 plus the local navigation bridge patch. Its raw samples and summary retain their own collection timestamps and build fingerprint.

The installed versions, b/ui manifest, Bun lockfile, and dependency patch are preserved here. Source hashes identify the page and component files held constant across the before/after runs. Lighthouse was not rerun as part of the interaction-only dependency upgrade.
