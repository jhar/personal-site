import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { THEME_INIT_SCRIPT } from "@/components/ThemeToggle";
import VisitTracker from "@/components/VisitTracker";
import "./globals.css";

// Dekalog theme fonts; the classic theme keeps the original system stacks.
const bodoni = Bodoni_Moda({ subsets: ["latin"], variable: "--font-bodoni" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost" });

export const metadata: Metadata = {
  title: "Justin Harrison",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script sets data-theme before React hydrates, so the attribute may differ.
    <html
      lang="en"
      className={`${bodoni.variable} ${jost.variable} bg-page text-ink font-body h-full w-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="h-full w-full">
        <VisitTracker />
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
