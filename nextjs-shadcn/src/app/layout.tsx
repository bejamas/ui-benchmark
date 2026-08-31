import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import "@fontsource-variable/geist";
import "./globals.css";

export const metadata: Metadata = {
  title: "Acme Corp — Next.js + shadcn Benchmark",
  description:
    "Marketing page benchmark: Next.js + shadcn/ui + Radix UI primitives",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-['Geist_Variable',system-ui,sans-serif] antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
