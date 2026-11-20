import Link from "next/link";
import { cv } from "@/content/cv";
import { interests, onPaper, strengths } from "@/content/meet";
import { pad2 } from "@/content/projects";
import { DotField } from "@/components/art/DotField";
import { Arrow, SplitChars } from "@/components/ui/primitives";
import type { DotBlob } from "@/lib/dots";

const WORK_DOTS: readonly DotBlob[] = [{ x: 0.88, y: 0.14, radius: 0.2, strength: 0.75 }];
const PAPER_DOTS: readonly DotBlob[] = [
  { x: 0.12, y: 0.8, radius: 0.16, strength: 0.8 },
  { x: 0.5, y: 0.1, radius: 0.06, strength: 0.55 },
];

interface BlockHeadProps {
  id: string;
  title: string;
  kicker: string;
}

/** The same head the home page's blocks use: a big title with a small note on the right. */
function BlockHead({ id, title, kicker }: BlockHeadProps) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <SplitChars as="h2" id={id} text={title} className="heading block text-[clamp(2.4rem,5vw,4.5rem)] uppercase" />
      <p className="label hidden md:block">{kicker}</p>
    </div>
  );
}

/** "How I work": the three strengths, as cards that take the accent when pointed at. */
export function MeetStrengths() {
  return (
    <section aria-labelledby="meet-work" className="relative isolate border-t border-line px-4 py-16 sm:px-6 md:px-10 md:py-24">
      <DotField blobs={WORK_DOTS} seed={29} accent={0.14} className="absolute top-0 right-0 -z-10 h-64 w-full opacity-40 md:w-1/2" />
      <BlockHead id="meet-work" title={strengths.heading} kicker={`Strengths · ${pad2(strengths.items.length)}`} />
      <ol className="grid grid-cols-1 border-t border-l border-line md:grid-cols-3">
        {strengths.items.map((item, i) => (
          <li key={item} className="reveal group border-r border-b border-line bg-ink p-6 transition-colors hover:bg-accent hover:text-on-accent md:p-8">
            <p aria-hidden="true" className="font-display text-6xl font-light text-accent transition-colors group-hover:text-on-accent/50">
              {pad2(i + 1)}
            </p>
            <p className="heading mt-8 text-[clamp(1.5rem,2.1vw,2.1rem)] leading-[1.1]">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "Off the clock": the interests from the CV, as three large lines. */
export function MeetInterests() {
  return (
    <section aria-labelledby="meet-off" className="border-t border-line px-4 py-16 sm:px-6 md:px-10 md:py-24">
      <BlockHead id="meet-off" title={interests.heading} kicker={`Interests · ${pad2(interests.items.length)}`} />
      <ul className="border-t border-line">
        {interests.items.map((item, i) => (
          <li key={item} className="reveal group flex items-baseline gap-5 border-b border-line py-6 transition-colors hover:bg-paper/[0.03] md:gap-10 md:py-8">
            <span aria-hidden="true" className="label w-8 shrink-0 text-accent-text">
              {pad2(i + 1)}
            </span>
            <span className="display text-[clamp(1.8rem,4.6vw,4.4rem)] leading-[0.92] transition-transform duration-500 ease-expo group-hover:translate-x-3">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "On paper": the CV's profile line, the profile box and the way to the résumé. */
export function MeetOnPaper() {
  return (
    <section aria-labelledby="meet-paper" className="relative isolate border-t border-line px-4 py-16 sm:px-6 md:px-10 md:py-24">
      <DotField blobs={PAPER_DOTS} seed={47} accent={0.14} className="absolute inset-0 -z-10 size-full opacity-35" />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <SplitChars as="h2" id="meet-paper" text={onPaper.heading} className="heading block text-[clamp(2.4rem,5vw,4.5rem)] uppercase" />
          <p className="reveal mt-6 max-w-xl leading-relaxed text-paper/70">{cv.profile}</p>
          <div className="reveal mt-8 flex flex-wrap gap-3">
            <Link href="/cv" data-magnetic className="btn-solid">
              View résumé
              <Arrow />
            </Link>
            <Link href="/cv?print=1" className="btn-ghost">
              Download résumé
              <span className="flex items-center gap-2 text-paper/55">
                PDF
                <Arrow direction="down" />
              </span>
            </Link>
          </div>
        </div>

        <aside aria-label="Profile" className="reveal lg:col-span-5 lg:col-start-8">
          <div className="crosshair border border-line bg-ink p-5">
            <p className="label mb-3">Profile</p>
            {onPaper.rows.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2 font-mono text-[11px] tracking-[0.08em] uppercase">
                <span className="text-paper/55">{row.label}</span>
                <span className="text-right text-paper/90">{row.value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
