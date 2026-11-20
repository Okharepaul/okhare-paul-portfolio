"use client";

import { useEffect, useState } from "react";
import { Arrow } from "@/components/ui/primitives";
import { scrollToTarget } from "@/lib/scroll";

const SHOW_AFTER_PX = 300;

/** A small button that appears once the page has been scrolled; desktop only. */
export function BackToTop() {
  const [isShown, setIsShown] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => setIsShown(window.scrollY > SHOW_AFTER_PX);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      data-magnetic
      tabIndex={isShown ? 0 : -1}
      onClick={() => scrollToTarget(0)}
      className={`no-print fixed right-6 bottom-6 z-40 hidden border border-line bg-ink/80 p-3 text-paper backdrop-blur-sm transition-[opacity,translate,color,background-color] duration-300 hover:bg-paper hover:text-ink md:right-8 md:block ${
        isShown ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
      }`}
    >
      <Arrow direction="up" className="size-4!" />
    </button>
  );
}
