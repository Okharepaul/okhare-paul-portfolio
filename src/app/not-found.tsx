import Link from "next/link";
import { Arrow, SectionLabel } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <section className="gutter lattice flex min-h-[calc(100svh-var(--chrome-h))] flex-col justify-end pb-16">
      <SectionLabel>Route not found</SectionLabel>
      <h1 className="display mt-4 text-[clamp(8rem,30vw,26rem)] leading-[0.76]">
        4<span className="text-accent">0</span>4
      </h1>
      <p className="mt-6 max-w-[40ch] text-lg text-muted">
        No page lives at this address. It may have moved, or the link may be mistyped.
      </p>
      <div className="mt-8 flex flex-wrap gap-2.5">
        <Link href="/" className="btn btn-solid">
          Go to the home page
          <Arrow />
        </Link>
        <Link href="/projects" className="btn">
          See all projects
        </Link>
      </div>
    </section>
  );
}
