"use client";

import { pad2 } from "@/content/projects";
import type { Build } from "@/lib/build";
import { CountUp } from "./CountUp";
import { NotListed } from "./NotListed";

type LiveBuildProps = {
  /** The build for the answers so far, or null before the first answer. */
  build: Build | null;
};

const partsLabel = (count: number): string => `${count} ${count === 1 ? "part" : "parts"}`;

/**
 * The visitor's stack, filling as the questions are answered: a slip that
 * gains a line for every part, each marked with where it came from. Under it,
 * or in place of it before anything is chosen, the line that cycles through
 * work that is not on the list. Beside the questions on large screens, under
 * them on small ones.
 */
export function LiveBuild({ build }: LiveBuildProps) {
  return (
    // Never taller than the screen: the parts scroll inside it, so the count and the way to reach me stay in view.
    <aside aria-label="Your stack so far" className="receipt crosshair flex flex-col lg:max-h-[calc(100svh-7.5rem)]">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <p className="label flex items-center gap-2.5 text-paper">
          <span aria-hidden="true" className="size-1.5 animate-[blink_1s_steps(1)_infinite] rounded-full bg-accent" />
          Your stack
        </p>
        <p className="label">{build ? partsLabel(build.parts.length) : "Live"}</p>
      </header>

      {build ? (
        <>
          <div className="px-5 pt-5">
            <p className="label">
              <span className="text-accent-text">{build.type.code}</span> · Project
            </p>
            <p className="heading mt-2 text-3xl uppercase">{build.type.label}</p>
          </div>

          <ul data-lenis-prevent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-5">
            {build.parts.map((part, i) => (
              <li key={part.id} className="receipt-row" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                <span>
                  <span className="text-paper/45">{pad2(i + 1)}</span> {part.title}
                </span>
                <span className="receipt-tag">{part.section}</span>
              </li>
            ))}
          </ul>

          <div className="border-t border-line px-5 py-5">
            <div className="flex items-end justify-between gap-4">
              <p className="label pb-2">Parts in your stack</p>
              <CountUp
                value={build.parts.length}
                announce={`${partsLabel(build.parts.length)} in your stack`}
                className="display block text-[clamp(3rem,4.6vw,4.5rem)] leading-none text-accent"
              />
            </div>
            <div className="mt-4 border-t border-line pt-4">
              <NotListed variant="compact" />
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="px-5 pt-6 text-sm leading-relaxed text-paper/60">
            Choose what we are building and your stack starts here, one part at a time.
          </p>
          <div className="mt-6 border-t border-line px-5 py-6">
            <NotListed variant="lead" />
          </div>
        </>
      )}
    </aside>
  );
}
