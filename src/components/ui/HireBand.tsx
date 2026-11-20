import type { ElementType } from "react";
import Link from "next/link";
import { hire } from "@/content/site";
import { DotField } from "@/components/art/DotField";
import type { DotBlob } from "@/lib/dots";
import { Arrow, SplitChars } from "./primitives";

/** Gathered on the right, behind the button, clear of the heading. */
const BAND_DOTS: readonly DotBlob[] = [
  { x: 0.82, y: 0.5, radius: 0.16, strength: 0.9 },
  { x: 0.52, y: 0.18, radius: 0.06, strength: 0.6 },
];

interface HireBandProps {
  /** Heading level that fits where the band sits. */
  as?: ElementType;
  className?: string;
}

/**
 * The "hire me" call to action as a full-width band: a big line, one sentence
 * and the orange button. Dropped in wherever a visitor has just seen what the
 * work looks like. The wording and the link live in `content/site.ts`.
 */
export function HireBand({ as = "h3", className = "" }: HireBandProps) {
  return (
    <aside aria-label={hire.label} className={`relative isolate overflow-hidden border-line px-4 py-14 sm:px-6 md:px-10 md:py-20 ${className}`}>
      <DotField blobs={BAND_DOTS} seed={61} accent={0.2} className="absolute inset-0 -z-10 size-full opacity-40" />
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <p className="label mb-5">
            [ <span className="text-accent-text">Hire</span> ] · {hire.kinds.join(" · ")}
          </p>
          <SplitChars as={as} text={hire.heading} className="display block text-[clamp(2.8rem,7vw,7rem)]" />
          <p className="reveal mt-5 max-w-md leading-relaxed text-paper/70">{hire.copy}</p>
        </div>
        <Link href={hire.href} data-magnetic className="btn-accent reveal shrink-0 self-start px-7! py-4! md:self-auto">
          {hire.label}
          <Arrow />
        </Link>
      </div>
    </aside>
  );
}
