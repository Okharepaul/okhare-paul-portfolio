"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type ShowcaseVideoProps = {
  /** The whole recording, 1080p. */
  src: string;
  /** A lighter clip of the same recording, sent to phones instead. */
  smallSrc: string;
  /** The still shown until the recording starts. */
  poster?: string;
  /** Read out by screen readers in place of the recording. */
  label: string;
  className?: string;
};

/** The recording plays once this much of it is on screen, and stops below that. */
const VISIBLE_SHARE = 0.35;
const SMALL_SCREEN = "(max-width: 767px)";

/**
 * A project's screen recording: silent, looping, and only running while it is
 * on screen. The visitor can stop and restart it with the button, and it stays
 * stopped once they have paused it. With reduced motion it waits to be played.
 */
export function ShowcaseVideo({ src, smallSrc, poster, label, className = "" }: ShowcaseVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  /** What the visitor wants: starts as "play" unless they asked the OS for less motion. */
  const wantsPlayRef = useRef(false);
  const isVisibleRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /** Bring the player in line with what the visitor wants and whether it is on screen. */
  const sync = useCallback((): void => {
    const video = videoRef.current;
    if (!video) return;
    if (!wantsPlayRef.current || !isVisibleRef.current) {
      video.pause();
      return;
    }
    // A refused or interrupted start leaves the still in place; the button shows the real state either way.
    video.play().catch(() => undefined);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    wantsPlayRef.current = !prefersReducedMotion();

    const observer = new IntersectionObserver(
      (entries) => {
        // Several changes can arrive together: the newest one is the truth.
        isVisibleRef.current = entries.at(-1)?.isIntersecting === true;
        sync();
      },
      { threshold: VISIBLE_SHARE },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [sync]);

  const handleToggle = (): void => {
    wantsPlayRef.current = !isPlaying;
    // The button is on the recording, so a press means it is in view even if only a sliver shows.
    if (wantsPlayRef.current) isVisibleRef.current = true;
    sync();
  };

  const handleTimeUpdate = (): void => {
    const video = videoRef.current;
    const bar = barRef.current;
    if (!video || !bar || !Number.isFinite(video.duration) || video.duration === 0) return;
    bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
  };

  return (
    <div className={`relative overflow-hidden bg-ink ${className}`}>
      <video
        ref={videoRef}
        aria-label={label}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        disablePictureInPicture
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        className="absolute inset-0 size-full object-cover"
      >
        <source src={smallSrc} type="video/mp4" media={SMALL_SCREEN} />
        <source src={src} type="video/mp4" />
      </video>

      <button
        type="button"
        onClick={handleToggle}
        data-cursor={isPlaying ? "Pause" : "Play"}
        className="label absolute bottom-3 left-3 flex items-center justify-center gap-2 border border-line-strong bg-ink/85 text-paper backdrop-blur-sm transition-colors duration-300 hover:border-accent hover:text-accent max-md:size-10 md:bottom-5 md:left-4 md:px-3 md:py-2"
      >
        <svg viewBox="0 0 10 10" aria-hidden="true" className="size-2.5 fill-current">
          {isPlaying ? <path d="M1 0h3v10H1zM6 0h3v10H6z" /> : <path d="M1 0l9 5-9 5z" />}
        </svg>
        {/* On phones the recording is small, so the button is the icon alone; the words stay for screen readers. */}
        <span className="max-md:sr-only">{isPlaying ? "Pause" : "Play"}</span>
        <span className="sr-only"> the recording</span>
      </button>

      <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-paper/15">
        <span ref={barRef} className="block h-full origin-left scale-x-0 bg-accent transition-transform duration-300 ease-linear" />
      </span>
    </div>
  );
}
