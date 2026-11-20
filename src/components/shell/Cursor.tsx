"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

/**
 * A dot and a lagging reticle replace the pointer on mouse devices.
 * Any element opts in with data attributes, without touching this file:
 *   data-cursor="View"   the reticle grows and shows the word
 *   data-magnetic        the element leans towards the pointer
 * Touch devices and reduced-motion visitors keep the system cursor.
 */
export function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    const label = labelRef.current;
    if (!ring || !dot || !label || !hasFinePointer() || prefersReducedMotion()) return;

    const root = document.documentElement;
    root.classList.add("has-cursor");
    gsap.set([ring, dot], { opacity: 1 });

    const ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.08 });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.08 });
    let magnet: Element | null = null;

    const handleMove = (event: PointerEvent): void => {
      ringX(event.clientX);
      ringY(event.clientY);
      dotX(event.clientX);
      dotY(event.clientY);
      if (!magnet) return;
      const rect = magnet.getBoundingClientRect();
      gsap.to(magnet, {
        x: 0.28 * (event.clientX - (rect.left + rect.width / 2)),
        y: 0.38 * (event.clientY - (rect.top + rect.height / 2)),
        duration: 0.5,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const handleOver = (event: PointerEvent): void => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const labelled = target.closest<HTMLElement>("[data-cursor]");
      const interactive = target.closest('a, button, [role="button"], input, textarea, select, label');
      label.textContent = labelled?.dataset.cursor ?? "";
      ring.dataset.state = labelled ? "label" : interactive ? "hover" : "";

      const nextMagnet = target.closest("[data-magnetic]");
      if (nextMagnet === magnet) return;
      if (magnet) gsap.to(magnet, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
      magnet = nextMagnet;
    };

    const handleDown = (): gsap.core.Tween => gsap.to(ring, { scale: 0.8, duration: 0.15 });
    const handleUp = (): gsap.core.Tween => gsap.to(ring, { scale: 1, duration: 0.3 });
    const handleLeave = (): gsap.core.Tween => gsap.to([ring, dot], { opacity: 0, duration: 0.2 });
    const handleEnter = (): gsap.core.Tween => gsap.to([ring, dot], { opacity: 1, duration: 0.2 });

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerover", handleOver);
    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);
    root.addEventListener("pointerleave", handleLeave);
    root.addEventListener("pointerenter", handleEnter);
    return () => {
      if (magnet) gsap.set(magnet, { x: 0, y: 0 });
      root.classList.remove("has-cursor");
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleOver);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
      root.removeEventListener("pointerleave", handleLeave);
      root.removeEventListener("pointerenter", handleEnter);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} aria-hidden="true" className="cursor-ring no-print pointer-events-none fixed top-0 left-0 z-[90] opacity-0">
        <div className="cursor-ring-inner">
          <span ref={labelRef} className="cursor-label" />
        </div>
      </div>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="no-print pointer-events-none fixed top-0 left-0 z-[91] -mt-[3px] -ml-[3px] size-1.5 bg-[#dedede] opacity-0 mix-blend-difference"
      />
    </>
  );
}
