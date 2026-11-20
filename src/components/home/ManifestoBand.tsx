"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { hero } from "@/content/home";
import { PixelFigure } from "@/components/art/PixelFigure";
import { prefersReducedMotion } from "@/lib/motion";
import { getLenis } from "@/lib/scroll";

const WORDS = hero.cycle.map((word) => word.replace(/\.$/, ""));
/** Each half holds the words twice, so one half always covers a wide screen. */
const HALF = [...WORDS, ...WORDS];

const BASE_SPEED = 0.6;
const MAX_BOOST = 18;
const MAX_SKEW = 12;

/**
 * The band of giant scrolling words. Scroll velocity is read every frame: it
 * speeds the band up, skews it and sets its direction. The content is doubled
 * so it loops without a seam. With reduced motion it simply sits still.
 */
export function ManifestoBand() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;

    let offset = 0;
    let skew = 0;
    let direction = -1;

    const tick = (): void => {
      const half = track.scrollWidth / 2;
      const velocity = getLenis()?.velocity ?? 0;
      if (velocity !== 0) direction = velocity > 0 ? -1 : 1;
      offset += direction * (BASE_SPEED + Math.min(0.5 * Math.abs(velocity), MAX_BOOST));
      if (offset <= -half) offset += half;
      if (offset > 0) offset -= half;
      skew += 0.12 * (Math.max(-MAX_SKEW, Math.min(MAX_SKEW, 0.6 * velocity)) - skew);
      track.style.transform = `translate3d(${offset}px,0,0) skewX(${skew}deg)`;
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, []);

  return (
    <section aria-label={WORDS.join(", ")} data-enter="none" className="relative overflow-hidden border-y border-line">
      <PixelFigure art="noise" label="" mode="none" reveal={false} className="absolute! inset-0" canvasClassName="opacity-35" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink via-ink/40 to-ink" />
      <div className="relative py-10 md:py-16">
        <div ref={trackRef} aria-hidden="true" className="flex w-max will-change-transform">
          {[0, 1].map((half) => (
            <div key={half} className="flex shrink-0 items-center">
              {HALF.map((word, i) => (
                <span key={`${word}-${i}`} className={`display flex items-center text-[clamp(4rem,13vw,13rem)] ${i % 2 === 1 ? "text-outline" : ""}`}>
                  <span>{word}</span>
                  <span className="mx-6 font-mono text-[0.18em] text-accent [-webkit-text-stroke:0] md:mx-10">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="label mx-auto mt-6 max-w-md px-4 text-center text-paper/70">{hero.tagline}</p>
      </div>
    </section>
  );
}
