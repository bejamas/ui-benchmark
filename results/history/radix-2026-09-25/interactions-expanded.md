# Interaction benchmark

Measured 2026-09-25T19:51:41.624Z with Chrome 153.0.8010.53.

CPU profiles: stress-20x = 20×.

Scripted lab results, not field INP. Timing percentiles include successful, reported interactions only. Read failures and missing timings alongside them.

| Profile | Scenario | Project | Control | Success | Before load | Median ms | p90 ms | Unreported |
|---|---|---|---|---|---|---:|---:|---:|
| stress-20x | settled | astro-bui | navigation | 30/30 | 0/30 | 324.0 | 416.0 | 0 |
| stress-20x | settled | astro-bui | navigationClose | 0/30 | 0/30 | unreported | unreported | 0 |
| stress-20x | settled | astro-bui | pricingTabs | 30/30 | 0/30 | 160.0 | 208.0 | 0 |
| stress-20x | settled | astro-bui | pricingMonthly | 30/30 | 0/30 | 72.0 | 104.0 | 0 |
| stress-20x | settled | astro-bui | faqAccordion | 30/30 | 0/30 | 88.0 | 128.0 | 0 |
| stress-20x | settled | astro-bui | faqCollapse | 30/30 | 0/30 | 72.0 | 96.0 | 0 |
| stress-20x | settled | astro-bui | companySelect | 30/30 | 0/30 | 112.0 | 144.0 | 0 |
| stress-20x | settled | astro-bui | companyOption | 30/30 | 0/30 | 92.0 | 112.0 | 0 |
| stress-20x | settled | astro-bui | newsletterCheckbox | 30/30 | 0/30 | 48.0 | 56.0 | 0 |
| stress-20x | settled | astro-bui | newsletterUncheck | 30/30 | 0/30 | 40.0 | 48.0 | 0 |
| stress-20x | settled | astro-react-shadcn | navigation | 30/30 | 0/30 | 240.0 | 384.0 | 0 |
| stress-20x | settled | astro-react-shadcn | navigationClose | 30/30 | 0/30 | 88.0 | 160.0 | 0 |
| stress-20x | settled | astro-react-shadcn | pricingTabs | 30/30 | 0/30 | 128.0 | 192.0 | 0 |
| stress-20x | settled | astro-react-shadcn | pricingMonthly | 30/30 | 0/30 | 108.0 | 184.0 | 0 |
| stress-20x | settled | astro-react-shadcn | faqAccordion | 30/30 | 0/30 | 96.0 | 144.0 | 0 |
| stress-20x | settled | astro-react-shadcn | faqCollapse | 30/30 | 0/30 | 64.0 | 80.0 | 0 |
| stress-20x | settled | astro-react-shadcn | companySelect | 30/30 | 0/30 | 404.0 | 720.0 | 0 |
| stress-20x | settled | astro-react-shadcn | companyOption | 30/30 | 0/30 | 152.0 | 224.0 | 0 |
| stress-20x | settled | astro-react-shadcn | newsletterCheckbox | 30/30 | 0/30 | 64.0 | 96.0 | 0 |
| stress-20x | settled | astro-react-shadcn | newsletterUncheck | 30/30 | 0/30 | 48.0 | 64.0 | 0 |
| stress-20x | settled | nextjs-shadcn | navigation | 30/30 | 0/30 | 764.0 | 1128.0 | 0 |
| stress-20x | settled | nextjs-shadcn | navigationClose | 30/30 | 0/30 | 88.0 | 120.0 | 0 |
| stress-20x | settled | nextjs-shadcn | pricingTabs | 30/30 | 0/30 | 136.0 | 168.0 | 0 |
| stress-20x | settled | nextjs-shadcn | pricingMonthly | 30/30 | 0/30 | 112.0 | 136.0 | 0 |
| stress-20x | settled | nextjs-shadcn | faqAccordion | 30/30 | 0/30 | 104.0 | 128.0 | 0 |
| stress-20x | settled | nextjs-shadcn | faqCollapse | 30/30 | 0/30 | 56.0 | 72.0 | 0 |
| stress-20x | settled | nextjs-shadcn | companySelect | 30/30 | 0/30 | 428.0 | 544.0 | 0 |
| stress-20x | settled | nextjs-shadcn | companyOption | 30/30 | 0/30 | 152.0 | 192.0 | 0 |
| stress-20x | settled | nextjs-shadcn | newsletterCheckbox | 30/30 | 0/30 | 64.0 | 80.0 | 0 |
| stress-20x | settled | nextjs-shadcn | newsletterUncheck | 30/30 | 0/30 | 56.0 | 64.0 | 0 |

## Failed attempts

Wrong-target and missing-input attempts cannot establish a handler failure. They remain in the attempt totals and are separated from missing or late UI outcomes below.

| Profile | Scenario | Project | Control | No UI change | Too late | Wrong target | Missing input | Prerequisite failed | Harness errors |
|---|---|---|---|---:|---:|---:|---:|---:|---:|
| stress-20x | settled | astro-bui | navigationClose | 0 | 0 | 30 | 0 | 0 | 0 |
