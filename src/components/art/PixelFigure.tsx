"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import { paintArt, type ArtName } from "@/lib/art";
import { hasFinePointer, prefersReducedMotion } from "@/lib/motion";

interface PixelFigureProps {
  art: ArtName;
  /** Read out by screen readers in place of the drawing. */
  label: string;
  className?: string;
  /**
   * "view": resolves from big pixels to full detail once, on entering the viewport.
   * "hover": rests as big pixels and resolves while the pointer (or keyboard focus)
   * is on the link around it, then breaks up again. On touch screens it resolves
   * while it is on screen. "none": always sharp.
   */
  mode?: "view" | "hover" | "none";
  /** Reveal the accent-colour version in a circle under the pointer. */
  reveal?: boolean;
  /** Extra classes for the drawing itself (e.g. opacity). */
  canvasClassName?: string;
  /** Text for the "numeral" figure. */
  text?: string;
  /** A picture in /public to show instead of the drawing (fills the box, cropped to fit). */
  src?: string;
}

/** Pixel sizes the figure steps through as it resolves; the first is the resting size. */
const PIXEL_STEPS = { view: [64, 32, 16, 8, 4, 2, 1], hover: [30, 20, 12, 6, 3, 1], none: [1] } as const;
const STEP_MS = { view: 85, hover: 55, none: 0 } as const;
/** On touch screens a "hover" figure resolves once this much of it is on screen. */
const TOUCH_VISIBLE_SHARE = 0.6;
const MAX_DPR = 2;
const MARK_SRC = "/mark-solid.svg";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

/** Fill the canvas with the picture, cropped from the centre ("cover"). */
function paintCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawnWidth = image.naturalWidth * scale;
  const drawnHeight = image.naturalHeight * scale;
  context.clearRect(0, 0, width, height);
  context.drawImage(image, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
}

/**
 * A figure in the site's two colours: a code-drawn plate, or a picture when
 * `src` is given. It is shown through a grid of coarse pixels that resolves to
 * full definition (see `mode`). With `reveal`, the accent version shows
 * through a circle that follows the pointer.
 */
export function PixelFigure({ art, label, className = "", mode = "view", reveal = true, canvasClassName = "", text, src }: PixelFigureProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const accentRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!host || !canvas || !context) return;

    const source = document.createElement("canvas");
    const sourceContext = source.getContext("2d");
    const coarse = document.createElement("canvas");
    const coarseContext = coarse.getContext("2d");
    if (!sourceContext || !coarseContext) return;

    const steps = PIXEL_STEPS[mode];
    const sharp = steps.length - 1;
    const isInstant = prefersReducedMotion();
    let step = mode === "view" && isInstant ? sharp : 0;
    let target = step;
    let timer = 0;
    let image: HTMLImageElement | null = null;
    let isDisposed = false;

    const show = (): void => {
      const { width, height } = canvas;
      if (width === 0 || height === 0) return;
      const pixel = steps[step] * Math.min(window.devicePixelRatio || 1, MAX_DPR);
      context.clearRect(0, 0, width, height);
      if (pixel <= MAX_DPR) {
        context.imageSmoothingEnabled = true;
        context.drawImage(source, 0, 0);
        return;
      }
      coarse.width = Math.max(1, Math.ceil(width / pixel));
      coarse.height = Math.max(1, Math.ceil(height / pixel));
      coarseContext.imageSmoothingEnabled = true;
      coarseContext.drawImage(source, 0, 0, coarse.width, coarse.height);
      context.imageSmoothingEnabled = false;
      context.drawImage(coarse, 0, 0, coarse.width, coarse.height, 0, 0, coarse.width * pixel, coarse.height * pixel);
    };

    const paint = (): void => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const width = Math.round(host.clientWidth * dpr);
      const height = Math.round(host.clientHeight * dpr);
      if (width === 0 || height === 0) return;
      const style = getComputedStyle(host);
      [canvas, source].forEach((surface) => {
        surface.width = width;
        surface.height = height;
      });
      if (src && image) paintCover(sourceContext, image, width, height);
      else paintArt(art, sourceContext, { width, height, color: style.color, image, text });

      const accent = accentRef.current;
      const accentContext = accent?.getContext("2d");
      if (accent && accentContext) {
        accent.width = width;
        accent.height = height;
        paintArt(art, accentContext, { width, height, color: style.caretColor, image, text });
      }
      show();
    };

    /** Walk one pixel size at a time towards the target, in either direction. */
    const advance = (): void => {
      show();
      if (step === target) {
        timer = 0;
        return;
      }
      step += target > step ? 1 : -1;
      timer = window.setTimeout(advance, STEP_MS[mode]);
    };

    const aim = (next: number): void => {
      if (next === target) return;
      target = next;
      if (isInstant) {
        step = target;
        show();
        return;
      }
      if (timer === 0) advance();
    };

    const resizeObserver = new ResizeObserver(paint);
    resizeObserver.observe(host);
    const themeObserver = new MutationObserver(paint);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    // What resolves the figure: scrolling into view, or the pointer / keyboard focus on its link.
    const usesHover = mode === "hover" && hasFinePointer();
    const trigger = host.closest<HTMLElement>("a") ?? host;
    // Pointer and focus are tracked apart: the figure stays sharp while either holds it.
    let isHovered = false;
    let isFocused = false;
    const settle = (): void => aim(isHovered || isFocused ? sharp : 0);
    const handleEnter = (): void => {
      isHovered = true;
      settle();
    };
    const handleLeave = (): void => {
      isHovered = false;
      settle();
    };
    const handleFocus = (): void => {
      // Keyboard focus only: a mouse click also focuses the link, and should not pin the figure sharp.
      isFocused = trigger.matches(":focus-visible");
      settle();
    };
    const handleBlur = (): void => {
      isFocused = false;
      settle();
    };
    let visibilityObserver: IntersectionObserver | null = null;

    if (usesHover) {
      trigger.addEventListener("pointerenter", handleEnter);
      trigger.addEventListener("pointerleave", handleLeave);
      trigger.addEventListener("focus", handleFocus);
      trigger.addEventListener("blur", handleBlur);
    } else if (mode !== "none") {
      // A figure taller than the screen could never show the usual share of itself, so ask for less.
      const isTall = host.clientHeight > window.innerHeight * TOUCH_VISIBLE_SHARE;
      visibilityObserver = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) aim(sharp);
          else if (mode === "hover") aim(0);
        },
        { threshold: mode === "hover" && !isTall ? TOUCH_VISIBLE_SHARE : 0.25 },
      );
      visibilityObserver.observe(host);
    }

    paint();
    const imageSrc = src ?? (art === "mark" ? MARK_SRC : null);
    if (imageSrc) {
      loadImage(imageSrc).then((loaded) => {
        if (isDisposed || !loaded) return;
        image = loaded;
        paint();
      });
    }

    return () => {
      isDisposed = true;
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      visibilityObserver?.disconnect();
      trigger.removeEventListener("pointerenter", handleEnter);
      trigger.removeEventListener("pointerleave", handleLeave);
      trigger.removeEventListener("focus", handleFocus);
      trigger.removeEventListener("blur", handleBlur);
    };
  }, [art, mode, src, text]);

  const handlePointer = (event: PointerEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--rx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--ry", `${event.clientY - rect.top}px`);
  };

  // With no label the figure is decoration: hide it rather than announce an image with no name.
  const isDecorative = label.length === 0;

  return (
    <div
      ref={hostRef}
      role={isDecorative ? undefined : "img"}
      aria-label={isDecorative ? undefined : label}
      aria-hidden={isDecorative ? true : undefined}
      onPointerEnter={reveal ? handlePointer : undefined}
      onPointerMove={reveal ? handlePointer : undefined}
      className={`group/pixel relative overflow-hidden text-paper caret-accent ${className}`}
    >
      <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 size-full ${canvasClassName}`} />
      {reveal ? <canvas ref={accentRef} aria-hidden="true" className="pixel-reveal absolute inset-0 size-full bg-ink" /> : null}
    </div>
  );
}
