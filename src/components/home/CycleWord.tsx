"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";
import { onSiteReady } from "@/lib/ready";

interface CycleWordProps {
  words: readonly string[];
  className?: string;
}

const HOLD_SECONDS = 2.2;
const SWAP_SECONDS = 0.8;

/**
 * The word after "Building," — swaps every few seconds. All words share one
 * grid cell, so the line never changes width. With reduced motion the first
 * word simply stays.
 */
export function CycleWord({ words, className = "" }: CycleWordProps) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-word]", rootRef.current);
      if (items.length < 2) return;

      gsap.set(items, { yPercent: 115, visibility: "visible" });
      const timeline = gsap.timeline({ repeat: -1, paused: true });
      items.forEach((item, i) => {
        const next = items[(i + 1) % items.length];
        timeline
          .to(item, { yPercent: -115, duration: SWAP_SECONDS, ease: "expo.inOut" }, `+=${HOLD_SECONDS}`)
          .fromTo(next, { yPercent: 115 }, { yPercent: 0, duration: SWAP_SECONDS, ease: "expo.inOut" }, "<");
      });

      // Arrives just after the first line's letters, with the same curve.
      const intro = gsap.to(items[0], { yPercent: 0, duration: 1.15, ease: "expo.out", delay: 0.18, paused: true });
      intro.eventCallback("onComplete", () => {
        timeline.play();
      });
      onSiteReady(() => intro.play());
    },
    { scope: rootRef },
  );

  return (
    <span
      ref={rootRef}
      aria-hidden="true"
      className={`-mt-[0.14em] grid overflow-hidden pt-[0.14em] pb-[0.06em] whitespace-nowrap ${className}`}
    >
      {words.map((word, i) => (
        <span key={word} data-word className={`col-start-1 row-start-1 ${i === 0 ? "" : "invisible"}`}>
          {word}
        </span>
      ))}
    </span>
  );
}
