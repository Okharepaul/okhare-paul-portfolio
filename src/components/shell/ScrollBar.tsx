"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { onSiteReady } from "@/lib/ready";
import { getLenis, scrollToTarget } from "@/lib/scroll";
import { formatProgress, scrollForOffset, scrollGeometry, stretchFor, type ScrollGeometry } from "@/lib/scrollbar";

const MIN_THUMB_PX = 44;
/** The readout and the ticks stay this long after the page stops. */
const IDLE_MS = 1100;
/** How quickly the measured speed follows the real one, and the stretch follows the speed (per second). */
const SPEED_FOLLOW_RATE = 10;
const STRETCH_FOLLOW_RATE = 12;
/** The loop keeps running this long after the last movement, so the stretch can ease back. */
const SETTLE_MS = 250;
const SETTLED_STRETCH = 0.002;
/** The readout keeps at least this far above the bottom of the track, clear of the back-to-top button. */
const READOUT_CLEARANCE_PX = 64;
/** Longest step the loop will take, so a paused tab does not lurch when it comes back. */
const MAX_STEP_SECONDS = 0.1;

/** Set on <html> while this bar is mounted; the stylesheet hides the browser's bar only then. */
const OWN_SCROLLBAR_CLASS = "has-own-scrollbar";

type Drag = { pointerId: number; startY: number; startScroll: number };

/**
 * The site's own scroll bar, in place of the browser's. The thumb is an orange
 * bar riding the right-hand line of the frame that runs round every page; it
 * stretches when the page is thrown and eases back as it slows. While the page
 * moves, or the pointer is over it, a scale of ticks fills in beside it and a
 * readout says how far down the page is. On arrival a light sweeps down the
 * line and the thumb draws in.
 *
 * The thumb can be dragged and the line clicked. It is decoration as far as
 * assistive technology goes: the page still scrolls by keyboard, wheel and touch
 * as before. Every frame is written straight to the page, never through React.
 */
export function ScrollBar() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const digitsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    const readout = readoutRef.current;
    const digits = digitsRef.current;
    if (!root || !track || !thumb || !readout || !digits) return;

    const isStill = prefersReducedMotion();
    let trackHeight = track.clientHeight;
    let pageHeight = document.documentElement.scrollHeight;
    let geometry: ScrollGeometry = scrollGeometry({ trackHeight, viewportHeight: window.innerHeight, pageHeight, scroll: window.scrollY, minThumb: MIN_THUMB_PX });
    let frame = 0;
    let lastScroll = window.scrollY;
    let lastTime = performance.now();
    let lastMove = lastTime;
    let speed = 0;
    let stretch = 0;
    let idleTimer = 0;
    let drag: Drag | null = null;

    const paint = (): void => {
      geometry = scrollGeometry({ trackHeight, viewportHeight: window.innerHeight, pageHeight, scroll: window.scrollY, minThumb: MIN_THUMB_PX });
      root.dataset.scrollable = String(geometry.isScrollable);
      thumb.style.height = `${geometry.thumb}px`;
      // Anchored at the leading end, so a fast scroll leaves a tail behind the thumb.
      thumb.style.transformOrigin = speed >= 0 ? "50% 100%" : "50% 0%";
      thumb.style.transform = `translate3d(0, ${geometry.offset}px, 0) scaleY(${1 + stretch})`;
      const readoutY = Math.min(geometry.offset + geometry.thumb / 2, trackHeight - READOUT_CLEARANCE_PX);
      readout.style.transform = `translate3d(0, ${readoutY}px, 0)`;
      digits.textContent = formatProgress(geometry.progress);
      root.style.setProperty("--scroll-progress", geometry.progress.toFixed(4));
    };

    const step = (now: number): void => {
      frame = 0;
      const seconds = Math.min(Math.max((now - lastTime) / 1000, 0.001), MAX_STEP_SECONDS);
      lastTime = now;
      const scroll = window.scrollY;
      if (scroll !== lastScroll) lastMove = now;
      speed += ((scroll - lastScroll) / seconds - speed) * Math.min(1, SPEED_FOLLOW_RATE * seconds);
      lastScroll = scroll;
      const target = isStill || drag ? 0 : stretchFor(speed);
      stretch += (target - stretch) * Math.min(1, STRETCH_FOLLOW_RATE * seconds);
      if (now - lastMove < SETTLE_MS || stretch > SETTLED_STRETCH) {
        paint();
        frame = window.requestAnimationFrame(step);
        return;
      }
      speed = 0;
      stretch = 0;
      paint();
    };

    /** Shows the readout and runs the loop until the page has settled. */
    const wake = (): void => {
      root.dataset.active = "true";
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        if (!drag) root.dataset.active = "false";
      }, IDLE_MS);
      if (frame !== 0) return;
      // Measured afresh, so a jump made while the loop was asleep (a new page, a link to a section) is not read as speed.
      lastScroll = window.scrollY;
      lastTime = performance.now();
      lastMove = lastTime;
      frame = window.requestAnimationFrame(step);
    };

    const measure = (): void => {
      trackHeight = track.clientHeight;
      pageHeight = document.documentElement.scrollHeight;
      paint();
    };

    const scrollNow = (target: number): void => {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
      else window.scrollTo(0, target);
    };

    const handleDown = (event: PointerEvent): void => {
      if (event.button !== 0 || !geometry.isScrollable || getLenis()?.isStopped) return;
      const y = event.clientY - track.getBoundingClientRect().top;
      const isOnThumb = y >= geometry.offset && y <= geometry.offset + geometry.thumb;
      if (!isOnThumb) {
        // A click on the line glides there, with the thumb centred on the point.
        scrollToTarget(scrollForOffset(y - geometry.thumb / 2, geometry, trackHeight));
        wake();
        return;
      }
      // Only a drag keeps the browser from its own reaction (starting a text selection).
      event.preventDefault();
      drag = { pointerId: event.pointerId, startY: event.clientY, startScroll: window.scrollY };
      root.setPointerCapture(event.pointerId);
      root.dataset.dragging = "true";
      wake();
    };

    const endDrag = (pointerId: number): void => {
      drag = null;
      if (root.hasPointerCapture(pointerId)) root.releasePointerCapture(pointerId);
      delete root.dataset.dragging;
      wake();
    };

    const handleMove = (event: PointerEvent): void => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      // Something took the scroll away (the loader, a change of page): let go.
      if (getLenis()?.isStopped) {
        endDrag(event.pointerId);
        return;
      }
      // Worked out from the geometry as it is now, so a page that grows or shrinks mid-drag does not jump.
      const travel = trackHeight - geometry.thumb;
      if (travel <= 0) return;
      const target = drag.startScroll + ((event.clientY - drag.startY) * geometry.maxScroll) / travel;
      scrollNow(Math.min(geometry.maxScroll, Math.max(0, target)));
      wake();
    };

    const handleUp = (event: PointerEvent): void => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      endDrag(event.pointerId);
    };

    // The browser's own bar is hidden only once this one is in place (see scrollbar.css).
    document.documentElement.classList.add(OWN_SCROLLBAR_CLASS);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(track);
    resizeObserver.observe(document.body);
    const stopWaiting = onSiteReady(() => {
      measure();
      root.dataset.ready = "true";
    });

    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", measure);
    root.addEventListener("pointerdown", handleDown);
    root.addEventListener("pointermove", handleMove);
    root.addEventListener("pointerup", handleUp);
    root.addEventListener("pointercancel", handleUp);
    paint();

    return () => {
      stopWaiting();
      document.documentElement.classList.remove(OWN_SCROLLBAR_CLASS);
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
      window.clearTimeout(idleTimer);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", measure);
      root.removeEventListener("pointerdown", handleDown);
      root.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerup", handleUp);
      root.removeEventListener("pointercancel", handleUp);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" data-ready="false" data-active="false" data-scrollable="false" className="scrollbar no-print">
      <div ref={trackRef} className="scrollbar-track">
        <span className="scrollbar-ticks" />
        <span className="scrollbar-ticks scrollbar-ticks-passed" />
        <div ref={thumbRef} className="scrollbar-thumb" />
        <span ref={readoutRef} className="scrollbar-readout">
          <b ref={digitsRef}>000</b>%
        </span>
      </div>
    </div>
  );
}
