# Interaction benchmark

Measured 2026-09-25T20:49:03.072Z with Chrome 153.0.8010.53.

CPU profiles: baseline-4x = 4×; stress-20x = 20×.

Scripted lab results, not field INP. Timing percentiles include successful, reported interactions only. Read failures and missing timings alongside them.

| Profile | Scenario | Project | Control | Success | Before load | Median ms | p90 ms | Unreported |
|---|---|---|---|---|---|---:|---:|---:|
| baseline-4x | settled | astro-bui | navigation | 3/3 | 0/3 | 64.0 | 64.0 | 0 |
| baseline-4x | settled | astro-bui | navigationClose | 3/3 | 0/3 | 24.0 | 24.0 | 0 |
| baseline-4x | settled | astro-bui | pricingTabs | 3/3 | 0/3 | 24.0 | 24.0 | 0 |
| baseline-4x | settled | astro-bui | pricingMonthly | 3/3 | 0/3 | 16.0 | 16.0 | 2 |
| baseline-4x | settled | astro-bui | faqAccordion | 3/3 | 0/3 | 16.0 | 16.0 | 1 |
| baseline-4x | settled | astro-bui | faqCollapse | 3/3 | 0/3 | 16.0 | 16.0 | 2 |
| baseline-4x | settled | astro-bui | companySelect | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | astro-bui | companyOption | 3/3 | 0/3 | 16.0 | 16.0 | 2 |
| baseline-4x | settled | astro-bui | newsletterCheckbox | 3/3 | 0/3 | 16.0 | 16.0 | 2 |
| baseline-4x | settled | astro-bui | newsletterUncheck | 3/3 | 0/3 | unreported | unreported | 3 |
| baseline-4x | settled | astro-react-shadcn | navigation | 3/3 | 0/3 | 80.0 | 96.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | navigationClose | 3/3 | 0/3 | 24.0 | 56.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | pricingTabs | 3/3 | 0/3 | 32.0 | 56.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | pricingMonthly | 3/3 | 0/3 | 16.0 | 24.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | faqAccordion | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | faqCollapse | 3/3 | 0/3 | unreported | unreported | 3 |
| baseline-4x | settled | astro-react-shadcn | companySelect | 3/3 | 0/3 | 16.0 | 16.0 | 1 |
| baseline-4x | settled | astro-react-shadcn | companyOption | 3/3 | 0/3 | 32.0 | 32.0 | 0 |
| baseline-4x | settled | astro-react-shadcn | newsletterCheckbox | 3/3 | 0/3 | 16.0 | 16.0 | 2 |
| baseline-4x | settled | astro-react-shadcn | newsletterUncheck | 3/3 | 0/3 | 16.0 | 16.0 | 1 |
| baseline-4x | settled | nextjs-shadcn | navigation | 3/3 | 0/3 | 80.0 | 88.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | navigationClose | 3/3 | 0/3 | 24.0 | 24.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | pricingTabs | 3/3 | 0/3 | 32.0 | 32.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | pricingMonthly | 3/3 | 0/3 | 24.0 | 24.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | faqAccordion | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | faqCollapse | 3/3 | 0/3 | 16.0 | 16.0 | 2 |
| baseline-4x | settled | nextjs-shadcn | companySelect | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | companyOption | 3/3 | 0/3 | 32.0 | 32.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | newsletterCheckbox | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| baseline-4x | settled | nextjs-shadcn | newsletterUncheck | 3/3 | 0/3 | 16.0 | 16.0 | 0 |
| stress-20x | settled | astro-bui | navigation | 3/3 | 0/3 | 288.0 | 336.0 | 0 |
| stress-20x | settled | astro-bui | navigationClose | 3/3 | 0/3 | 80.0 | 136.0 | 0 |
| stress-20x | settled | astro-bui | pricingTabs | 3/3 | 0/3 | 96.0 | 104.0 | 0 |
| stress-20x | settled | astro-bui | pricingMonthly | 3/3 | 0/3 | 64.0 | 72.0 | 0 |
| stress-20x | settled | astro-bui | faqAccordion | 3/3 | 0/3 | 80.0 | 96.0 | 0 |
| stress-20x | settled | astro-bui | faqCollapse | 3/3 | 0/3 | 64.0 | 72.0 | 0 |
| stress-20x | settled | astro-bui | companySelect | 3/3 | 0/3 | 104.0 | 120.0 | 0 |
| stress-20x | settled | astro-bui | companyOption | 3/3 | 0/3 | 88.0 | 96.0 | 0 |
| stress-20x | settled | astro-bui | newsletterCheckbox | 3/3 | 0/3 | 48.0 | 48.0 | 0 |
| stress-20x | settled | astro-bui | newsletterUncheck | 3/3 | 0/3 | 32.0 | 40.0 | 0 |
| stress-20x | settled | astro-react-shadcn | navigation | 3/3 | 0/3 | 512.0 | 528.0 | 0 |
| stress-20x | settled | astro-react-shadcn | navigationClose | 3/3 | 0/3 | 152.0 | 168.0 | 0 |
| stress-20x | settled | astro-react-shadcn | pricingTabs | 3/3 | 0/3 | 176.0 | 176.0 | 0 |
| stress-20x | settled | astro-react-shadcn | pricingMonthly | 3/3 | 0/3 | 136.0 | 152.0 | 0 |
| stress-20x | settled | astro-react-shadcn | faqAccordion | 3/3 | 0/3 | 88.0 | 112.0 | 0 |
| stress-20x | settled | astro-react-shadcn | faqCollapse | 3/3 | 0/3 | 64.0 | 80.0 | 0 |
| stress-20x | settled | astro-react-shadcn | companySelect | 3/3 | 0/3 | 56.0 | 64.0 | 0 |
| stress-20x | settled | astro-react-shadcn | companyOption | 3/3 | 0/3 | 256.0 | 296.0 | 0 |
| stress-20x | settled | astro-react-shadcn | newsletterCheckbox | 3/3 | 0/3 | 88.0 | 96.0 | 0 |
| stress-20x | settled | astro-react-shadcn | newsletterUncheck | 3/3 | 0/3 | 64.0 | 64.0 | 0 |
| stress-20x | settled | nextjs-shadcn | navigation | 3/3 | 0/3 | 792.0 | 800.0 | 0 |
| stress-20x | settled | nextjs-shadcn | navigationClose | 3/3 | 0/3 | 152.0 | 176.0 | 0 |
| stress-20x | settled | nextjs-shadcn | pricingTabs | 3/3 | 0/3 | 192.0 | 200.0 | 0 |
| stress-20x | settled | nextjs-shadcn | pricingMonthly | 3/3 | 0/3 | 136.0 | 152.0 | 0 |
| stress-20x | settled | nextjs-shadcn | faqAccordion | 3/3 | 0/3 | 80.0 | 88.0 | 0 |
| stress-20x | settled | nextjs-shadcn | faqCollapse | 3/3 | 0/3 | 64.0 | 72.0 | 0 |
| stress-20x | settled | nextjs-shadcn | companySelect | 3/3 | 0/3 | 64.0 | 64.0 | 0 |
| stress-20x | settled | nextjs-shadcn | companyOption | 3/3 | 0/3 | 280.0 | 304.0 | 0 |
| stress-20x | settled | nextjs-shadcn | newsletterCheckbox | 3/3 | 0/3 | 80.0 | 88.0 | 0 |
| stress-20x | settled | nextjs-shadcn | newsletterUncheck | 3/3 | 0/3 | 64.0 | 64.0 | 0 |
