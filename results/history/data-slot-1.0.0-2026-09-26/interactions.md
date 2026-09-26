# Interaction benchmark

Measured 2026-09-25T21:02:09.073Z with Chrome 153.0.8010.53.

CPU profiles: baseline-4x = 4×; stress-20x = 20×.

Scripted lab results, not field INP. Timing percentiles include successful, reported interactions only. Read failures and missing timings alongside them.

| Profile | Scenario | Project | Control | Success | Before load | Median ms | p90 ms | Unreported |
|---|---|---|---|---|---|---:|---:|---:|
| baseline-4x | settled | astro-bui | navigation | 3/3 | 0/3 | 80.0 | 112.0 | 0 |
| baseline-4x | settled | astro-bui | navigationClose | 3/3 | 0/3 | 24.0 | 24.0 | 0 |
| baseline-4x | settled | astro-bui | pricingTabs | 3/3 | 0/3 | 24.0 | 32.0 | 0 |
| baseline-4x | settled | astro-bui | pricingMonthly | 3/3 | 0/3 | 16.0 | 24.0 | 0 |
| baseline-4x | settled | astro-bui | faqAccordion | 3/3 | 0/3 | 16.0 | 24.0 | 0 |
| baseline-4x | settled | astro-bui | faqCollapse | 3/3 | 0/3 | 16.0 | 16.0 | 1 |
| baseline-4x | settled | astro-bui | companySelect | 3/3 | 0/3 | 32.0 | 32.0 | 0 |
| baseline-4x | settled | astro-bui | companyOption | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | astro-bui | newsletterCheckbox | 3/3 | 0/3 | unreported | unreported | 3 |
| baseline-4x | settled | astro-bui | newsletterUncheck | 3/3 | 0/3 | unreported | unreported | 3 |
| baseline-4x | settled | astro-react-shadcn | navigation | 3/3 | 0/3 | 128.0 | 160.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | navigationClose | 3/3 | 0/3 | 32.0 | 56.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | pricingTabs | 3/3 | 0/3 | 32.0 | 48.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | pricingMonthly | 3/3 | 0/3 | 24.0 | 24.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | faqAccordion | 3/3 | 0/3 | 24.0 | 24.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | faqCollapse | 3/3 | 0/3 | 16.0 | 16.0 | 1 |
| baseline-4x | settled | astro-react-shadcn | companySelect | 3/3 | 0/3 | 72.0 | 72.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | companyOption | 3/3 | 0/3 | 48.0 | 48.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | newsletterCheckbox | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | newsletterUncheck | 3/3 | 0/3 | unreported | unreported | 3 |
| baseline-4x | settled | nextjs-shadcn | navigation | 3/3 | 0/3 | 144.0 | 280.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | navigationClose | 3/3 | 0/3 | 32.0 | 48.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | pricingTabs | 3/3 | 0/3 | 32.0 | 48.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | pricingMonthly | 3/3 | 0/3 | 24.0 | 40.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | faqAccordion | 3/3 | 0/3 | 16.0 | 24.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | faqCollapse | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | companySelect | 3/3 | 0/3 | 88.0 | 96.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | companyOption | 3/3 | 0/3 | 48.0 | 48.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | newsletterCheckbox | 3/3 | 0/3 | 16.0 | 24.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | newsletterUncheck | 3/3 | 0/3 | 16.0 | 16.0 | 2 |
| stress-20x | settled | astro-bui | navigation | 3/3 | 0/3 | 368.0 | 432.0 | 0 |
| stress-20x | settled | astro-bui | navigationClose | 3/3 | 0/3 | 104.0 | 128.0 | 0 |
| stress-20x | settled | astro-bui | pricingTabs | 3/3 | 0/3 | 128.0 | 128.0 | 0 |
| stress-20x | settled | astro-bui | pricingMonthly | 3/3 | 0/3 | 88.0 | 96.0 | 0 |
| stress-20x | settled | astro-bui | faqAccordion | 3/3 | 0/3 | 112.0 | 216.0 | 0 |
| stress-20x | settled | astro-bui | faqCollapse | 3/3 | 0/3 | 64.0 | 96.0 | 0 |
| stress-20x | settled | astro-bui | companySelect | 3/3 | 0/3 | 112.0 | 136.0 | 0 |
| stress-20x | settled | astro-bui | companyOption | 3/3 | 0/3 | 104.0 | 136.0 | 0 |
| stress-20x | settled | astro-bui | newsletterCheckbox | 3/3 | 0/3 | 48.0 | 48.0 | 0 |
| stress-20x | settled | astro-bui | newsletterUncheck | 3/3 | 0/3 | 48.0 | 48.0 | 0 |
| stress-20x | settled | astro-react-shadcn | navigation | 3/3 | 0/3 | 528.0 | 552.0 | 0 |
| stress-20x | settled | astro-react-shadcn | navigationClose | 3/3 | 0/3 | 168.0 | 240.0 | 0 |
| stress-20x | settled | astro-react-shadcn | pricingTabs | 3/3 | 0/3 | 184.0 | 208.0 | 0 |
| stress-20x | settled | astro-react-shadcn | pricingMonthly | 3/3 | 0/3 | 136.0 | 144.0 | 0 |
| stress-20x | settled | astro-react-shadcn | faqAccordion | 3/3 | 0/3 | 104.0 | 104.0 | 0 |
| stress-20x | settled | astro-react-shadcn | faqCollapse | 3/3 | 0/3 | 64.0 | 72.0 | 0 |
| stress-20x | settled | astro-react-shadcn | companySelect | 3/3 | 0/3 | 64.0 | 80.0 | 0 |
| stress-20x | settled | astro-react-shadcn | companyOption | 3/3 | 0/3 | 264.0 | 336.0 | 0 |
| stress-20x | settled | astro-react-shadcn | newsletterCheckbox | 3/3 | 0/3 | 96.0 | 104.0 | 0 |
| stress-20x | settled | astro-react-shadcn | newsletterUncheck | 3/3 | 0/3 | 72.0 | 72.0 | 0 |
| stress-20x | settled | nextjs-shadcn | navigation | 1/3 | 0/3 | 912.0 | 912.0 | 0 |
| stress-20x | settled | nextjs-shadcn | navigationClose | 1/3 | 0/3 | 168.0 | 168.0 | 0 |
| stress-20x | settled | nextjs-shadcn | pricingTabs | 3/3 | 0/3 | 464.0 | 528.0 | 0 |
| stress-20x | settled | nextjs-shadcn | pricingMonthly | 3/3 | 0/3 | 208.0 | 224.0 | 0 |
| stress-20x | settled | nextjs-shadcn | faqAccordion | 3/3 | 0/3 | 120.0 | 184.0 | 0 |
| stress-20x | settled | nextjs-shadcn | faqCollapse | 3/3 | 0/3 | 96.0 | 112.0 | 0 |
| stress-20x | settled | nextjs-shadcn | companySelect | 3/3 | 0/3 | 80.0 | 88.0 | 0 |
| stress-20x | settled | nextjs-shadcn | companyOption | 3/3 | 0/3 | 448.0 | 496.0 | 0 |
| stress-20x | settled | nextjs-shadcn | newsletterCheckbox | 3/3 | 0/3 | 128.0 | 136.0 | 0 |
| stress-20x | settled | nextjs-shadcn | newsletterUncheck | 3/3 | 0/3 | 88.0 | 104.0 | 0 |

## Failed attempts

Wrong-target and missing-input attempts cannot establish a handler failure. They remain in the attempt totals and are separated from missing or late UI outcomes below.

| Profile | Scenario | Project | Control | No UI change | Too late | Wrong target | Missing input | Prerequisite failed | Harness errors |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
| stress-20x | settled | nextjs-shadcn | navigation | 0 | 2 | 0 | 0 | 0 | 0 |
| stress-20x | settled | nextjs-shadcn | navigationClose | 0 | 0 | 0 | 0 | 2 | 0 |
