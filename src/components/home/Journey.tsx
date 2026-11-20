"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { journey, journeyNote } from "@/content/home";
import { formatCoords, haversineKm } from "@/lib/geo";
import { GLOBE_TILT_RANGE_DEG, drawGlobe, type GlobeHighlight, type GlobeStop } from "@/lib/globe/globe";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const start = journey[0];
const end = journey[journey.length - 1];
const TOTAL_KM = Math.round(haversineKm(start, end));
const hemisphere = (lat: number): string => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? "N" : "S"}`;
const FROM: GlobeStop = { ...start, label: `${start.code} · ${hemisphere(start.lat)}` };
const TO: GlobeStop = { ...end, label: `${end.code} · ${hemisphere(end.lat)}` };
/** Home and base in the accent colour: Nigeria with its neighbours, and the British Isles. */
const HIGHLIGHTS: readonly GlobeHighlight[] = [
  { lat: 9.1, lon: 7.4, radius: 9 },
  { lat: 54, lon: -3, radius: 6 },
];
const NO_HIGHLIGHTS: readonly GlobeHighlight[] = [];
const city = (place: string): string => place.split(",")[0];

const LIVE_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
const MAX_DPR = 2;
const formatKm = (value: number): string => Math.round(value).toLocaleString("en-GB").replace(/,/g, " ");

/** One frame at 60 Hz. Motion below is tuned per 60 Hz frame and scaled by real elapsed time. */
const FRAME_MS = 1000 / 60;
/** Longest gap treated as one step, so a paused tab does not lurch when it resumes. */
const MAX_STEP_MS = 50;
/** Degrees per 60 Hz frame the globe turns when left alone. */
const AUTO_SPIN_DEG = 0.12;
/** How far the idle globe nods up and down, and how slowly. */
const AUTO_NOD_DEG = 9;
const AUTO_NOD_MS = 5200;
/** After a drag or a scroll-driven move, wait this long before turning again. */
const IDLE_MS = 1600;
/** Share of the extra turn shed per frame while scrolling brings the route back into view. */
const HOMING = 0.14;
const FRICTION = 0.94;

/** Bring an angle into −180..180, so "back to the route" always takes the short way round. */
const wrapDegrees = (angle: number): number => ((((angle + 180) % 360) + 360) % 360) - 180;

interface GlobeCanvasProps {
  className?: string;
  /** Called once with a function that moves the traveller to a given progress (0..1). */
  onReady?: (setProgress: (progress: number) => void) => void;
  /** Decorative: no route, no labels, no dragging. */
  isBare?: boolean;
  initialProgress?: number;
  label?: string;
}

/**
 * The dot globe on a canvas. Left alone it turns slowly; it can be dragged
 * round with a mouse or a finger and keeps a little momentum. When scroll
 * moves the traveller, the view swings back to follow the route.
 */
export function GlobeCanvas({ className = "", onReady, isBare = false, initialProgress = 1, label }: GlobeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const isStill = prefersReducedMotion();
    let progress = initialProgress;
    // The view: extra turn and tilt on top of following the traveller.
    let spin = 0;
    let tilt = 0;
    let spinSpeed = 0;
    let tiltSpeed = 0;
    let isDragging = false;
    let isHoming = false;
    let lastTouched = 0;
    let lastPointer = { x: 0, y: 0 };
    /** The one pointer that is dragging; a second finger is ignored. */
    let activePointer: number | null = null;
    let lastFrame = 0;
    let frame = 0;
    let isVisible = false;
    let colors = { paper: "", accent: "" };

    /** Colours only change with the theme, so they are read then, not every frame. */
    const readColors = (): void => {
      const style = getComputedStyle(canvas);
      colors = { paper: style.color, accent: style.caretColor };
    };

    const draw = (): void => {
      const size = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, MAX_DPR));
      if (size === 0) return;
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      drawGlobe(context, {
        size,
        from: FROM,
        to: TO,
        progress,
        color: colors.paper,
        accent: colors.accent,
        isBare,
        spin,
        tilt,
        highlights: isBare ? NO_HIGHLIGHTS : HIGHLIGHTS,
      });
    };

    const clampTilt = (value: number): number => Math.min(GLOBE_TILT_RANGE_DEG, Math.max(-GLOBE_TILT_RANGE_DEG, value));

    /** `frames` is elapsed time in 60 Hz frames, so the pace is the same on a 60 Hz and a 144 Hz screen. */
    const step = (now: number, frames: number): void => {
      if (isHoming) {
        const kept = Math.pow(1 - HOMING, frames);
        spin *= kept;
        tilt *= kept;
        if (Math.abs(spin) < 0.05 && Math.abs(tilt) < 0.05) {
          spin = 0;
          tilt = 0;
          isHoming = false;
        }
        return;
      }
      if (isDragging) return;
      const friction = Math.pow(FRICTION, frames);
      spin += spinSpeed * frames;
      tilt = clampTilt(tilt + tiltSpeed * frames);
      spinSpeed *= friction;
      tiltSpeed *= friction;
      if (now - lastTouched > IDLE_MS) {
        spin += AUTO_SPIN_DEG * frames;
        tilt += (AUTO_NOD_DEG * Math.sin(now / AUTO_NOD_MS) - tilt) * (1 - Math.pow(0.99, frames));
      }
    };

    const loop = (now: number): void => {
      const elapsed = lastFrame === 0 ? FRAME_MS : Math.min(now - lastFrame, MAX_STEP_MS);
      lastFrame = now;
      step(now, elapsed / FRAME_MS);
      draw();
      frame = window.requestAnimationFrame(loop);
    };

    const run = (): void => {
      window.cancelAnimationFrame(frame);
      lastFrame = 0;
      if (isStill || !isVisible || document.hidden) return;
      frame = window.requestAnimationFrame(loop);
    };

    /** Scroll moved the traveller: put the route back in view, then follow it. */
    const setProgress = (next: number): void => {
      if (next === progress) return;
      progress = next;
      lastTouched = performance.now();
      spinSpeed = 0;
      tiltSpeed = 0;
      if (isStill) {
        spin = 0;
        tilt = 0;
        draw();
        return;
      }
      if (!isDragging) {
        spin = wrapDegrees(spin);
        isHoming = true;
      }
    };

    const degreesPerPixel = (): number => 180 / (Math.PI * Math.max(1, canvas.clientWidth * 0.43));

    const handleDown = (event: PointerEvent): void => {
      if (activePointer !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
      activePointer = event.pointerId;
      isDragging = true;
      isHoming = false;
      spinSpeed = 0;
      tiltSpeed = 0;
      lastPointer = { x: event.clientX, y: event.clientY };
      try {
        // Keeps the drag alive when the pointer leaves the globe.
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is already gone (lifted between events): the drag simply ends at the globe's edge.
      }
    };

    const handleMove = (event: PointerEvent): void => {
      if (!isDragging || event.pointerId !== activePointer) return;
      const scale = degreesPerPixel();
      const turn = -(event.clientX - lastPointer.x) * scale;
      const lift = (event.clientY - lastPointer.y) * scale;
      lastPointer = { x: event.clientX, y: event.clientY };
      spin += turn;
      tilt = clampTilt(tilt + lift);
      // Remember the pace of the drag, so letting go carries on for a moment.
      spinSpeed = 0.6 * spinSpeed + 0.4 * turn;
      tiltSpeed = 0.6 * tiltSpeed + 0.4 * lift;
      if (isStill) draw();
    };

    const handleUp = (event: PointerEvent): void => {
      if (!isDragging || event.pointerId !== activePointer) return;
      activePointer = null;
      isDragging = false;
      lastTouched = performance.now();
      if (isStill) {
        spinSpeed = 0;
        tiltSpeed = 0;
      }
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const repaint = (): void => {
      readColors();
      draw();
    };
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(canvas);
    const themeObserver = new MutationObserver(repaint);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      run();
    });
    visibilityObserver.observe(canvas);
    document.addEventListener("visibilitychange", run);
    if (!isBare) {
      canvas.addEventListener("pointerdown", handleDown);
      canvas.addEventListener("pointermove", handleMove);
      canvas.addEventListener("pointerup", handleUp);
      canvas.addEventListener("pointercancel", handleUp);
    }

    repaint();
    onReadyRef.current?.(setProgress);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", run);
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointercancel", handleUp);
    };
  }, [initialProgress, isBare]);

  const interactive = isBare ? "" : "cursor-grab touch-pan-y select-none active:cursor-grabbing";

  return (
    <canvas
      ref={canvasRef}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-cursor={isBare ? undefined : "Drag"}
      className={`block aspect-square text-paper caret-accent ${interactive} ${className}`}
    />
  );
}

/**
 * The journey on a dot globe, with a kilometre counter. On large screens the
 * section pins and scrolling flies the route; elsewhere it shows the finished
 * journey. Either way the globe turns on its own and can be dragged round.
 */
export function Journey() {
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const moveGlobeRef = useRef<((progress: number) => void) | null>(null);
  /** Last progress shown, so a globe that mounts later starts in step with the counter. */
  const progressRef = useRef(1);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const show = (progress: number): void => {
        progressRef.current = progress;
        moveGlobeRef.current?.(progress);
        if (counterRef.current) counterRef.current.textContent = formatKm(TOTAL_KM * progress);
        if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      };

      const media = gsap.matchMedia();
      media.add(LIVE_QUERY, () => {
        show(0);
        const trigger = ScrollTrigger.create({
          trigger: root,
          start: "top top",
          end: "+=140%",
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => show(self.progress),
        });
        return () => {
          trigger.kill();
          show(1);
        };
      });
    },
    { scope: rootRef },
  );

  return (
    <div id="journey" data-enter="none" className="scroll-mt-16">
      <div ref={rootRef} className="relative overflow-hidden border-b border-line bg-ink lg:h-screen">
        <div className="grid h-full grid-cols-1 items-center gap-8 px-4 py-14 sm:px-6 md:px-10 lg:grid-cols-12 lg:py-0">
          <div className="lg:col-span-5">
            <p className="label mb-4">
              [ <span className="text-accent-text">Journey</span> ] · {city(start.place)} → {city(end.place)}
            </p>
            <p aria-hidden="true" className="display text-[clamp(3.4rem,9vw,8.5rem)] leading-[0.85] tabular-nums">
              <span ref={counterRef}>{formatKm(TOTAL_KM)}</span>
              <span className="text-outline-accent ml-2">KM</span>
            </p>
            <p className="sr-only">
              Journey from {start.place} to {end.place}: {formatKm(TOTAL_KM)} km as the crow flies.
            </p>
            <div className="mt-6 h-px w-full bg-line">
              <div ref={barRef} className="h-px origin-left bg-accent" />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 font-mono text-[12px] tracking-[0.1em] uppercase">
              <div>
                <dt className="text-paper/55">From</dt>
                <dd className="text-paper">{start.place}</dd>
                <dd className="text-paper/55">{formatCoords(start)}</dd>
              </div>
              <div className="text-right">
                <dt className="text-paper/55">Now</dt>
                <dd className="text-paper">{end.place}</dd>
                <dd className="text-paper/55">{formatCoords(end)}</dd>
              </div>
            </dl>
            <p className="mt-8 max-w-md leading-relaxed text-paper/70">{journeyNote}</p>
            <p aria-hidden="true" className="label mt-6 flex items-center gap-2">
              <span className="size-1.5 bg-accent" />
              Drag the globe to turn it
            </p>
          </div>
          <div className="lg:col-span-7">
            <GlobeCanvas
              label={`Globe showing the route from ${start.place} to ${end.place}.`}
              className="mx-auto w-full max-w-[min(640px,80vh)] max-lg:max-w-[420px]"
              onReady={(setProgress) => {
                moveGlobeRef.current = setProgress;
                setProgress(progressRef.current);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
