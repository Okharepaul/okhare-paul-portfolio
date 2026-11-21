"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { notListed } from "@/content/quote";
import { contactHref } from "@/content/site";
import { Arrow } from "@/components/ui/primitives";
import { prefersReducedMotion } from "@/lib/motion";

type NotListedProps = {
  /** "lead": the box before anything is chosen, set large. "compact": under a stack that has parts. */
  variant: "lead" | "compact";
};

/** Long enough to read twice at a calm pace. */
const HOLD_MS = 2800;

const next = (index: number): number => (index + 1) % notListed.length;

/** Pause and play, as the two bars and the triangle everyone knows. */
function PauseIcon({ isPaused }: { isPaused: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 10 10" className="size-2.5" fill="currentColor">
      {isPaused ? <path d="M2 1.2v7.6L8.6 5z" /> : <path d="M2 1.5h2v7H2zM6 1.5h2v7H6z" />}
    </svg>
  );
}

/**
 * The answer to "what if it is not here?": a line that cycles through work
 * that is not one of the tiles, word by word, and a way to reach the owner.
 * The examples change every few seconds; the button stops them (they would
 * otherwise move for longer than five seconds, which WCAG 2.2.2 asks to be
 * pausable). With reduced motion they still change, without moving. A screen
 * reader hears the whole list once instead of each change.
 */
export function NotListed({ variant }: NotListedProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const lineRef = useRef<HTMLSpanElement>(null);
  const hasChanged = useRef(false);

  // The words leave upwards, then the next example is put in.
  useEffect(() => {
    if (isPaused) return;
    let outgoing: gsap.core.Tween | null = null;
    const timer = window.setInterval(() => {
      hasChanged.current = true;
      const line = lineRef.current;
      if (!line || prefersReducedMotion()) {
        setIndex(next);
        return;
      }
      outgoing = gsap.to(line.children, {
        yPercent: -110,
        opacity: 0,
        duration: 0.32,
        ease: "power2.in",
        stagger: 0.025,
        onComplete: () => setIndex(next),
      });
    }, HOLD_MS);
    return () => {
      window.clearInterval(timer);
      // Paused while the words were leaving: put them back, or the line would stay empty until Play.
      if (outgoing) {
        outgoing.kill();
        gsap.set(outgoing.targets(), { clearProps: "transform,opacity" });
      }
    };
  }, [isPaused]);

  // ...and its words rise into place one after another.
  useLayoutEffect(() => {
    const line = lineRef.current;
    if (!line || !hasChanged.current || prefersReducedMotion()) return;
    const incoming = gsap.fromTo(
      line.children,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7, ease: "expo.out", stagger: 0.04 },
    );
    return () => {
      incoming.kill();
    };
  }, [index]);

  const isLead = variant === "lead";
  const example = notListed[index];

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <p className={isLead ? "heading text-3xl uppercase" : "label"}>Not on the list?</p>
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          aria-label={isPaused ? "Play the examples" : "Pause the examples"}
          className={`label inline-flex shrink-0 items-center gap-1.5 hover:text-paper ${isLead ? "py-2" : "-my-1 py-1"}`}
        >
          <PauseIcon isPaused={isPaused} />
          {isPaused ? "Play" : "Pause"}
        </button>
      </div>
      <p className="sr-only">For example: {notListed.join("; ")}.</p>
      <p aria-hidden="true" data-variant={variant} className={`not-listed-line ${isLead ? "mt-2 heading text-2xl text-accent-text" : "mt-1.5 text-[0.95rem] font-medium text-paper"}`}>
        {/* Keyed by the example, so its words are new elements and start from where the rise begins. */}
        <span key={example} ref={lineRef} className="not-listed-words">
          {example.split(" ").map((word, i) => (
            // A real space between the words, so the line reads and copies as a sentence.
            <Fragment key={`${word}-${i}`}>
              {i > 0 ? " " : null}
              <span className="not-listed-word">{word}</span>
            </Fragment>
          ))}
        </span>
      </p>
      <p className={`leading-relaxed text-paper/60 ${isLead ? "mt-4 max-w-[34ch] text-sm" : "mt-2 text-[0.8125rem]"}`}>
        {isLead
          ? "Plenty of good work sits between these options. Tell me what you have in mind, and I will tell you straight whether it is one I take on."
          : "Add it to your note when you send your build, or ask me first."}
      </p>
      <Link
        href={contactHref}
        className={`label group inline-flex items-center gap-2 py-1 text-accent-text hover:text-paper ${isLead ? "mt-5" : "mt-3"}`}
      >
        You can always reach out to me
        <Arrow className="size-3! transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
