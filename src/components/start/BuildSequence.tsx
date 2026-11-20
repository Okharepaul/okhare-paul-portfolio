"use client";

import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type BuildSequenceProps = {
  /** Called once the last line has been ticked off. */
  onDone: () => void;
};

/** What is said while the estimate is put together. Each is something the quote really does. */
const LINES = ["Pricing the work", "Writing what each line covers", "Setting the running costs apart", "Totalling in pounds"] as const;

const LINE_MS = 430;
const HOLD_MS = 360;

/**
 * The short pause between the last answer and the finished estimate: four
 * lines ticked off one after another. It is a beat of anticipation, not a
 * wait for anything, so with reduced motion it is skipped entirely.
 */
export function BuildSequence({ onDone }: BuildSequenceProps) {
  const [done, setDone] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const skip = window.setTimeout(onDone, 0);
      return () => window.clearTimeout(skip);
    }
    const timers = [
      ...LINES.map((_line, i) => window.setTimeout(() => setDone(i + 1), LINE_MS * (i + 1))),
      window.setTimeout(onDone, LINE_MS * LINES.length + HOLD_MS),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [onDone]);

  return (
    <div className="flex min-h-[26rem] flex-col justify-center py-10">
      {/* Said once to a screen reader; the counter and the ticking lines are for the eye. */}
      <p role="status" className="sr-only">
        Building your estimate
      </p>
      <p aria-hidden="true" className="label">
        <span className="text-accent-text">{String(Math.min(done + 1, LINES.length)).padStart(2, "0")}</span> / {String(LINES.length).padStart(2, "0")} · Working
      </p>
      <p aria-hidden="true" className="display mt-4 text-[clamp(2.7rem,6.4vw,6.5rem)]">
        Building your estimate
      </p>
      <ul aria-hidden="true" className="mt-9 flex flex-col gap-3.5">
        {LINES.map((line, i) => {
          const state = i < done ? "done" : i === done ? "doing" : "waiting";
          return (
            <li key={line} className="build-line" data-state={state}>
              <span aria-hidden="true" className="build-box" />
              {line}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
