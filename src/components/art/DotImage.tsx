"use client";

import { useEffect, useRef } from "react";
import { DOT_CELL_PX, bayer8, cellReveal, clamp01, hash2, valueNoise } from "@/lib/dots";
import { prefersReducedMotion } from "@/lib/motion";

interface DotImageProps {
  /** A cut-out image (transparent background) in /public. */
  src: string;
  /** Read out by screen readers in place of the picture. */
  label: string;
  /** Paint the picture in the page's foreground colour, using only its transparency. */
  isTinted?: boolean;
  className?: string;
}

const MAX_DPR = 2;
/** The picture starts to appear when its top is this far down the viewport, and is whole by `REVEAL_END`. */
const REVEAL_START = 0.95;
const REVEAL_END = 0.35;
/** Cells below this opacity are empty space and get no dot. */
const MIN_ALPHA = 14;
/** Share of the dots that flash in the accent colour as they first appear. */
const SPARK_SHARE = 0.3;
/** Share of the remaining distance covered per 60 Hz frame as the reveal catches up with scroll. */
const EASE_PER_FRAME = 0.14;
const FRAME_MS = 1000 / 60;
const MAX_STEP_MS = 50;

interface Cell {
  x: number;
  y: number;
  /** 0..1: when this cell starts to appear. */
  order: number;
  fill: string;
  isSpark: boolean;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/**
 * A picture that arrives out of the hero's dots. As it scrolls into view each
 * cell of a 9px lattice grows from a speck into a square of the picture's
 * colour, then gives way to the picture itself; the order is an 8×8 ordered
 * dither broken up with noise, so it resolves in drifts rather than rows.
 * Scrolling back up runs it in reverse. With reduced motion it is simply shown.
 */
export function DotImage({ src, label, isTinted = false, className = "" }: DotImageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const picture = document.createElement("canvas");
    const pictureContext = picture.getContext("2d");
    const sample = document.createElement("canvas");
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    if (!host || !canvas || !context || !pictureContext || !sampleContext) return;

    const isStill = prefersReducedMotion();
    let image: HTMLImageElement | null = null;
    let cells: Cell[] = [];
    let cellSize = DOT_CELL_PX;
    let shown = isStill ? 1 : 0;
    let target = shown;
    let frame = 0;
    let lastFrame = 0;
    let isVisible = false;
    let isDisposed = false;
    /** Read when the picture is painted (mount, resize, theme change), not on every frame. */
    let accent = "";

    const render = (): void => {
      const { width, height } = canvas;
      if (width === 0 || height === 0 || !image) return;
      context.clearRect(0, 0, width, height);
      context.drawImage(picture, 0, 0);
      if (shown >= 1) return;

      cells.forEach((cell) => {
        const reveal = cellReveal(shown, cell.order);
        if (reveal >= 1) return;
        context.clearRect(cell.x, cell.y, cellSize, cellSize);
        const size = cellSize * (0.16 + 0.84 * reveal);
        const inset = (cellSize - size) / 2;
        context.globalAlpha = 0.35 + 0.65 * reveal;
        context.fillStyle = cell.isSpark && reveal > 0 && reveal < 0.45 ? accent : cell.fill;
        context.fillRect(cell.x + inset, cell.y + inset, size, size);
      });
      context.globalAlpha = 1;
    };

    /** Lay the picture out ("contain", centred) and read one colour per dot cell. */
    const paint = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.round(host.clientWidth * dpr);
      const height = Math.round(host.clientHeight * dpr);
      if (width === 0 || height === 0 || !image) return;
      const style = getComputedStyle(host);
      accent = style.caretColor;
      [canvas, picture].forEach((surface) => {
        surface.width = width;
        surface.height = height;
      });

      const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
      const drawnWidth = image.naturalWidth * scale;
      const drawnHeight = image.naturalHeight * scale;
      pictureContext.clearRect(0, 0, width, height);
      pictureContext.globalCompositeOperation = "source-over";
      pictureContext.drawImage(image, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
      if (isTinted) {
        pictureContext.globalCompositeOperation = "source-in";
        pictureContext.fillStyle = style.color;
        pictureContext.fillRect(0, 0, width, height);
        pictureContext.globalCompositeOperation = "source-over";
      }

      // Whole device pixels, so clearing a cell never leaves a hairline of the picture behind.
      cellSize = Math.round(DOT_CELL_PX * dpr);
      const columns = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      sample.width = columns;
      sample.height = rows;
      sampleContext.clearRect(0, 0, columns, rows);
      sampleContext.drawImage(picture, 0, 0, columns * cellSize, rows * cellSize, 0, 0, columns, rows);
      const pixels = sampleContext.getImageData(0, 0, columns, rows).data;

      cells = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const i = (row * columns + column) * 4;
          const alpha = pixels[i + 3];
          if (alpha < MIN_ALPHA) continue;
          cells.push({
            x: column * cellSize,
            y: row * cellSize,
            order: 0.55 * bayer8(column, row) + 0.45 * valueNoise(column * 0.09, row * 0.09, 3),
            fill: `rgba(${pixels[i]}, ${pixels[i + 1]}, ${pixels[i + 2]}, ${(alpha / 255).toFixed(3)})`,
            isSpark: hash2(column, row, 5) < SPARK_SHARE,
          });
        }
      }
      render();
    };

    const tick = (now: number): void => {
      // Eased by elapsed time, so the reveal takes as long on a 144 Hz screen as on a 60 Hz one.
      const frames = lastFrame === 0 ? 1 : Math.min(now - lastFrame, MAX_STEP_MS) / FRAME_MS;
      lastFrame = now;
      shown += (target - shown) * (1 - Math.pow(1 - EASE_PER_FRAME, frames));
      if (Math.abs(target - shown) < 0.002) shown = target;
      render();
      if (shown === target) {
        frame = 0;
        lastFrame = 0;
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    /** Progress follows the picture's position on screen, so it works inside pinned sections too. */
    const follow = (): void => {
      if (isStill || !isVisible) return;
      const viewport = window.innerHeight;
      const top = host.getBoundingClientRect().top;
      target = clamp01((viewport * REVEAL_START - top) / (viewport * (REVEAL_START - REVEAL_END)));
      if (frame === 0 && target !== shown) frame = window.requestAnimationFrame(tick);
    };

    const resizeObserver = new ResizeObserver(() => {
      paint();
      follow();
    });
    resizeObserver.observe(host);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      follow();
    });
    visibilityObserver.observe(host);
    const themeObserver = new MutationObserver(paint);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("scroll", follow, { passive: true });

    loadImage(src).then((loaded) => {
      if (isDisposed || !loaded) return;
      image = loaded;
      paint();
      follow();
    });

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("scroll", follow);
    };
  }, [isTinted, src]);

  return (
    <div ref={hostRef} role="img" aria-label={label} className={`relative text-paper caret-accent ${className}`}>
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />
    </div>
  );
}
