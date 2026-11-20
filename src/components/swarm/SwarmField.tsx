"use client";

import { useEffect, useRef } from "react";
import { createSwarm, type Region, type Swarm, type SwarmStats } from "@/lib/swarm/engine";
import { parseRgb, prefersReducedMotion } from "@/lib/motion";
import { createSwarmRenderer } from "./renderer";

type Interaction = "hover" | "click" | "none";

interface SwarmFieldProps {
  points?: number;
  zones?: number;
  seed?: number;
  /** Where delivery points may land, as fractions of the canvas. */
  region?: Region;
  /** Used instead of `region` on narrow screens, where the layout stacks. */
  compactRegion?: Region;
  /** hover: passing over a stop blocks it. click: clicking near a stop blocks it. */
  interaction?: Interaction;
  showLattice?: boolean;
  className?: string;
  onStats?: (stats: SwarmStats) => void;
}

const MAX_DPR = 2;
const HOVER_RADIUS = 20;
const CLICK_RADIUS = 40;
const HOVER_INTERVAL_MS = 140;
const STATS_INTERVAL_MS = 250;
/** With reduced motion we show one frame of a swarm that has been flying for a while. */
const STILL_FRAME_STEPS = 260;
const COMPACT_BELOW_PX = 768;

/**
 * SwarmField: delivery points are split into zones with spectral clustering,
 * one drone flies a planned route through each zone, and blocking a stop makes
 * its drone re-route. Pauses when off-screen or when the tab is hidden.
 */
export function SwarmField({
  points = 48,
  zones = 5,
  seed = 2025,
  region,
  compactRegion,
  interaction = "hover",
  showLattice = true,
  className = "",
  onStats,
}: SwarmFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onStatsRef = useRef(onStats);

  useEffect(() => {
    onStatsRef.current = onStats;
  }, [onStats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const renderer = createSwarmRenderer(canvas, showLattice);
    if (!renderer) return;

    const still = prefersReducedMotion();
    let swarm: Swarm | null = null;
    let frame = 0;
    let previous = 0;
    let lastStats = 0;
    let lastHover = 0;
    let isVisible = true;
    let wasCompact: boolean | null = null;

    const readColors = (): void => {
      const style = getComputedStyle(canvas);
      renderer.setColors({ fg: parseRgb(style.color), accent: parseRgb(style.caretColor) });
    };

    const render = (now: number): void => {
      if (!swarm) return;
      if (!still) swarm.step((now - previous) / 1000);
      previous = now;
      renderer.draw(swarm, now / 1000);
      if (now - lastStats > STATS_INTERVAL_MS) {
        lastStats = now;
        onStatsRef.current?.({ ...swarm.stats });
      }
    };

    const loop = (now: number): void => {
      render(now);
      frame = window.requestAnimationFrame(loop);
    };

    const start = (): void => {
      window.cancelAnimationFrame(frame);
      if (still || !isVisible || document.hidden) return;
      previous = performance.now();
      frame = window.requestAnimationFrame(loop);
    };

    const measure = (): void => {
      const { clientWidth: width, clientHeight: height } = host;
      if (width === 0 || height === 0) return;
      renderer.resize(width, height, Math.min(window.devicePixelRatio || 1, MAX_DPR));
      const isCompact = Boolean(compactRegion) && width < COMPACT_BELOW_PX;
      // Crossing the breakpoint (rotation, window drag) changes where points may sit: deal them again.
      if (swarm && isCompact === wasCompact) {
        swarm.resize(width, height);
      } else {
        wasCompact = isCompact;
        swarm = createSwarm({ points, zones, seed, width, height, region: isCompact ? compactRegion : region });
        if (still) for (let i = 0; i < STILL_FRAME_STEPS; i += 1) swarm.step(0.05);
      }
      readColors();
      if (still) render(performance.now());
    };

    const local = (event: PointerEvent | MouseEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const handleMove = (event: PointerEvent): void => {
      const { x, y } = local(event);
      renderer.setPointer(x, y);
      if (interaction !== "hover" || event.pointerType !== "mouse") return;
      const now = performance.now();
      if (now - lastHover < HOVER_INTERVAL_MS) return;
      lastHover = now;
      swarm?.blockAt(x, y, HOVER_RADIUS);
    };

    const handleLeave = (): void => renderer.clearPointer();

    const handleClick = (event: MouseEvent): void => {
      const { x, y } = local(event);
      swarm?.blockAt(x, y, CLICK_RADIUS);
      if (still) render(performance.now());
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(host);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      start();
    });
    visibilityObserver.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      readColors();
      if (still) render(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    measure();
    start();
    document.addEventListener("visibilitychange", start);
    if (interaction !== "none") {
      host.addEventListener("pointermove", handleMove, { passive: true });
      host.addEventListener("pointerleave", handleLeave);
    }
    if (interaction === "click") host.addEventListener("click", handleClick);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", start);
      host.removeEventListener("pointermove", handleMove);
      host.removeEventListener("pointerleave", handleLeave);
      host.removeEventListener("click", handleClick);
      renderer.dispose();
    };
  }, [points, zones, seed, region, compactRegion, interaction, showLattice]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`block size-full text-fg caret-accent ${className}`} />;
}
