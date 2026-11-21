import type { Metadata } from "next";
import Link from "next/link";
import { hire } from "@/content/site";
import { DotField } from "@/components/art/DotField";
import { BuildWizard } from "@/components/start/BuildWizard";
import { Arrow } from "@/components/ui/primitives";
import type { DotBlob } from "@/lib/dots";
import "../start.css";
import "../quote-sheet.css";
import "../quote-sheet-print.css";

export const metadata: Metadata = {
  title: hire.label,
  description:
    "Already know what you want built? Put your website, store, mobile app, web application, AI system or brand together part by part, approve it, and send it to me as a brief.",
};

/** Gathered in the open middle of the top, clear of the labels at either end and of the stack beside the questions. Left out on a phone, where there is no open middle. */
const PAGE_DOTS: readonly DotBlob[] = [
  { x: 0.52, y: 0.05, radius: 0.1, strength: 0.8 },
  { x: 0.34, y: 0.0, radius: 0.05, strength: 0.55 },
];

/**
 * Start a project: "Build your stack", for visitors who already know what
 * they want. They say what they want built and answer the questions that kind
 * of project needs; the page lists every part as they go and ends on their
 * build, which they approve and send to me. No prices are shown.
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
        <p className="label">No prices · No sign-up</p>
      </div>
      <BuildWizard />
    </div>
  );
}
