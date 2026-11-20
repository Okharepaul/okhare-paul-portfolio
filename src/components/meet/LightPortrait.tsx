"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { hasFinePointer, prefersReducedMotion, savesData } from "@/lib/motion";
import {
    FOLLOW_RATE,
  FRAME_COUNT,
  FRAME_HEIGHT,
  FRAME_WIDTH,
  FRONT_FRAME,
  SCROLL_RATE,
  angleToFrame,
  approachFrame,
  frameAtTravel,
  formatAngle,
  frameSrc,
  frameToAngle,
  lampPosition,
  lightDescription,
  lightWords,
  orbitSpeed,
  pointerAngle,
  smoothstep,
  softBlend,
  stepAngle,
  swayAngle,
  travelAtFrame,
  TRAVEL_TOTAL,
} from "@/lib/portrait";

/** What the page around the portrait can ask of it. */
export interface LightController {
  /**
   * Where the light rests when nobody is steering it: an angle in degrees, or
   * null for the portrait's own habit, which is to keep circling the sitter.
   */
  setRest: (angle: number | null) => void;
  /** Opens the portrait and sets the light circling, starting from behind the sitter. */
  playIntro: () => void;
}

type LightPortraitProps = {
  alt: string;
  /** Sits at the left of the line above the portrait. */
  caption: ReactNode;
  hintPointer: string;
  hintTouch: string;
  controlLabel: string;
  controlHelp: string;
  /** Called once, with the handle the page steers the light by. */
  onReady?: (controller: LightController) => void;
  /** Called whenever the light has moved, with its angle in degrees. */
  onLight?: (angle: number) => void;
  className?: string;
};

type Mode = "waiting" | "orbit" | "steer" | "rest";

/** One turn of the light round the sitter while the page is at the top. */
const ORBIT_SECONDS = 10;
/** The circling light takes this long to come up to speed, so it never starts with a jolt. */
const ORBIT_EASE_MS = 1800;
/** Held in place (once the page is scrolled) the light still drifts a little, by this share of the full drift. */
const REST_SWAY_SHARE = 0.5;
/** The opening pass waits this long for the frames; after that it plays with what has arrived. */
const LOAD_WAIT_MS = 5000;
/** Longest time one step may cover, so a paused tab does not lurch when it comes back. */
const MAX_STEP_SECONDS = 0.05;
/** Visitors who asked for less data get every third frame; the blend covers the gaps. */
const SAVE_DATA_STEP = 3;
/** Phones get every second frame: half the memory, and the blend between neighbours hides the gaps. */
const SMALL_SCREEN_STEP = 2;
const SMALL_SCREEN_QUERY = "(pointer: coarse), (max-width: 767px)";
const KEY_STEP_DEG = 6;
/** How far the frame leans towards the pointer, in degrees. */
const MAX_LEAN_DEG = 2.4;

/** The lamp's circle round the sitter, as shares of the picture: centre, and how far it reaches. */
const ORBIT = { centreX: 0.5, centreY: 0.885, radiusX: 0.66, radiusY: 0.078 } as const;
const orbitPath = (isFront: boolean): string => {
  const left = (ORBIT.centreX - ORBIT.radiusX) * 100;
  const right = (ORBIT.centreX + ORBIT.radiusX) * 100;
  const y = ORBIT.centreY * 100;
  return `M ${left} ${y} A ${ORBIT.radiusX * 100} ${ORBIT.radiusY * 100} 0 0 ${isFront ? 0 : 1} ${right} ${y}`;
};

/**
 * The portrait, lit by a lamp the visitor can move. It is 61 photographs of
 * one sitting, the light a little further round in each, cross-faded on a
 * canvas. Moving a pointer (or dragging a finger) across it steers the light:
 * the edges put it behind the sitter, the centre brings it to the front, as in
 * the owner's prototype. Left alone at the top of the page it circles the sitter
 * slowly. The page can also hold it at an angle (`setRest`). A small lamp on a
 * ring under the bust shows where the light is. Arrow keys move it too.
 * With reduced motion the portrait stands lit from the front and only moves
 * when steered, without easing.
 */
export function LightPortrait({ alt, caption, hintPointer, hintTouch, controlLabel, controlHelp, onReady, onLight, className = "" }: LightPortraitProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const lampRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const angleRef = useRef<HTMLSpanElement>(null);
  const wordsRef = useRef<HTMLSpanElement>(null);
  const onReadyRef = useRef(onReady);
  const onLightRef = useRef(onLight);

  useEffect(() => {
    onReadyRef.current = onReady;
    onLightRef.current = onLight;
  }, [onReady, onLight]);

  useEffect(() => {
    const root = rootRef.current;
    const figure = figureRef.current;
    const frameBox = frameRef.current;
    const windowBox = windowRef.current;
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const control = controlRef.current;
    const lamp = lampRef.current;
    const bar = barRef.current;
    const context = canvas?.getContext("2d");
    if (!root || !figure || !frameBox || !windowBox || !layer || !canvas || !control || !lamp || !bar || !context) {
      // With no canvas to draw on there is nothing to open: show the plain picture rather than leave it shut.
      if (root) root.dataset.state = "live";
      return;
    }

    const isStill = prefersReducedMotion();
    const step = savesData() ? SAVE_DATA_STEP : window.matchMedia(SMALL_SCREEN_QUERY).matches ? SMALL_SCREEN_STEP : 1;
    const wanted = Array.from({ length: FRAME_COUNT }, (_, i) => i).filter((i) => i % step === 0);
    const images: (HTMLImageElement | null)[] = Array.from({ length: FRAME_COUNT }, () => null);
    const isLoaded = (index: number): boolean => images[index] !== null;
    /** Frames asked for and not yet back, so they can be let go if the page is left first. */
    const pending = new Set<HTMLImageElement>();

    let requestedCount = 0;
    let hasRequestedAll = false;
    let settledCount = 0;
    let position = isStill ? FRONT_FRAME : 0;
    let target = position;
    let mode: Mode = isStill ? "rest" : "waiting";
    let rest: number | null = null;
    /** When the light last came to rest, so its drift starts from nothing each time. */
    let swayStart = 0;
    /** When the light last began to circle, so it can come up to speed gently. */
    let orbitStart = 0;
    let isIntroPending = false;
    let hasOpened = false;
    let isPointerIn = false;
    let isKeyboard = false;
    let frame = 0;
    let loadTimer = 0;
    let sweepCall: gsap.core.Tween | null = null;
    let lastTick = 0;
    let isVisible = false;
    let isDirty = true;
    let isDisposed = false;
    let size = { width: 0, height: 0 };
    let shown = { angle: "", words: "", behind: "" };

    const draw = (): void => {
      // Several neighbouring frames laid over one another, each at its share: an average that turns no corners.
      const shares = softBlend(position, isLoaded);
      if (shares.length === 0) return;
      let laid = 0;
      shares.forEach(({ frame: index, share }) => {
        const image = images[index];
        if (!image) return;
        laid += share;
        // Laid on at this strength, each frame ends up with exactly its share of the finished picture.
        context.globalAlpha = share / laid;
        context.drawImage(image, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      });
      context.globalAlpha = 1;
      root.dataset.painted = "true";
    };

    /** Everything that shows where the light is: the picture, the lamp on its ring, the readout. */
    const present = (): void => {
      const angle = frameToAngle(position);
      draw();
      const at = lampPosition(angle);
      const x = size.width * (ORBIT.centreX + ORBIT.radiusX * at.x);
      const y = size.height * (ORBIT.centreY + ORBIT.radiusY * at.depth);
      lamp.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(0.72 + 0.2 * (at.depth + 1)).toFixed(3)})`;
      const next = { angle: formatAngle(angle), words: lightWords(angle), behind: String(at.isBehind) };
      if (next.behind !== shown.behind) lamp.dataset.behind = next.behind;
      if (next.angle !== shown.angle && angleRef.current) angleRef.current.textContent = next.angle;
      if (next.words !== shown.words && wordsRef.current) wordsRef.current.textContent = next.words;
      shown = next;
      onLightRef.current?.(angle);
    };

    const syncAria = (): void => {
      const angle = Math.round(frameToAngle(mode === "steer" ? target : position));
      control.setAttribute("aria-valuenow", String(angle));
      control.setAttribute("aria-valuetext", lightDescription(angle));
    };

    const tick = (now: number): void => {
      const seconds = lastTick === 0 ? 1 / 60 : Math.min(MAX_STEP_SECONDS, (now - lastTick) / 1000);
      lastTick = now;
      const before = position;

      if (mode === "steer") {
        position = approachFrame(position, target, FOLLOW_RATE, seconds);
      } else if (mode === "orbit") {
        // It comes up to speed gently, then keeps an even pace to the eye.
        const pace = smoothstep((now - orbitStart) / ORBIT_EASE_MS);
        const travel = travelAtFrame(position) + orbitSpeed(position, ORBIT_SECONDS) * pace * seconds;
        // The last frame and the first are the same picture, so the turn joins without a seam.
        position = frameAtTravel(travel >= TRAVEL_TOTAL ? travel - TRAVEL_TOTAL : travel);
        // The lamp and its ring have shown one whole turn: that is all they are for.
        if (travel >= TRAVEL_TOTAL) hideRing();
      } else if (mode === "rest") {
        // Held where the page wants it (in front, or thrown aside by a scroll), with a little drift so the face stays alive.
        const home = (rest ?? 0) + REST_SWAY_SHARE * swayAngle((now - swayStart) / 1000);
        position = approachFrame(position, angleToFrame(home), SCROLL_RATE, seconds);
      }

      if (isDirty || Math.abs(position - before) > 0.0005) {
        isDirty = false;
        present();
      }
      frame = window.requestAnimationFrame(tick);
    };

    const run = (): void => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTick = 0;
      if (isStill || !isVisible || document.hidden) return;
      frame = window.requestAnimationFrame(tick);
    };

    /** The lamp and its ring have done their job once the opening pass is over (or was never played): they go for good. */
    const hideRing = (): void => {
      if (root.dataset.ring === "off") return;
      root.dataset.ring = "off";
      gsap.killTweensOf(lamp);
    };

    /** The opening pass proper, once the frames are in (or the wait for them is over). */
    const startSweep = (): void => {
      if (!isIntroPending) return;
      isIntroPending = false;
      window.clearTimeout(loadTimer);
      // A hand already on the portrait, or a place down the page to hold the light at, comes first.
      if (mode !== "waiting") return;
      if (rest !== null) {
        mode = "rest";
        swayStart = performance.now();
        root.dataset.hint = "on";
        hideRing();
        return;
      }
      mode = "orbit";
      orbitStart = performance.now();
      root.dataset.hint = "on";
    };

    const settle = (): void => {
      if (isPointerIn || isKeyboard) {
        if (mode !== "steer") {
          mode = "steer";
          root.dataset.hint = "on";
          root.dataset.steered = "true";
          hideRing();
          loadRest();
        }
        if (isStill) {
          position = target;
          present();
        }
        return;
      }
      if (mode !== "steer") return;
      // Let go at the top of the page, the light takes up its circling from where it is; further down it goes back to the front.
      mode = rest === null && !isStill ? "orbit" : "rest";
      swayStart = performance.now();
      orbitStart = swayStart;
      if (isStill) {
        position = angleToFrame(rest ?? 0);
        present();
      }
      syncAria();
    };

    const lean = isStill || !hasFinePointer() ? null : { y: gsap.quickTo(frameBox, "rotationY", { duration: 0.7, ease: "power3.out" }), x: gsap.quickTo(frameBox, "rotationX", { duration: 0.7, ease: "power3.out" }) };
    if (lean) gsap.set(frameBox, { transformPerspective: 1100 });

    /** Nothing answers a hand until the portrait has opened (with reduced motion it is never shut). */
    const canSteer = (): boolean => isStill || hasOpened;

    const handlePointer = (event: PointerEvent): void => {
      const rect = control.getBoundingClientRect();
      if (rect.width === 0 || !canSteer()) return;
      const share = (event.clientX - rect.left) / rect.width;
      target = angleToFrame(pointerAngle(share));
      isPointerIn = true;
      settle();
      if (lean && event.pointerType === "mouse") {
        lean.y(MAX_LEAN_DEG * 2 * (Math.min(1, Math.max(0, share)) - 0.5));
        lean.x(-MAX_LEAN_DEG * 2 * (Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)) - 0.5));
      }
    };
    const handleLeave = (): void => {
      isPointerIn = false;
      settle();
      lean?.y(0);
      lean?.x(0);
    };
    const handleUp = (event: PointerEvent): void => {
      // A mouse is still over the portrait after a click; a finger or pen has gone.
      if (event.pointerType !== "mouse") handleLeave();
    };

    const handleKey = (event: KeyboardEvent): void => {
      if (!canSteer()) return;
      const current = frameToAngle(isKeyboard ? target : Math.round(position));
      // Up, down and the page keys are left alone: on this page they scroll.
      const moves: Record<string, number> = {
        ArrowLeft: stepAngle(current, -KEY_STEP_DEG),
        ArrowRight: stepAngle(current, KEY_STEP_DEG),
        Home: -180,
        End: 180,
      };
      if (!(event.key in moves) || event.altKey || event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      target = angleToFrame(moves[event.key]);
      isKeyboard = true;
      settle();
      syncAria();
    };
    const handleFocus = (): void => {
      // Reached with the keyboard, the light holds where it is until focus moves on, so the value read out stays true.
      if (canSteer() && control.matches(":focus-visible")) {
        target = Math.round(position);
        isKeyboard = true;
        settle();
      }
      syncAria();
    };
    const handleBlur = (): void => {
      isKeyboard = false;
      settle();
    };

    const finishLoading = (): void => {
      bar.style.opacity = "0";
      startSweep();
    };
    const isAllSettled = (): boolean => hasRequestedAll && settledCount === requestedCount;
    const load = (index: number): void => {
      const image = new Image();
      image.decoding = "async";
      requestedCount += 1;
      pending.add(image);
      const settleImage = (isGood: boolean): void => {
        pending.delete(image);
        if (isDisposed) return;
        if (isGood) images[index] = image;
        settledCount += 1;
        bar.style.transform = `scaleX(${settledCount / wanted.length})`;
        bar.style.opacity = settledCount === requestedCount ? "0" : "1";
        isDirty = true;
        if (isStill) present();
        if (isAllSettled()) finishLoading();
      };
      image.onload = () => {
        // Decoded ahead of time, so the first pass of the light does not stutter on each new frame.
        image.decode().then(
          () => settleImage(true),
          () => settleImage(true),
        );
      };
      image.onerror = () => settleImage(false);
      image.src = frameSrc(index);
    };
    /** The frame the page opens on comes first; the others follow in the order the light will reach them. */
    const firstFrame = isStill ? FRONT_FRAME : 0;
    const loadRest = (): void => {
      if (hasRequestedAll) return;
      hasRequestedAll = true;
      wanted.filter((index) => index !== firstFrame).forEach(load);
    };

    const controller: LightController = {
      setRest: (angle) => {
        if (angle === rest) return;
        rest = angle;
        if (isStill) {
          if (mode !== "steer") {
            position = angleToFrame(angle ?? 0);
            present();
          }
          return;
        }
        if (mode === "orbit" && angle !== null) {
          mode = "rest";
          swayStart = performance.now();
          hideRing();
        } else if (mode === "rest" && angle === null) {
          mode = "orbit";
          orbitStart = performance.now();
        }
      },
      playIntro: () => {
        if (hasOpened) return;
        hasOpened = true;
        root.dataset.state = "live";
        if (isStill) return;
        const chrome = root.querySelectorAll("[data-light-chrome]");
        gsap.fromTo(windowBox, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" });
        gsap.fromTo(layer, { scale: 1.18 }, { scale: 1, duration: 2.2, ease: "expo.out", clearProps: "transform" });
        gsap.fromTo(chrome, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, delay: 0.75, clearProps: "opacity,transform" });
        // The lamp only fades in: its place on the ring is written every frame and must not be touched.
        gsap.fromTo(lamp, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out", delay: 1.1, clearProps: "opacity" });
        isIntroPending = true;
        // The light starts round once the shutter is most of the way open.
        sweepCall = gsap.delayedCall(0.9, () => {
          if (isDisposed) return;
          if (isAllSettled()) startSweep();
          else loadTimer = window.setTimeout(startSweep, LOAD_WAIT_MS);
        });
      },
    };

    const resizeObserver = new ResizeObserver(() => {
      size = { width: figure.clientWidth, height: figure.clientHeight };
      isDirty = true;
      if (isStill || frame === 0) present();
    });
    resizeObserver.observe(figure);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      run();
    });
    visibilityObserver.observe(root);
    document.addEventListener("visibilitychange", run);
    control.addEventListener("pointerenter", handlePointer);
    control.addEventListener("pointermove", handlePointer);
    control.addEventListener("pointerdown", handlePointer);
    control.addEventListener("pointerleave", handleLeave);
    control.addEventListener("pointercancel", handleLeave);
    control.addEventListener("pointerup", handleUp);
    control.addEventListener("keydown", handleKey);
    control.addEventListener("focus", handleFocus);
    control.addEventListener("blur", handleBlur);

    // With reduced motion there is no opening pass, so there is nothing for the lamp and its ring to show.
    if (isStill) hideRing();
    load(firstFrame);
    // With reduced motion only the one frame is shown until the visitor steers, so the others wait until then.
    if (!isStill) loadRest();
    size = { width: figure.clientWidth, height: figure.clientHeight };
    present();
    syncAria();
    onReadyRef.current?.(controller);

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(loadTimer);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", run);
      control.removeEventListener("pointerenter", handlePointer);
      control.removeEventListener("pointermove", handlePointer);
      control.removeEventListener("pointerdown", handlePointer);
      control.removeEventListener("pointerleave", handleLeave);
      control.removeEventListener("pointercancel", handleLeave);
      control.removeEventListener("pointerup", handleUp);
      control.removeEventListener("keydown", handleKey);
      control.removeEventListener("focus", handleFocus);
      control.removeEventListener("blur", handleBlur);
      sweepCall?.kill();
      gsap.killTweensOf([windowBox, layer, frameBox, lamp, ...root.querySelectorAll("[data-light-chrome]")]);
      // Frames still on their way are let go, so they stop holding a connection.
      pending.forEach((image) => {
        image.onload = null;
        image.onerror = null;
        image.src = "";
      });
      pending.clear();
    };
  }, []);

  return (
    <div ref={rootRef} data-state="waiting" className={`light-portrait ${className}`}>
      <div data-light-chrome className="light-row label">
        <span className="min-w-0 truncate">{caption}</span>
        <span aria-hidden="true" className="flex shrink-0 items-center gap-2 tabular-nums">
          <span ref={wordsRef} className="max-[380px]:hidden">
            Behind
          </span>
          <span ref={angleRef} className="text-accent-text">
            −180°
          </span>
        </span>
      </div>

      <figure ref={figureRef} className="light-figure">
        <svg data-light-chrome aria-hidden="true" focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none" className="light-ring light-ring-back">
          <path d={orbitPath(false)} />
        </svg>
        <span ref={lampRef} aria-hidden="true" data-behind="true" className="light-lamp" />

        <div ref={frameRef} className="light-frame">
          <div ref={windowRef} className="light-window">
            <div ref={layerRef} className="absolute inset-0">
              <picture>
                {/* With reduced motion the portrait rests lit from the front, so that is the picture it opens on. */}
                <source media="(prefers-reduced-motion: reduce)" srcSet={frameSrc(FRONT_FRAME)} />
                {/* The first of 61 frames; the canvas above takes over from it. A plain file, already the right size. */}
                <img src={frameSrc(0)} alt={alt} width={FRAME_WIDTH} height={FRAME_HEIGHT} fetchPriority="high" decoding="async" className="absolute inset-0 size-full object-cover" />
              </picture>
              <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element -- shown only without scripts, where nothing can move the light */}
                <img src={frameSrc(FRONT_FRAME)} alt="" width={FRAME_WIDTH} height={FRAME_HEIGHT} className="absolute inset-0 size-full object-cover" />
              </noscript>
              <canvas ref={canvasRef} width={FRAME_WIDTH} height={FRAME_HEIGHT} aria-hidden="true" className="light-canvas" />
            </div>
            <span ref={barRef} aria-hidden="true" className="light-bar" />
          </div>
          <div
            ref={controlRef}
            role="slider"
            tabIndex={0}
            aria-label={controlLabel}
            aria-describedby={`${id}-help`}
            aria-orientation="horizontal"
            aria-valuemin={-180}
            aria-valuemax={180}
            aria-valuenow={-180}
            className="light-control"
          />
        </div>

        <svg data-light-chrome aria-hidden="true" focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none" className="light-ring light-ring-front">
          <defs>
            <clipPath id={`${id}-inside`}>
              <rect x="0" y="0" width="100" height="100" />
            </clipPath>
            <clipPath id={`${id}-outside`}>
              <rect x="-60" y="0" width="60" height="100" />
              <rect x="100" y="0" width="60" height="100" />
            </clipPath>
          </defs>
          {/* Over the dark of the roll-neck the ring is always light; outside the picture it takes the page's colour. */}
          <path d={orbitPath(true)} clipPath={`url(#${id}-inside)`} className="light-ring-on-photo" />
          <path d={orbitPath(true)} clipPath={`url(#${id}-outside)`} />
        </svg>
      </figure>

      <p data-light-chrome className="light-row light-hint label">
        <span aria-hidden="true" className="light-hint-mark" />
        <span className="pointer-coarse:hidden">{hintPointer}</span>
        <span className="pointer-fine:hidden">{hintTouch}</span>
      </p>
      <p id={`${id}-help`} className="sr-only">
        {controlHelp}
      </p>
    </div>
  );
}
