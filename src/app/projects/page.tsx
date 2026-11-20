import type { Metadata } from "next";
import Link from "next/link";
import { pad2, projects, repos } from "@/content/projects";
import { ProjectStack } from "@/components/projects/ProjectStack";
import { HireBand } from "@/components/ui/HireBand";
import { MeetLink } from "@/components/ui/MeetLink";
import { CounterBox } from "@/components/ui/PageHead";
import { Arrow, SectionLabel, SplitChars } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Projects",
  description: "Index of case studies and public repositories by Okhare Paul: research, client work, products and production code.",
};

const rowGrid = "grid grid-cols-[2.5rem_1fr_1.5rem] items-start gap-4 md:grid-cols-[4rem_1fr_10rem_6rem_2rem] md:gap-6";

/** The page's heading, set beside the stack of titles (above it on small screens). */
function IndexAside() {
  const entries = projects.length + repos.length;
  return (
    <>
      <div className="flex items-center justify-between gap-6">
        <Link href="/" className="label group flex items-center gap-2 hover:text-paper">
          <Arrow direction="left" className="size-3! transition-transform group-hover:-translate-x-0.5" />
          Back to home
        </Link>
        <p className="label lg:hidden">
          {pad2(repos.length)} {repos.length === 1 ? "repository" : "repositories"}
        </p>
      </div>

      <div className="mt-10 lg:mt-0">
        <SectionLabel index="01" total="02">
          All projects
        </SectionLabel>
        <SplitChars as="h1" text="Index" className="display mt-5 block text-[clamp(3.6rem,7vw,7.5rem)]" />
        <div className="reveal mt-6 max-w-xs">
          <CounterBox
            items={[
              { value: projects.length, label: "Case studies" },
              { value: entries, label: "Entries" },
            ]}
          />
        </div>
        <MeetLink className="reveal mt-6" line="The engineer behind every entry" />
      </div>
    </>
  );
}

export default function ProjectsPage() {
  return (
    <>
      <ProjectStack aside={<IndexAside />} />

      <HireBand as="h2" className="mb-24 border-y" />

      <section aria-labelledby="github-heading" className="px-4 pb-24 sm:px-6 md:px-10">
        <SectionLabel index="02" total="02">
          GitHub
        </SectionLabel>
        <SplitChars as="h2" id="github-heading" text="Repositories" className="display mt-6 block text-[clamp(2.8rem,8vw,7rem)]" />
        <ul className="mt-10 border-t border-line">
          {repos.map((repo, i) => {
            const row = (
              <>
                <span className="label pt-2 text-paper/55">{pad2(projects.length + i + 1)}</span>
                <span className="min-w-0">
                  <span className="display block truncate text-[clamp(2rem,4.6vw,4.4rem)]">{repo.name}</span>
                  {repo.line ? <span className="mt-1 line-clamp-1 max-w-2xl text-sm text-paper/50">{repo.line}</span> : null}
                </span>
                <span className="label hidden pt-3 md:block">{repo.language ?? "—"}</span>
                <span className="label hidden pt-3 md:block">GitHub</span>
                <span />
              </>
            );
            return (
              <li key={repo.name}>
                {repo.url ? (
                  <a href={repo.url} target="_blank" rel="noopener noreferrer" className={`group border-b border-line py-5 transition-colors hover:bg-paper/[0.03] md:py-6 ${rowGrid}`}>
                    {row}
                  </a>
                ) : (
                  <div className={`border-b border-line py-5 md:py-6 ${rowGrid}`}>{row}</div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="label mt-6">More repositories are added here as they go public.</p>
      </section>
    </>
  );
}
