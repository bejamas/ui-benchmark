import { TooltipProvider } from "@/components/ui/tooltip";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

/* ─────────────────────────── Header / Nav ────────────────────────── */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <span className="text-xl font-bold tracking-tight">Acme</span>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Products</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Analytics
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Real-time dashboards and reporting
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Automation
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Workflow builders and integrations
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Security
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Enterprise-grade protection
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Integrations
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Connect your favorite tools
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Startups
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Move fast and ship faster
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Enterprise
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Scale with confidence
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          Agencies
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Deliver client projects
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <a
                        href="#"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          E-commerce
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Sell smarter online
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="#pricing"
              >
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                className={navigationMenuTriggerStyle()}
                href="#contact"
              >
                Contact
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <Button>Get Started</Button>
      </div>
    </header>
  );
}

/* ─────────────────────────── Hero ────────────────────────────────── */

function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 text-center">
      <Badge variant="secondary" className="mb-4">
        Now in public beta
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
        Build faster websites
        <br />
        without the bloat
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
        Ship marketing sites that load instantly. Zero unnecessary JavaScript,
        beautiful components, and the developer experience you love.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button size="lg">Start free trial</Button>
        <Button size="lg" variant="outline">
          View demo
        </Button>
      </div>
    </section>
  );
}

/* ────────────────────── Features with Tooltips ──────────────────── */

const features = [
  {
    title: "Zero-JS Components",
    description:
      "Ship HTML and CSS only. Interactive elements use lightweight primitives instead of framework runtimes.",
    tooltip: "Components compile to static HTML with no client-side hydration",
  },
  {
    title: "Instant Page Loads",
    description:
      "No JavaScript bundle to parse. Pages render immediately with perfect Lighthouse scores.",
    tooltip: "Typical score: 98-100 on PageSpeed Insights",
  },
  {
    title: "Accessible by Default",
    description:
      "Keyboard navigation, ARIA attributes, and screen reader support built into every component.",
    tooltip: "WCAG 2.1 AA compliant out of the box",
  },
  {
    title: "Copy & Own",
    description:
      "Components live in your codebase. No black-box dependencies, full control over every line.",
    tooltip: "Similar to shadcn/ui's approach but for Astro",
  },
  {
    title: "Tailwind v4 Native",
    description:
      "Built on the latest Tailwind CSS with CSS-first configuration and zero PostCSS plugins.",
    tooltip: "Uses @theme and CSS custom properties",
  },
  {
    title: "Rich Interactions",
    description:
      "Navigation menus, tooltips, hover cards, and more — all without React hydration overhead.",
    tooltip: "Uses data-slot primitives for behavior",
  },
];

function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
        Everything you need
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {feature.title}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                      ?
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{feature.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────── Pricing Tabs ───────────────────────────── */

function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
        Simple, transparent pricing
      </h2>
      <Tabs defaultValue="monthly" className="mx-auto max-w-3xl">
        <TabsList className="mx-auto grid w-[240px] grid-cols-2">
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="mt-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For personal projects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  $0<span className="text-sm font-normal">/mo</span>
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Get started
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Popular</Badge>
                </div>
                <CardDescription>For growing teams</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  $29<span className="text-sm font-normal">/mo</span>
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Get started</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">Custom</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Contact sales
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yearly" className="mt-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For personal projects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  $0<span className="text-sm font-normal">/yr</span>
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Get started
                </Button>
              </CardFooter>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pro</CardTitle>
                  <Badge>Save 20%</Badge>
                </div>
                <CardDescription>For growing teams</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  $278<span className="text-sm font-normal">/yr</span>
                </p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Get started</Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>For large organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">Custom</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant="outline">
                  Contact sales
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

/* ───────────────── Long-form text with HoverCards ────────────────── */

function RichTextSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24">
      <h2 className="mb-8 text-3xl font-bold tracking-tight">
        Why performance matters
      </h2>
      <div className="space-y-6 text-base leading-relaxed text-muted-foreground">
        <p>
          Modern marketing websites have become increasingly JavaScript-heavy.
          The average web page now ships over 500KB of JavaScript, and component
          libraries built on{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a
                href="#"
                className="font-medium text-foreground underline decoration-dotted underline-offset-4"
              >
                React
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">React</h4>
                <p className="text-sm text-muted-foreground">
                  A JavaScript library for building user interfaces. React alone
                  adds ~42KB (gzipped) to your bundle before any components.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>{" "}
          add significant overhead. Every component on the page needs to{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a
                href="#"
                className="font-medium text-foreground underline decoration-dotted underline-offset-4"
              >
                hydrate
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Hydration</h4>
                <p className="text-sm text-muted-foreground">
                  The process where the browser downloads JavaScript, parses it,
                  and attaches event listeners to server-rendered HTML. Even
                  static text paragraphs need hydration in React.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>{" "}
          — including static text content that never changes.
        </p>
        <p>
          This is particularly problematic for long-form content. Blog posts,
          landing pages, and documentation sites are content-first by nature,
          yet frameworks like Next.js require the full{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a
                href="#"
                className="font-medium text-foreground underline decoration-dotted underline-offset-4"
              >
                Virtual DOM
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Virtual DOM</h4>
                <p className="text-sm text-muted-foreground">
                  A programming concept where a virtual representation of the UI
                  is kept in memory and synced with the real DOM. This
                  reconciliation process has a cost proportional to the number
                  of nodes.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>{" "}
          runtime to reconcile every text node, heading, and paragraph. The more
          content on the page, the higher the cost.
        </p>
        <p>
          Consider a marketing page with a navigation menu, pricing tables,
          testimonials, and a contact form. In a traditional React setup, the
          browser must download, parse, and execute JavaScript for{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a
                href="#"
                className="font-medium text-foreground underline decoration-dotted underline-offset-4"
              >
                Radix UI primitives
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Radix UI</h4>
                <p className="text-sm text-muted-foreground">
                  A popular headless component library for React. Each primitive
                  (Dialog, Select, NavigationMenu, etc.) adds 5-30KB of
                  JavaScript to handle accessibility and interactions.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
          , state management, event delegation, and the component tree itself —
          even for sections that are purely presentational.
        </p>
        <p>
          The alternative is to use a server-first approach where components
          render to plain HTML by default. Interactive elements like{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a
                href="#"
                className="font-medium text-foreground underline decoration-dotted underline-offset-4"
              >
                navigation menus
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Navigation Menu</h4>
                <p className="text-sm text-muted-foreground">
                  A complex component requiring hover detection, keyboard
                  navigation, focus management, and animated transitions. In
                  Astro + data-slot, this costs ~3KB vs ~25KB in React + Radix.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>{" "}
          and tooltips use lightweight{" "}
          <HoverCard>
            <HoverCardTrigger asChild>
              <a
                href="#"
                className="font-medium text-foreground underline decoration-dotted underline-offset-4"
              >
                data-slot primitives
              </a>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">data-slot Primitives</h4>
                <p className="text-sm text-muted-foreground">
                  Vanilla JavaScript behavior modules that attach to HTML
                  elements via data attributes. No framework runtime needed —
                  just the bare minimum JS for interactivity.
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>{" "}
          that add only the JavaScript strictly necessary for behavior — no
          framework, no virtual DOM, no hydration.
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────── FAQ ────────────────────────────────── */

const faqs = [
  {
    question: "How is this different from shadcn/ui?",
    answer:
      "While inspired by shadcn/ui's copy-and-own approach, our components are built natively for Astro. They compile to pure HTML and CSS with zero React runtime overhead. Interactive components use lightweight data-slot primitives instead of Radix UI.",
  },
  {
    question: "Can I use this with React or Vue?",
    answer:
      "The components are designed for Astro's .astro file format. However, Astro supports islands architecture, so you can mix these components with React or Vue islands where you need complex client-side state.",
  },
  {
    question: "What about accessibility?",
    answer:
      "All interactive components include proper ARIA attributes, keyboard navigation, and focus management. The data-slot primitives handle accessibility patterns like roving tabindex, aria-expanded, and screen reader announcements.",
  },
  {
    question: "How does the JavaScript footprint compare?",
    answer:
      "A typical marketing page built with our components ships 5-15KB of JavaScript total. The same page with Next.js + shadcn/Radix typically ships 150-300KB. That's a 10-20x difference in JavaScript payload.",
  },
  {
    question: "Is this production-ready?",
    answer:
      "Yes. The component library is used in production on multiple Bejamas client projects and our own marketing sites. It's actively maintained with regular updates and security patches.",
  },
  {
    question: "How do I get started?",
    answer:
      "Run npx bejamas add to start adding components to your Astro project. Each component is copied into your codebase where you have full control to customize it.",
  },
];

function FAQSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-24">
      <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
        Frequently asked questions
      </h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/* ──────────────────────── Contact Form ───────────────────────────── */

function ContactSection() {
  return (
    <section id="contact" className="mx-auto max-w-xl px-4 py-24">
      <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
        Get in touch
      </h2>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">First name</Label>
              <Input id="first-name" placeholder="Jane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input id="last-name" placeholder="Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jane@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-size">Company size</Label>
            <Select>
              <SelectTrigger id="company-size">
                <SelectValue placeholder="Select team size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1–10 employees</SelectItem>
                <SelectItem value="11-50">11–50 employees</SelectItem>
                <SelectItem value="51-200">51–200 employees</SelectItem>
                <SelectItem value="201-500">201–500 employees</SelectItem>
                <SelectItem value="500+">500+ employees</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest">I&apos;m interested in</Label>
            <Select>
              <SelectTrigger id="interest">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Product demo</SelectItem>
                <SelectItem value="pricing">Custom pricing</SelectItem>
                <SelectItem value="migration">Migration support</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="other">Something else</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="newsletter" />
            <Label htmlFor="newsletter" className="text-sm font-normal">
              Send me product updates and tips
            </Label>
          </div>

          <Button className="w-full" size="lg">
            Send message
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

/* ──────────────────────────── Footer ─────────────────────────────── */

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <span className="text-lg font-bold">Acme</span>
            <p className="mt-2 text-sm text-muted-foreground">
              Build faster websites without the bloat.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Changelog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Documentation
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-foreground">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-foreground">
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="my-8" />
        <p className="text-center text-sm text-muted-foreground">
          &copy; 2026 Acme Corp. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ──────────────────────────── Page ───────────────────────────────── */

export default function MarketingPage() {
  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <SiteHeader />
        <main>
          <HeroSection />
          <FeaturesSection />
          <PricingSection />
          <RichTextSection />
          <FAQSection />
          <ContactSection />
        </main>
        <SiteFooter />
      </div>
    </TooltipProvider>
  );
}
