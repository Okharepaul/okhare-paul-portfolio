import type { Metadata } from "next";
import Link from "next/link";
import { hire } from "@/content/site";
import { DotField } from "@/components/art/DotField";
import { QuoteWizard } from "@/components/start/QuoteWizard";
import { Arrow } from "@/components/ui/primitives";
import type { DotBlob } from "@/lib/dots";
import "../start.css";

export const metadata: Metadata = {
  title: hire.label,
  description:
    "Answer a few questions about your website, store, application or AI system and get an itemised estimate in pounds, with every line explained.",
};

/** Gathered in the open middle of the top, clear of the labels at either end and of the receipt's figures. Left out on a phone, where there is no open middle. */
const PAGE_DOTS: readonly DotBlob[] = [
  { x: 0.52, y: 0.05, radius: 0.1, strength: 0.8 },
  { x: 0.34, y: 0.0, radius: 0.05, strength: 0.55 },
];

/**
 * Start a project: a guided estimate. The visitor says what they want built
 * and answers the questions that kind of project needs; the page prices it
 * line by line as they go and ends on a quote they can save or send.
 */
export default function StartAProjectPage() {
  return (
    <div className="gutter relative isolate pt-8 pb-24 md:pt-10">
      <DotField blobs={PAGE_DOTS} seed={61} accent={0.14} className="no-print absolute inset-x-0 top-0 -z-10 h-[22rem] w-full opacity-40 max-sm:hidden" />
      <div className="start-chrome mb-8 flex items-center justify-between gap-6">
        <Link href="/" className="label group flex items-center gap-2 hover:text-paper">
          <Arrow direction="left" className="size-3! transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
        <p className="label">GBP · No sign-up</p>
      </div>
      <QuoteWizard />
    </div>
  );
}
