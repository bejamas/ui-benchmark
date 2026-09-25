# Interaction benchmark

Measured 2026-09-25T13:01:35.806Z with Chrome 153.0.8010.53.

CPU profiles: baseline-4x = 4×; mobile-mid = 4.38×; mobile-low = 15.52×; stress-20x = 20×.

Scripted lab results, not field INP. Timing percentiles include successful, reported interactions only. Read failures and missing timings alongside them.

| Profile | Scenario | Project | Control | Success | Before load | Median ms | p90 ms | Unreported |
|---|---|---|---|---|---|---:|---:|---:|
| baseline-4x | settled | astro-bui | pricingTabs | 30/30 | 0/30 | 52.0 | 104.0 | 0 |
| baseline-4x | settled | astro-bui | faqAccordion | 30/30 | 0/30 | 16.0 | 24.0 | 1 |
| baseline-4x | settled | astro-bui | newsletterCheckbox | 30/30 | 0/30 | 16.0 | 16.0 | 11 |
| baseline-4x | settled | astro-react-shadcn | pricingTabs | 30/30 | 0/30 | 64.0 | 96.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | faqAccordion | 30/30 | 0/30 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | newsletterCheckbox | 30/30 | 0/30 | 16.0 | 24.0 | 13 |
| baseline-4x | settled | nextjs-shadcn | pricingTabs | 30/30 | 0/30 | 60.0 | 104.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | faqAccordion | 30/30 | 0/30 | 16.0 | 24.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | newsletterCheckbox | 30/30 | 0/30 | 16.0 | 16.0 | 8 |
| baseline-4x | early | astro-bui | navigation | 30/30 | 30/30 | 80.0 | 120.0 | 0 |
| baseline-4x | early | astro-react-shadcn | navigation | 0/30 | 30/30 | unreported | unreported | 0 |
| baseline-4x | early | nextjs-shadcn | navigation | 0/30 | 30/30 | unreported | unreported | 0 |
| mobile-mid | settled | astro-bui | pricingTabs | 30/30 | 0/30 | 32.0 | 32.0 | 0 |
| mobile-mid | settled | astro-bui | faqAccordion | 30/30 | 0/30 | 32.0 | 32.0 | 0 |
| mobile-mid | settled | astro-bui | newsletterCheckbox | 30/30 | 0/30 | 32.0 | 32.0 | 0 |
| mobile-mid | settled | astro-react-shadcn | pricingTabs | 30/30 | 0/30 | 32.0 | 32.0 | 0 |
| mobile-mid | settled | astro-react-shadcn | faqAccordion | 30/30 | 0/30 | 32.0 | 40.0 | 0 |
| mobile-mid | settled | astro-react-shadcn | newsletterCheckbox | 30/30 | 0/30 | 32.0 | 32.0 | 0 |
| mobile-mid | settled | nextjs-shadcn | pricingTabs | 30/30 | 0/30 | 40.0 | 40.0 | 0 |
| mobile-mid | settled | nextjs-shadcn | faqAccordion | 30/30 | 0/30 | 32.0 | 40.0 | 0 |
| mobile-mid | settled | nextjs-shadcn | newsletterCheckbox | 30/30 | 0/30 | 32.0 | 32.0 | 0 |
| mobile-mid | early | astro-bui | navigation | 30/30 | 30/30 | 80.0 | 96.0 | 0 |
| mobile-mid | early | astro-react-shadcn | navigation | 0/30 | 30/30 | unreported | unreported | 0 |
| mobile-mid | early | nextjs-shadcn | navigation | 0/30 | 30/30 | unreported | unreported | 0 |
| mobile-low | settled | astro-bui | pricingTabs | 30/30 | 0/30 | 68.0 | 104.0 | 0 |
| mobile-low | settled | astro-bui | faqAccordion | 30/30 | 0/30 | 64.0 | 96.0 | 0 |
| mobile-low | settled | astro-bui | newsletterCheckbox | 30/30 | 0/30 | 40.0 | 48.0 | 0 |
| mobile-low | settled | astro-react-shadcn | pricingTabs | 30/30 | 0/30 | 108.0 | 152.0 | 0 |
| mobile-low | settled | astro-react-shadcn | faqAccordion | 30/30 | 0/30 | 72.0 | 112.0 | 0 |
| mobile-low | settled | astro-react-shadcn | newsletterCheckbox | 30/30 | 0/30 | 48.0 | 64.0 | 0 |
| mobile-low | settled | nextjs-shadcn | pricingTabs | 30/30 | 0/30 | 436.0 | 648.0 | 0 |
| mobile-low | settled | nextjs-shadcn | faqAccordion | 30/30 | 0/30 | 72.0 | 104.0 | 0 |
| mobile-low | settled | nextjs-shadcn | newsletterCheckbox | 30/30 | 0/30 | 56.0 | 64.0 | 0 |
| mobile-low | early | astro-bui | navigation | 30/30 | 0/30 | 232.0 | 336.0 | 0 |
| mobile-low | early | astro-react-shadcn | navigation | 0/30 | 30/30 | unreported | unreported | 0 |
| mobile-low | early | nextjs-shadcn | navigation | 3/30 | 29/30 | 1272.0 | 1672.0 | 0 |
| stress-20x | settled | astro-bui | pricingTabs | 30/30 | 0/30 | 88.0 | 136.0 | 0 |
| stress-20x | settled | astro-bui | faqAccordion | 30/30 | 0/30 | 80.0 | 120.0 | 0 |
| stress-20x | settled | astro-bui | newsletterCheckbox | 30/30 | 0/30 | 40.0 | 64.0 | 0 |
| stress-20x | settled | astro-react-shadcn | pricingTabs | 30/30 | 0/30 | 148.0 | 224.0 | 0 |
| stress-20x | settled | astro-react-shadcn | faqAccordion | 30/30 | 0/30 | 96.0 | 200.0 | 0 |
| stress-20x | settled | astro-react-shadcn | newsletterCheckbox | 30/30 | 0/30 | 64.0 | 96.0 | 0 |
| stress-20x | settled | nextjs-shadcn | pricingTabs | 30/30 | 0/30 | 648.0 | 1328.0 | 0 |
| stress-20x | settled | nextjs-shadcn | faqAccordion | 30/30 | 0/30 | 96.0 | 152.0 | 0 |
| stress-20x | settled | nextjs-shadcn | newsletterCheckbox | 30/30 | 0/30 | 64.0 | 88.0 | 0 |
| stress-20x | early | astro-bui | navigation | 30/30 | 0/30 | 304.0 | 512.0 | 0 |
| stress-20x | early | astro-react-shadcn | navigation | 0/30 | 30/30 | unreported | unreported | 0 |
| stress-20x | early | nextjs-shadcn | navigation | 5/30 | 28/30 | 1456.0 | 1736.0 | 0 |

## Failed attempts

Wrong-target and missing-input attempts cannot establish a handler failure. They remain in the attempt totals and are separated from missing or late UI outcomes below.

| Profile | Scenario | Project | Control | No UI change | Too late | Wrong target | Missing input | Harness errors |
|---|---|---|---|---:|---:|---:|---:|---:|
| baseline-4x | early | astro-react-shadcn | navigation | 30 | 0 | 0 | 0 | 0 |
| baseline-4x | early | nextjs-shadcn | navigation | 30 | 0 | 0 | 0 | 0 |
| mobile-mid | early | astro-react-shadcn | navigation | 30 | 0 | 0 | 0 | 0 |
| mobile-mid | early | nextjs-shadcn | navigation | 30 | 0 | 0 | 0 | 0 |
| mobile-low | early | astro-react-shadcn | navigation | 29 | 0 | 1 | 0 | 0 |
| mobile-low | early | nextjs-shadcn | navigation | 26 | 1 | 0 | 0 | 0 |
| stress-20x | early | astro-react-shadcn | navigation | 29 | 0 | 1 | 0 | 0 |
| stress-20x | early | nextjs-shadcn | navigation | 24 | 1 | 0 | 0 | 0 |

## Early input relative to navigation

Times below start at navigation. Outcome times include successful inputs only. A later first paint can shift input until after startup has settled; compare these times with the success and before-load counts above.

| Profile | Project | Median FCP ms | Median input time ms | Median successful outcome time ms |
|---|---|---:|---:|---:|
| baseline-4x | astro-bui | 638.0 | 716.2 | 779.5 |
| baseline-4x | astro-react-shadcn | 416.0 | 500.6 | unreported |
| baseline-4x | nextjs-shadcn | 662.0 | 695.3 | unreported |
| mobile-mid | astro-bui | 632.0 | 705.4 | 809.2 |
| mobile-mid | astro-react-shadcn | 412.0 | 522.5 | unreported |
| mobile-mid | nextjs-shadcn | 680.0 | 715.9 | unreported |
| mobile-low | astro-bui | 974.0 | 1476.4 | 1722.3 |
| mobile-low | astro-react-shadcn | 554.0 | 834.0 | unreported |
| mobile-low | nextjs-shadcn | 1034.0 | 1113.8 | 2812.3 |
| stress-20x | astro-bui | 1144.0 | 1783.2 | 2111.9 |
| stress-20x | astro-react-shadcn | 610.0 | 999.5 | unreported |
| stress-20x | nextjs-shadcn | 1164.0 | 1292.6 | 3338.2 |
