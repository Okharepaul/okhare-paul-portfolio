"use client";

import { useEffect, useRef, useState } from "react";
import { hasFinePointer, prefersReducedMotion, savesData } from "@/lib/motion";

type PreviewVideoProps = {
  /** A small clip in /public. Nothing is downloaded until it is asked to play. */
  src: string;
  /**
   * Leave unset for a clip inside a link, which plays on hover or focus. Set
   * it (true or false) for a clip that some other element starts and stops.
   */
  isActive?: boolean;
};

/** A pointer passing over a row should not start a download: wait this long first. */
const HOVER_DELAY_MS = 140;
/** A clip started by another element waits for the picture under it to finish resolving out of dots. */
const DRIVEN_DELAY_MS = 1100;
/** On touch screens a clip plays while its row crosses this band across the middle of the screen. */
const TOUCH_BAND = "-42% 0px -42% 0px";
/**
 * On touch screens the clip starts by itself, so it must also stop by itself:
 * moving content that nobody asked for may run for five seconds at most.
 */
const TOUCH_PLAY_MS = 5000;

/** Only one preview runs at a time: starting one releases whichever was running. */
let running: { video: HTMLVideoElement; release: () => void } | null = null;

/**
 * A silent clip laid over a project's thumbnail. With a mouse it plays while
 * the link around it is hovered or has keyboard focus, and fades back to the
 * thumbnail on leaving. On touch screens it plays for a few seconds when its
 * row reaches the middle of the screen. It never plays with reduced motion or
 * data saving on.
 */
export function PreviewVideo({ src, isActive }: PreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isShowing, setIsShowing] = useState(false);
  const isDriven = isActive !== undefined;
  /** The running clip's "play or stop", for the prop-driven case to call. */
  const aimRef = useRef<((next: boolean, delay?: number) => void) | null>(null);
  const isActiveRef = useRef(isActive === true);

  useEffect(() => {
    isActiveRef.current = isActive === true;
    if (isActive !== undefined) aimRef.current?.(isActive, DRIVEN_DELAY_MS);
  }, [isActive]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || prefersReducedMotion() || savesData()) return;

    const trigger = video.closest<HTMLElement>("a") ?? video;
    const usesHover = hasFinePointer();
    let startTimer = 0;
    let stopTimer = 0;
    let isWanted = false;

    const stop = (): void => {
      window.clearTimeout(startTimer);
      window.clearTimeout(stopTimer);
      video.pause();
    };

    const start = (): void => {
      if (running && running.video !== video) running.release();
      // Released by the next preview to start: forget the wish, so coming back to this row starts it again.
      running = {
        video,
        release: () => {
          isWanted = false;
          stop();
        },
      };
      // Always from the top, so the clip picks up where the thumbnail leaves off.
      if (video.readyState > 0) video.currentTime = 0;
      // A refused or interrupted start simply leaves the thumbnail showing.
      video.play().catch(() => undefined);
      if (!usesHover) stopTimer = window.setTimeout(stop, TOUCH_PLAY_MS);
    };

    const aim = (next: boolean, delay = 0): void => {
      if (next === isWanted) return;
      isWanted = next;
      stop();
      if (next) startTimer = window.setTimeout(start, delay);
    };

    // The clip is only shown once frames are really arriving, never as a black box.
    const handlePlaying = (): void => setIsShowing(isWanted);
    // Any stop, ours or the browser's, hands the box back to the thumbnail.
    const handlePause = (): void => {
      setIsShowing(false);
      if (running?.video === video) running = null;
    };
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("pause", handlePause);

    // Pointer and focus are tracked apart: the clip runs while either holds the link.
    let isHovered = false;
    let isFocused = false;
    const settle = (): void => aim(isHovered || isFocused, HOVER_DELAY_MS);
    const handleEnter = (): void => {
      isHovered = true;
      settle();
    };
    const handleLeave = (): void => {
      isHovered = false;
      settle();
    };
    const handleFocus = (): void => {
      // Keyboard focus only: a mouse click also focuses the link, and should not keep the clip running.
      isFocused = trigger.matches(":focus-visible");
      settle();
    };
    const handleBlur = (): void => {
      isFocused = false;
      settle();
    };
    let observer: IntersectionObserver | null = null;

    if (isDriven) {
      aimRef.current = aim;
      aim(isActiveRef.current, DRIVEN_DELAY_MS);
    } else if (usesHover) {
      trigger.addEventListener("pointerenter", handleEnter);
      trigger.addEventListener("pointerleave", handleLeave);
      trigger.addEventListener("focus", handleFocus);
      trigger.addEventListener("blur", handleBlur);
    } else {
      // Several changes can arrive together: the newest one is the truth.
      observer = new IntersectionObserver((entries) => aim(entries.at(-1)?.isIntersecting === true), { rootMargin: TOUCH_BAND });
      observer.observe(video);
    }

    return () => {
      aimRef.current = null;
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("pause", handlePause);
      stop();
      if (running?.video === video) running = null;
      observer?.disconnect();
      trigger.removeEventListener("pointerenter", handleEnter);
      trigger.removeEventListener("pointerleave", handleLeave);
      trigger.removeEventListener("focus", handleFocus);
      trigger.removeEventListener("blur", handleBlur);
    };
  }, [isDriven]);

  return (
    <video
      ref={videoRef}
      src={src}
      aria-hidden="true"
      tabIndex={-1}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ${isShowing ? "opacity-100" : "opacity-0"}`}
    />
  );
}
