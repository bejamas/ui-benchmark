import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How is this different from shadcn/ui?",
    answer:
      "While inspired by shadcn/ui's copy-and-own approach, our components are built natively for Astro. They compile to pure HTML and CSS with zero React runtime overhead. Interactive components use lightweight data-slot primitives. The React demos use Base UI.",
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
      "JavaScript payload depends on the components and framework used. This benchmark measures the production output of the same page in all three implementations.",
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

export default function FAQAccordion() {
  return (
    <Accordion className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
