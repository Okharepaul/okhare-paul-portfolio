import type { ReactNode } from "react";
import Link from "next/link";
import { DotField } from "@/components/art/DotField";
import type { DotBlob } from "@/lib/dots";
import { Arrow, SectionLabel, SplitChars } from "./primitives";

/** Gathered in the open middle of the head, clear of the title on the left and the counters on the right. */
const HEAD_DOTS: readonly DotBlob[] = [
  { x: 0.6, y: 0.34, radius: 0.15, strength: 0.85 },
  { x: 0.92, y: 0.2, radius: 0.06, strength: 0.6 },
];

interface PageHeadProps {
  back: { href: string; label: string };
  /** Small note on the right of the top row. */
  note?: ReactNode;
  index?: string;
  total?: string;
  label: string;
  title: string;
  /** Sits beside the title on wide screens. */
  aside?: ReactNode;
}

/** Top of every inner page: back link, section label and a very large title. */
export function PageHead({ back, note, index, total, label, title, aside }: PageHeadProps) {
  return (
    <header className="relative isolate px-4 pt-8 pb-12 sm:px-6 md:px-10 md:pt-12 md:pb-16">
      <DotField blobs={HEAD_DOTS} seed={title.length + 3} accent={0.14} className="absolute inset-0 -z-10 size-full opacity-40" />
      <div className="flex items-center justify-between">
        <Link href={back.href} className="label group flex items-center gap-2 hover:text-paper">
          <Arrow direction="left" className="size-3! transition-transform group-hover:-translate-x-0.5" />
          {back.label}
        </Link>
        {note ? <p className="label">{note}</p> : null}
      </div>

      <div className="mt-10 flex flex-col justify-between gap-6 md:mt-14 md:flex-row md:items-end">
        <div>
          <SectionLabel index={index} total={total}>
            {label}
          </SectionLabel>
          <SplitChars as="h1" text={title} className="display mt-6 block text-[clamp(3.6rem,13vw,14rem)]" />
        </div>
        {aside ? <div className="reveal md:mb-4 md:max-w-md">{aside}</div> : null}
      </div>
    </header>
  );
}

interface CounterBoxProps {
  items: readonly { value: number; label: string }[];
}

/** Big counts that roll up, as on the Index and Lab heads. */
export function CounterBox({ items }: CounterBoxProps) {
  return (
    <div className="grid grid-cols-2 gap-8">
      {items.map((item) => (
        <div key={item.label}>
          <span data-count={item.value} data-pad="2" className="display block text-6xl text-accent tabular-nums">
            {String(item.value).padStart(2, "0")}
          </span>
          <p className="label mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
