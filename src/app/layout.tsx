import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Geist, Geist_Mono, Unbounded } from "next/font/google";
import { BackToTop } from "@/components/shell/BackToTop";
import { Cursor } from "@/components/shell/Cursor";
import { Footer } from "@/components/shell/Footer";
import { Header } from "@/components/shell/Header";
import { Loader } from "@/components/shell/Loader";
import { Motion } from "@/components/shell/Motion";
import { PageTransition } from "@/components/shell/PageTransition";
import { ScrollBar } from "@/components/shell/ScrollBar";
import { ThemeClock } from "@/components/shell/ThemeClock";
import { site } from "@/content/site";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-clock";
import "./globals.css";
import "./transitions.css";
import "./scrollbar.css";
import "./meet-link.css";
import "./site-menu.css";

const display = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-big-shoulders",
  display: "swap",
  // No metrics-matched fallback exists for this face; the CSS stack falls back to a narrow sans.
  adjustFontFallback: false,
});

const sans = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
/** Only used for the wide hero wordmark. */
const wide = Unbounded({ subsets: ["latin"], weight: ["900"], variable: "--font-unbounded", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  authors: [{ name: site.legalName, url: site.url }],
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
    { media: "(prefers-color-scheme: light)", color: "#dedede" },
  ],
};

/**
 * Runs before first paint so the theme never flashes: light 07:00 to 19:00
 * on the visitor's clock, dark otherwise, unless they picked one that is
 * still in force (see theme-clock.ts). It also flags
 * whether motion is allowed and whether the loader already played this session.
 * Static string written here, no user input: safe to inline.
 */
const bootScript = `(function(){try{${THEME_BOOT_SCRIPT}if(sessionStorage.getItem("op:loaded")==="1")d.classList.add("loaded");if(!matchMedia("(prefers-reduced-motion: reduce)").matches){d.classList.add("motion","pre-enter");setTimeout(function(){if(!window.__motionReady)d.classList.remove("motion","pre-enter")},4000)}}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      data-theme="dark"
      className={`${display.variable} ${sans.variable} ${mono.variable} ${wide.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <noscript>
          <style>{`.site-loader{display:none}`}</style>
        </noscript>
      </head>
      <body id="top">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10000] focus:bg-paper focus:px-6 focus:py-3 focus:font-semibold focus:text-ink"
        >
          Skip to main content
        </a>
        <Loader />
        <Cursor />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <BackToTop />
        <ScrollBar />
        <ThemeClock />
        <PageTransition />
        <Motion />
      </body>
    </html>
  );
}
