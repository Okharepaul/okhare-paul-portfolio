import type { ReactNode } from "react";
import { PageHead } from "./PageHead";

interface ProsePageProps {
  label: string;
  title: string;
  updated: string;
  children: ReactNode;
}

/** Layout for the short legal pages: large title, then a narrow reading column. */
export function ProsePage({ label, title, updated, children }: ProsePageProps) {
  return (
    <>
      <PageHead back={{ href: "/", label: "Back to home" }} note={`Updated ${updated}`} label={label} title={title} />
      <div className="gutter py-16 md:py-24">
        <div className="flex max-w-[68ch] flex-col gap-12">{children}</div>
      </div>
    </>
  );
}

interface ProseSectionProps {
  title: string;
  children: ReactNode;
}

export function ProseSection({ title, children }: ProseSectionProps) {
  return (
    <section data-reveal>
      <h2 className="display-title border-b border-line pb-3 text-3xl">{title}</h2>
      <div className="mt-5 flex flex-col gap-4 text-muted [&_a]:text-fg [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-medium [&_strong]:text-fg">
        {children}
      </div>
    </section>
  );
}
