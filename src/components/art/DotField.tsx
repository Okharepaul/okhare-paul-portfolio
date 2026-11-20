"use client";

import { useEffect, useRef } from "react";
import { DOT_CELL_PX, bayer8, blobDensity, hash2, valueNoise, type DotBlob } from "@/lib/dots";
import { prefersReducedMotion } from "@/lib/motion";

interface DotFieldProps {
  /** Soft clusters; leave empty for an even scatter. */
  blobs?: readonly DotBlob[];
  /** Density everywhere, 0..1. A little gives a thin scatter of single dots. */
  base?: number;
  /** Share of dots drawn in the accent colour, 0..1. */
  accent?: number;
  seed?: number;
  className?: string;
}

const FRAME_MS = 1000 / 24;
const NOISE_SCALE = 0.07;
const MAX_LIGHT = 0.6;
const NO_BLOBS: readonly DotBlob[] = [];

/**
 * A drifting field of the hero's dots, for the quieter sections. Density comes
 * from soft clusters plus slow noise and is turned into dots with the same
 * 8×8 ordered dither as the hero. Decorative: it sits behind content, ignores
 * the pointer, pauses off-screen and holds still with reduced motion.
 */
export function DotField({ blobs = NO_BLOBS, base = 0, accent = 0.1, seed = 1, className = "" }: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const isStill = prefersReducedMotion();
    let columns = 0;
    let rows = 0;
    /** Density per cell before noise; cells at zero are never drawn. */
    let envelope = new Float32Array(0);
    let frame = 0;
    let lastDrawn = 0;
    let isVisible = false;
    let colors = { paper: "", accent: "" };

    /** Colours only change with the theme, so they are read then, not on every frame. */
    const readColors = (): void => {
      const style = getComputedStyle(canvas);
      colors = { paper: style.color, accent: style.caretColor };
    };

    const measure = (): void => {
      const { clientWidth: width, clientHeight: height } = canvas;
      if (width === 0 || height === 0) return;
      // Dots are blocky by design, so CSS-pixel resolution is enough.
      canvas.width = width;
      canvas.height = height;
      columns = Math.ceil(width / DOT_CELL_PX);
      rows = Math.ceil(height / DOT_CELL_PX);
      envelope = Float32Array.from({ length: columns * rows }, (_, i) => {
        const x = ((i % columns) + 0.5) * DOT_CELL_PX;
        const y = (Math.floor(i / columns) + 0.5) * DOT_CELL_PX;
        return Math.min(1, base + blobDensity(blobs, x, y, width, height));
      });
    };

    const draw = (now: number): void => {
      if (columns === 0) return;
      const time = now / 1000;
      const paper = new Path2D();
      const orange = new Path2D();

      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const density = envelope[row * columns + column];
          if (density < 0.01) continue;
          const drift =
            0.6 * valueNoise(column * NOISE_SCALE + time * 0.05, row * NOISE_SCALE - time * 0.03, seed) +
            0.4 * valueNoise(column * NOISE_SCALE * 2.3 - time * 0.04, row * NOISE_SCALE * 2.3 + time * 0.025, seed + 7);
          // Capped below 1 so even the heart of a cluster keeps gaps and reads as dither, not a block.
          const light = Math.min(MAX_LIGHT, density * (0.08 + 1.05 * drift));
          if (light <= bayer8(column, row)) continue;
          const size = DOT_CELL_PX * (0.3 + 0.5 * Math.min(1, light));
          const offset = (DOT_CELL_PX - size) / 2;
          const path = hash2(column, row, seed) < accent ? orange : paper;
          path.rect(column * DOT_CELL_PX + offset, row * DOT_CELL_PX + offset, size, size);
        }
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = colors.paper;
      context.fill(paper);
      context.fillStyle = colors.accent;
      context.fill(orange);
    };

    const loop = (now: number): void => {
      if (now - lastDrawn >= FRAME_MS) {
        lastDrawn = now;
        draw(now);
      }
      frame = window.requestAnimationFrame(loop);
    };

    const start = (): void => {
      window.cancelAnimationFrame(frame);
      if (isStill || !isVisible || document.hidden) return;
      frame = window.requestAnimationFrame(loop);
    };

    const redraw = (): void => {
      measure();
      draw(lastDrawn);
    };

    const resizeObserver = new ResizeObserver(redraw);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      start();
    });
    visibilityObserver.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      readColors();
      draw(lastDrawn);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("visibilitychange", start);

    readColors();
    redraw();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", start);
    };
  }, [accent, base, blobs, seed]);

  return <canvas ref={canvasRef} aria-hidden="true" className={`no-print pointer-events-none block text-paper caret-accent ${className}`} />;
}
