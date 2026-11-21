"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { pad2 } from "@/content/projects";
import { prefersReducedMotion } from "@/lib/motion";

type CountUpProps = {
  value: number;
  className?: string;
  /** What a screen reader hears, once, when the count settles, e.g. "12 parts in your build". */
  announce: string;
};

/**
 * A count, in two digits, that runs to its new value whenever it changes. The
 * moving figure is for the eye only; a screen reader hears `announce`.
 */
export function CountUp({ value, className = "", announce }: CountUpProps) {
  const figureRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(value);
  // React writes the figure once; after that the count below owns its text, so a new value is never shown
  // whole for a frame before the count towards it begins.
  const [firstText] = useState(() => pad2(value));

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    if (prefersReducedMotion() || shownRef.current === value) {
      shownRef.current = value;
      figure.textContent = pad2(value);
      return;
    }
    const counter = { value: shownRef.current };
    const tween = gsap.to(counter, {
      value,
      duration: 0.6,
      ease: "power3.out",
      onUpdate: () => {
        shownRef.current = counter.value;
        figure.textContent = pad2(Math.round(counter.value));
      },
      onComplete: () => {
        shownRef.current = value;
        figure.textContent = pad2(value);
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span className={className}>
      <span ref={figureRef} aria-hidden="true" className="tabular-nums">
        {firstText}
      </span>
      <span role="status" className="sr-only">
        {announce}
      </span>
    </span>
  );
}
