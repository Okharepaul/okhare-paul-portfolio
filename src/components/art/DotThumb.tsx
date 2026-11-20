"use client";

import { useEffect, useRef } from "react";
import { DOT_CELL_PX, bayer8, cellReveal, clamp01, halftoneShare, halftoneTones, hash2, luminance, valueNoise } from "@/lib/dots";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

type DotThumbProps = {
  /** A picture in /public. It fills the box, cropped from the centre. */
  src: string;
  /**
   * "hover": rests as dots and becomes the picture while the link around it is
   * hovered or has keyboard focus (on touch screens, while it is on screen).
   * "view": becomes the picture on scrolling into view, and breaks up again once it has left.
   * "manual": follows `isShown`, for a picture that some other element calls up.
   */
  mode: "hover" | "view" | "manual";
  /** "manual" only: true resolves the picture, false returns it to dots. */
  isShown?: boolean;
  className?: string;
};

const MAX_DPR = 2;
/** Share of resting dots drawn in the accent colour, as in the dot fields. */
const ACCENT_SHARE = 0.07;
/** Share of cells that flash in the accent colour as they start to open. */
const SPARK_SHARE = 0.22;
/** How much of the reveal is the wave crossing the picture; the rest is each cell opening. */
const SPREAD = 0.62;
/** How long the whole change takes, in either direction. */
const REVEAL_MS = 900;
const FRAME_MS = 1000 / 60;
/** A stalled tab should not finish the change in one jump. */
const MAX_STEP_MS = 50;
/** On touch screens a "hover" picture resolves once this much of it is on screen. */
const TOUCH_VISIBLE_SHARE = 0.6;
/** A "view" picture resolves once this much of it is on screen. */
const VIEW_VISIBLE_SHARE = 0.3;
/** The picture file is fetched once its box is within this distance of the screen. */
const LOAD_MARGIN = "900px";

interface Cell {
  x: number;
  y: number;
  /** 0..1: this cell's place in the order when nothing else decides it. */
  base: number;
  /** Side of the resting dot in device pixels; 0 where the dither leaves the cell empty. */
  rest: number;
  /** The picture's own colour here. */
  fill: string;
  isAccent: boolean;
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
 * A thumbnail made of the site's dots. At rest it is a halftone of the
 * picture on the 9px lattice, in the page's foreground colour with a few
 * orange dots; the dots draw whichever of the picture's tones is rarer, so it
 * stays mostly open ground.
 * As it resolves, a wave crosses it (from where the pointer came in, if there
 * is one): each dot swells into a square of the picture's colour and then
 * gives way to the picture itself. Leaving runs it backwards. Decorative: the
 * link around it names the project.
 */
export function DotThumb({ src, mode, isShown = false, className = "" }: DotThumbProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** The running picture's "aim for dots (0) or picture (1)", for the "manual" mode to call. */
  const aimRef = useRef<((next: number) => void) | null>(null);
  /** Fetches the picture file, once. A "manual" picture is only fetched when it is first called up. */
  const loadRef = useRef<(() => void) | null>(null);
  /** The latest `isShown`, for a picture that finishes setting up after the prop last changed. */
  const isShownRef = useRef(isShown);

  useEffect(() => {
    isShownRef.current = isShown;
    if (mode !== "manual") return;
    if (isShown) loadRef.current?.();
    aimRef.current?.(isShown ? 1 : 0);
  }, [isShown, mode]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const sample = document.createElement("canvas");
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    if (!host || !canvas || !context || !sampleContext) return;

    const isStill = prefersReducedMotion();
    let image: HTMLImageElement | null = null;
    let cells: Cell[] = [];
    let cellSize = DOT_CELL_PX;
    // With reduced motion a "view" picture is simply shown; a "hover" one still swaps, without the wave.
    let shown = isStill && mode === "view" ? 1 : 0;
    let target = shown;
    let frame = 0;
    let lastFrame = 0;
    let paintFrame = 0;
    let isDisposed = false;
    /** Set if the picture's pixels cannot be read: it is then shown plain, with no dots. */
    let isPlain = false;
    let colors = { paper: "", accent: "" };
    /** Where the picture lands on the canvas to cover it, centred. */
    let cover = { x: 0, y: 0, width: 0, height: 0 };
    /** Where the wave starts, in device pixels; null spreads it by the dither alone. */
    let origin: { x: number; y: number } | null = null;

    const orderOf = (cell: Cell, reach: number): number => {
      if (!origin) return cell.base;
      const distance = Math.hypot(cell.x - origin.x, cell.y - origin.y) / reach;
      return clamp01(0.62 * distance + 0.38 * cell.base);
    };

    const render = (): void => {
      const { width, height } = canvas;
      if (width === 0 || height === 0 || !image) return;
      // `shown` moves at a steady rate so it can turn round at any point; the easing is applied here.
      const progress = isPlain ? 1 : shown * shown * (3 - 2 * shown);
      context.clearRect(0, 0, width, height);
      if (progress > 0) context.drawImage(image, cover.x, cover.y, cover.width, cover.height);
      if (progress >= 1) return;

      // The farthest corner from the origin, so the wave has reached every cell by the end.
      const reach = origin ? Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y)) : 1;
      const paper = new Path2D();
      const orange = new Path2D();

      cells.forEach((cell) => {
        const reveal = cellReveal(progress, orderOf(cell, reach), SPREAD);
        if (reveal >= 1) return;
        if (progress > 0) context.clearRect(cell.x, cell.y, cellSize, cellSize);
        if (reveal === 0) {
          if (cell.rest === 0) return;
          const inset = (cellSize - cell.rest) / 2;
          (cell.isAccent ? orange : paper).rect(cell.x + inset, cell.y + inset, cell.rest, cell.rest);
          return;
        }
        // Opening: the dot swells to fill its cell, already in the picture's colour.
        const size = cell.rest + (cellSize - cell.rest) * reveal;
        const inset = (cellSize - size) / 2;
        context.fillStyle = cell.isSpark && reveal < 0.4 ? colors.accent : cell.fill;
        context.fillRect(cell.x + inset, cell.y + inset, size, size);
      });

      context.fillStyle = colors.paper;
      context.fill(paper);
      context.fillStyle = colors.accent;
      context.fill(orange);
    };

    /** Lay the picture out ("cover", centred) and work out one dot per lattice cell. */
    const paint = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.round(host.clientWidth * dpr);
      const height = Math.round(host.clientHeight * dpr);
      if (width === 0 || height === 0 || !image) return;
      const style = getComputedStyle(host);
      colors = { paper: style.color, accent: style.caretColor };

      canvas.width = width;
      canvas.height = height;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
      const drawnWidth = image.naturalWidth * scale;
      const drawnHeight = image.naturalHeight * scale;
      cover = { x: (width - drawnWidth) / 2, y: (height - drawnHeight) / 2, width: drawnWidth, height: drawnHeight };

      // Whole device pixels, so clearing a cell never leaves a hairline of the picture behind.
      cellSize = Math.round(DOT_CELL_PX * dpr);
      const columns = Math.ceil(width / cellSize);
      const rows = Math.ceil(height / cellSize);
      sample.width = columns;
      sample.height = rows;
      // One pixel per cell: the same part of the picture the canvas shows, averaged down.
      sampleContext.imageSmoothingQuality = "high";
      sampleContext.clearRect(0, 0, columns, rows);
      sampleContext.drawImage(image, -cover.x / scale, -cover.y / scale, (columns * cellSize) / scale, (rows * cellSize) / scale, 0, 0, columns, rows);
      let pixels: Uint8ClampedArray;
      try {
        pixels = sampleContext.getImageData(0, 0, columns, rows).data;
      } catch {
        // A picture from another site cannot be read back. Show it as it is instead of leaving an empty box.
        isPlain = true;
        cells = [];
        render();
        return;
      }
      const tones = halftoneTones(
        Array.from({ length: columns * rows }, (_, cell) => luminance(pixels[cell * 4], pixels[cell * 4 + 1], pixels[cell * 4 + 2])),
      );

      cells = tones.map((tone, cell) => {
        const column = cell % columns;
        const row = Math.floor(cell / columns);
        const i = cell * 4;
        return {
          x: column * cellSize,
          y: row * cellSize,
          base: 0.55 * bayer8(column, row) + 0.45 * valueNoise(column * 0.08, row * 0.08, 9),
          rest: Math.round(cellSize * halftoneShare(tone, column, row)),
          fill: `rgb(${pixels[i]}, ${pixels[i + 1]}, ${pixels[i + 2]})`,
          isAccent: hash2(column, row, 11) < ACCENT_SHARE,
          isSpark: hash2(column, row, 5) < SPARK_SHARE,
        };
      });
      render();
    };

    const tick = (now: number): void => {
      // Stepped by elapsed time, so it takes as long on a 144 Hz screen as on a 60 Hz one.
      const step = (lastFrame === 0 ? FRAME_MS : Math.min(now - lastFrame, MAX_STEP_MS)) / REVEAL_MS;
      lastFrame = now;
      shown = target > shown ? Math.min(target, shown + step) : Math.max(target, shown - step);
      render();
      if (shown === target) {
        frame = 0;
        lastFrame = 0;
        return;
      }
      frame = window.requestAnimationFrame(tick);
    };

    const aim = (next: number): void => {
      if (next === target) return;
      target = next;
      if (isStill) {
        shown = target;
        render();
        return;
      }
      if (frame === 0) frame = window.requestAnimationFrame(tick);
    };

    // Dragging a window edge fires this many times a frame, for every picture on the page: repaint once per frame, and only for a new size.
    const resizeObserver = new ResizeObserver(() => {
      if (paintFrame !== 0) return;
      paintFrame = window.requestAnimationFrame(() => {
        paintFrame = 0;
        const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
        const isSameSize = canvas.width === Math.round(host.clientWidth * dpr) && canvas.height === Math.round(host.clientHeight * dpr);
        if (!isSameSize) paint();
      });
    });
    resizeObserver.observe(host);
    const themeObserver = new MutationObserver(paint);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // What resolves the picture: the pointer or keyboard focus on its link, or scrolling into view.
    const usesHover = mode === "hover" && hasFinePointer();
    const trigger = host.closest<HTMLElement>("a") ?? host;
    // Pointer and focus are tracked apart: the picture stays whole while either holds the link.
    let isHovered = false;
    let isFocused = false;
    const settle = (): void => aim(isHovered || isFocused ? 1 : 0);
    const handleEnter = (event: PointerEvent): void => {
      // The wave starts where the pointer came in, unless one is already under way.
      if (shown === 0) {
        const rect = host.getBoundingClientRect();
        const ratio = rect.width > 0 ? canvas.width / rect.width : 1;
        origin = { x: (event.clientX - rect.left) * ratio, y: (event.clientY - rect.top) * ratio };
      }
      isHovered = true;
      settle();
    };
    const handleLeave = (): void => {
      isHovered = false;
      settle();
    };
    const handleFocus = (): void => {
      // Keyboard focus only: a mouse click also focuses the link, and should not pin the picture open.
      isFocused = trigger.matches(":focus-visible");
      if (isFocused && shown === 0) origin = null;
      settle();
    };
    const handleBlur = (): void => {
      isFocused = false;
      settle();
    };
    let visibilityObserver: IntersectionObserver | null = null;

    let hasRequested = false;
    const load = (): void => {
      if (hasRequested) return;
      hasRequested = true;
      loadImage(src).then((loaded) => {
        if (isDisposed || !loaded) return;
        image = loaded;
        // On a slow connection the box may already count as resolved: start from dots so the wave is still seen.
        if (!isStill) shown = 0;
        paint();
        if (shown !== target && frame === 0) frame = window.requestAnimationFrame(tick);
      });
    };

    if (mode === "manual") {
      aimRef.current = aim;
      loadRef.current = load;
      if (isShownRef.current) load();
      aim(isShownRef.current ? 1 : 0);
    } else if (usesHover) {
      trigger.addEventListener("pointerenter", handleEnter);
      trigger.addEventListener("pointerleave", handleLeave);
      trigger.addEventListener("focus", handleFocus);
      trigger.addEventListener("blur", handleBlur);
    } else {
      // A picture so tall that the usual share of it cannot fit on screen would never resolve, so ask for less.
      const wanted = mode === "view" ? VIEW_VISIBLE_SHARE : TOUCH_VISIBLE_SHARE;
      const share = host.clientHeight * wanted > window.innerHeight ? 0.2 : wanted;
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries.at(-1);
          if (!entry) return;
          // Resolve at the wanted share; only break up again once it has left the screen altogether ("view") or dropped below the share ("hover" on touch).
          if (entry.intersectionRatio >= share) aim(1);
          else if (mode === "hover" || !entry.isIntersecting) aim(isStill && mode === "view" ? 1 : 0);
        },
        { threshold: [0, share] },
      );
      visibilityObserver.observe(host);
    }

    // A page can hold a dozen of these: each fetches its picture only as it comes near ("manual" ones, when called up).
    const loadObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        loadObserver.disconnect();
        load();
      },
      { rootMargin: LOAD_MARGIN },
    );
    if (mode !== "manual") loadObserver.observe(host);

    return () => {
      isDisposed = true;
      aimRef.current = null;
      loadRef.current = null;
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(paintFrame);
      loadObserver.disconnect();
      resizeObserver.disconnect();
      themeObserver.disconnect();
      visibilityObserver?.disconnect();
      trigger.removeEventListener("pointerenter", handleEnter);
      trigger.removeEventListener("pointerleave", handleLeave);
      trigger.removeEventListener("focus", handleFocus);
      trigger.removeEventListener("blur", handleBlur);
    };
  }, [mode, src]);

  return (
    <div ref={hostRef} aria-hidden="true" className={`relative overflow-hidden bg-ink text-paper caret-accent ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
