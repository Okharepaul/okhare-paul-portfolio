"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { pad2, projects } from "@/content/projects";
import { prefersReducedMotion } from "@/lib/motion";
import { isSiteReady, onSiteReady } from "@/lib/ready";
import {
  LEAVE_CANCELLED_EVENT,
  LEAVE_SECONDS,
  STACK_LEAVE_SECONDS,
  STACK_OUTRO_AFTER_MS,
  onPageLeave,
  stackDelay,
  stackLines,
} from "@/lib/transition";
import { StackPreview } from "./StackPreview";

/**
 * "intro": the stage drops in and the titles swing open. "wait": held hidden
 * until the site's loader has lifted. "idle": at rest, answering the pointer.
 * "outro": a project was chosen. "outro-fast": the visitor is leaving by
 * another link.
 */
type StackPhase = "intro" | "wait" | "idle" | "outro" | "outro-fast";

/** The arrival takes this long before the titles start answering the pointer. */
const INTRO_MS = 2900;
/** Moving from one title to the next crosses a sliver of empty space: the picture waits this long before giving up. */
const PREVIEW_LINGER_MS = 140;

type ProjectStackProps = {
  /** The page's own heading and notes, shown beside the stack (above it on small screens). */
  aside: ReactNode;
};

const wait = (ms: number): Promise<void> => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * The full list of projects as a stack of very large titles seen in
 * perspective, each hinged on its right edge. Arriving, the stage drops in
 * while the titles swing open from the bottom up. The title under the pointer
 * turns a little towards the visitor and empties to an outline, and its
 * picture appears beside it. Choosing one turns it face-on while the others
 * swing shut and fade from the bottom up; then it shrinks away, the stage
 * lifts, and the case study arrives.
 */
export function ProjectStack({ aside }: ProjectStackProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<StackPhase>("intro");
  const [selected, setSelected] = useState<number | null>(null);
  // Pointer and keyboard focus are tracked apart: the picture stays for whichever still holds a title.
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const active = hovered ?? focused;
  /** Where the middle of the hovered title sits on screen, for the picture to line up with. */
  const [previewY, setPreviewY] = useState(0);
  const timers = useRef<number[]>([]);
  const lingerTimer = useRef(0);

  // Arrival. On a first visit the loader covers the page, so the entrance is held and played once it has lifted.
  useEffect(() => {
    const later = (callback: () => void, ms: number): void => {
      timers.current.push(window.setTimeout(callback, ms));
    };
    const wasCovered = !isSiteReady();
    const stopWaiting = onSiteReady(() => {
      if (prefersReducedMotion()) {
        later(() => setPhase("idle"), 0);
        return;
      }
      if (!wasCovered) {
        later(() => setPhase("idle"), INTRO_MS);
        return;
      }
      // Taking the entrance away for a frame and putting it back plays it again from the start.
      setPhase("wait");
      later(() => setPhase("intro"), 50);
      later(() => setPhase("idle"), 50 + INTRO_MS);
    });
    const pending = timers.current;
    return () => {
      stopWaiting();
      pending.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // The vanishing point stays level with the middle of the screen as the page scrolls.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const update = (): void => {
      frame = 0;
      const top = root.getBoundingClientRect().top;
      root.style.setProperty("--stack-origin-y", `${Math.round(window.innerHeight / 2 - top)}px`);
    };
    const schedule = (): void => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Leaving. A project chosen from the stack gets the full exit; any other link gets the short one.
  useEffect(() => {
    const stopLeaving = onPageLeave((anchor) => {
      const root = rootRef.current;
      if (!root) return null;
      setHovered(null);
      setFocused(null);
      const index = root.contains(anchor) ? Number(anchor.dataset.stackIndex) : Number.NaN;
      if (Number.isInteger(index)) {
        setSelected(index);
        timers.current.push(window.setTimeout(() => setPhase("outro"), STACK_OUTRO_AFTER_MS));
        return { done: wait(STACK_LEAVE_SECONDS * 1000), isTakeover: true };
      }
      setPhase("outro-fast");
      return { done: wait(LEAVE_SECONDS * 1000), isTakeover: false };
    });
    const handleCancelled = (): void => {
      setSelected(null);
      setPhase("idle");
    };
    window.addEventListener(LEAVE_CANCELLED_EVENT, handleCancelled);
    return () => {
      stopLeaving();
      window.removeEventListener(LEAVE_CANCELLED_EVENT, handleCancelled);
    };
  }, []);

  const aimPreview = (plane: HTMLElement): void => {
    const rect = plane.getBoundingClientRect();
    setPreviewY(rect.top + rect.height / 2);
  };

  const handleEnter = (index: number, plane: HTMLElement): void => {
    if (phase !== "idle") return;
    window.clearTimeout(lingerTimer.current);
    aimPreview(plane);
    setHovered(index);
  };

  const handleLeave = (index: number): void => {
    window.clearTimeout(lingerTimer.current);
    lingerTimer.current = window.setTimeout(() => setHovered((current) => (current === index ? null : current)), PREVIEW_LINGER_MS);
  };

  const handleFocus = (index: number, plane: HTMLElement): void => {
    if (phase !== "idle") return;
    aimPreview(plane);
    setFocused(index);
  };

  const handleBlur = (index: number): void => setFocused((current) => (current === index ? null : current));

  useEffect(() => () => window.clearTimeout(lingerTimer.current), []);

  const isPreviewing = phase === "idle" && active !== null;

  /** The whole title plane is the target, not only its letters. */
  const handlePlaneClick = (event: MouseEvent<HTMLDivElement>): void => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("a")) return;
    // "Open in a new tab" and the like only work on the link itself: a relayed click would lose the key held.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.currentTarget.querySelector("a")?.click();
  };

  return (
    <section aria-label="Case studies" className="relative lg:grid">
      {/* Beside the stack on large screens, pinned under the header for as long as the stack is passing; above it on small ones.
          Both share one grid cell, so the pinned words can never travel past the end of the list into what follows. */}
      <div className="pointer-events-none relative z-0 px-4 pt-8 sm:px-6 md:px-10 lg:sticky lg:top-16 lg:[grid-area:1/1] lg:h-[calc(100svh-4rem)] lg:w-[44vw] lg:self-start lg:pt-12 lg:pb-12 [&_a]:pointer-events-auto">
        {/* The page's own words step back while a project's picture has the space. */}
        <div className={`transition-opacity duration-500 lg:flex lg:h-full lg:flex-col lg:justify-between ${isPreviewing ? "lg:opacity-0" : ""}`}>
          {aside}
        </div>
        <StackPreview active={isPreviewing ? active : null} y={previewY} />
      </div>

      <div ref={rootRef} data-phase={phase} data-exit="none" className="stack pointer-events-none z-10 min-w-0 lg:[grid-area:1/1]">
        <div className="stack-container">
          <div className="stack-stage">
            <ul className="stack-list">
              {projects.map((project, index) => (
                <li
                  key={project.slug}
                  data-selected={selected === index ? "" : undefined}
                  className="stack-item"
                  style={{ "--stack-delay": `${stackDelay(index, projects.length).toFixed(3)}s` } as CSSProperties}
                >
                  <div
                    data-cursor="View"
                    className="stack-plane pointer-events-auto cursor-pointer"
                    onClick={handlePlaneClick}
                    onPointerEnter={(event) => handleEnter(index, event.currentTarget)}
                    onPointerLeave={() => handleLeave(index)}
                    onFocus={(event) => handleFocus(index, event.currentTarget)}
                    onBlur={() => handleBlur(index)}
                  >
                    <Link href={`/project/${project.slug}`} data-stack-index={index} className="stack-link">
                      <span aria-hidden="true" className="stack-info">
                        <b>{pad2(index + 1)}</b>
                        {/^\d/.test(project.year) ? `  ${project.year}` : ""}
                      </span>
                      <span aria-hidden="true" className="stack-slash" />
                      {stackLines(project.title).map((line, lineIndex) => (
                        <span key={line}>
                          {lineIndex > 0 ? <br /> : null}
                          {line}
                        </span>
                      ))}
                      <span className="sr-only">: {project.tagline}</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
