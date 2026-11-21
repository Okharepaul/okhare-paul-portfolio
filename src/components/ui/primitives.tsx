import type { ElementType, ReactNode } from "react";

interface ClassNameProps {
  className?: string;
}

/** The OP mark (symbol). Inherits the current text colour. */
export function Logo({ className }: ClassNameProps) {
  return (
    <svg className={className} viewBox="26 42 204 172" aria-hidden="true" focusable="false">
      {/* Placed over the same box as the frame's view: without x, y, width and height a <use> starts at 0,0
          and the symbol's own view is shifted 26 and 42 units off, cutting the head and the left arm. */}
      <use href="/mark.svg#m" x="26" y="42" width="204" height="172" />
    </svg>
  );
}

/** The boxed initials used in the nav, footer and loader strip. */
export function Monogram({ className = "" }: ClassNameProps) {
  return (
    <span className={`border border-paper/70 px-1.5 pt-1 pb-0.5 font-display leading-none font-semibold tracking-tight uppercase ${className}`}>
      OP
    </span>
  );
}

const CORNER_POSITIONS = [
  "-left-[5px] -top-[5px]",
  "-right-[5px] -top-[5px]",
  "-bottom-[5px] -left-[5px]",
  "-bottom-[5px] -right-[5px]",
] as const;

/** Registration marks on the four corners of a `relative` box (inner pages). */
export function Corners({ className = "" }: ClassNameProps) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      {CORNER_POSITIONS.map((position) => (
        <span key={position} className={`plus absolute size-[9px] ${position}`} />
      ))}
    </span>
  );
}

interface SectionLabelProps extends ClassNameProps {
  index?: string;
  total?: string;
  children: ReactNode;
}

/** "| [ 01 / 04 ] · About" */
export function SectionLabel({ index, total, children, className = "" }: SectionLabelProps) {
  return (
    <div className={`label flex items-center gap-3 ${className}`}>
      <span aria-hidden="true" className="h-3 w-px bg-accent" />
      {index ? (
        <>
          <span aria-hidden="true" className="shrink-0 whitespace-nowrap">
            [ <span className="text-accent-text">{index}</span>
            {total ? ` / ${total}` : ""} ]
          </span>
          <span aria-hidden="true">·</span>
        </>
      ) : null}
      <span>{children}</span>
    </div>
  );
}

interface SplitCharsProps extends ClassNameProps {
  text: string;
  as?: ElementType;
  /** "intro" waits for the loader; "scroll" plays when the text enters the viewport. */
  trigger?: "intro" | "scroll";
  /** Proximity weight: "min,max,radius". The cursor thickens nearby letters. */
  weight?: string;
  id?: string;
}

/**
 * Text split into words and masked letters for the letter-by-letter reveal.
 * Rendered on the server; the full text stays available to screen readers.
 */
export function SplitChars({ text, as: Tag = "span", className = "", trigger = "scroll", weight, id }: SplitCharsProps) {
  const words = text.split(" ");
  return (
    <Tag id={id} className={className} data-chars={trigger} data-weight={weight}>
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span
          // Words can repeat, so the position is part of the key.
          key={`${word}-${i}`}
          aria-hidden="true"
          className="-mt-[0.14em] inline-block overflow-hidden pt-[0.14em] pb-[0.06em] align-top whitespace-nowrap"
        >
          {Array.from(word).map((character, j) => (
            <span key={`${character}-${j}`} className="char">
              {character}
            </span>
          ))}
          {i < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </Tag>
  );
}

type ArrowDirection = "right" | "up-right" | "down" | "left" | "up";

const ARROW_ROTATION: Record<ArrowDirection, string> = {
  right: "rotate-0",
  "up-right": "-rotate-45",
  down: "rotate-90",
  left: "rotate-180",
  up: "-rotate-90",
};

export function Arrow({ direction = "right", className = "" }: ClassNameProps & { direction?: ArrowDirection }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={`size-3.5 shrink-0 ${ARROW_ROTATION[direction]} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function hash(text: string): number {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

const BARCODE_BARS = 34;

/** Decorative barcode whose bars are derived from `value`. */
export function Barcode({ value, className = "" }: ClassNameProps & { value: string }) {
  let seed = hash(value);
  let x = 0;
  const bars: { x: number; width: number }[] = [];
  for (let i = 0; i < BARCODE_BARS; i += 1) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const width = 1 + ((seed >>> 29) % 3);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const gap = 1 + ((seed >>> 30) % 2);
    bars.push({ x, width });
    x += width + gap;
  }
  return (
    <svg aria-hidden="true" focusable="false" viewBox={`0 0 ${x} 20`} preserveAspectRatio="none" className={className}>
      {bars.map((bar) => (
        <rect key={bar.x} x={bar.x} y="0" width={bar.width} height="20" fill="currentColor" />
      ))}
    </svg>
  );
}

/** Small uppercase tag. */
export function Chip({ children, className = "" }: ClassNameProps & { children: ReactNode }) {
  return <span className={`chip ${className}`}>{children}</span>;
}
