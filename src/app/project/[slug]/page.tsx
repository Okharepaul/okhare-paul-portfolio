import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, nextProject, pad2, projects, type Project } from "@/content/projects";
import { DotField } from "@/components/art/DotField";
import { PixelFigure } from "@/components/art/PixelFigure";
import type { DotBlob } from "@/lib/dots";
import { PLATE_ART } from "@/lib/plate-art";
import { ShowcaseVideo } from "@/components/projects/ShowcaseVideo";
import { SiteLink } from "@/components/projects/SiteLink";
import { SwarmField } from "@/components/swarm/SwarmField";
import { HireBand } from "@/components/ui/HireBand";
import { MeetLink } from "@/components/ui/MeetLink";
import { Arrow, Chip, SectionLabel, SplitChars } from "@/components/ui/primitives";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams(): { slug: string }[] {
  return projects.map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const found = getProject(slug);
  if (!found) return {};
  const { project } = found;
  return { title: `${project.title} — ${project.subtitle}`, description: project.summary ?? project.tagline };
}

interface NumberedListProps {
  items: readonly string[];
}

function NumberedList({ items }: NumberedListProps) {
  return (
    <ol className="mt-10 border-t border-line">
      {items.map((item, i) => (
        <li key={item} data-reveal className="grid grid-cols-[3rem_1fr] items-baseline gap-4 border-b border-line py-5 md:grid-cols-[6rem_1fr]">
          <span className="display text-3xl text-accent tabular-nums">{pad2(i + 1)}</span>
          <span className="display-title text-[clamp(1.25rem,2.2vw,1.875rem)] leading-snug">{item}</span>
        </li>
      ))}
    </ol>
  );
}

interface Block {
  key: string;
  label: string;
  heading?: string;
  body: React.ReactNode;
}

function buildBlocks(project: Project): Block[] {
  const blocks: Block[] = [
    {
      key: "about",
      label: "About the project",
      body: project.summary ? (
        <div className="grid gap-8 md:grid-cols-12">
          <p data-reveal className="display-title text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.12] md:col-span-6">
            {project.summary}
          </p>
          <p data-reveal className="text-muted md:col-span-5 md:col-start-8">
            {project.story}
          </p>
        </div>
      ) : (
        <p data-reveal className="display-title max-w-[32ch] text-[clamp(1.5rem,2.6vw,2.25rem)] leading-[1.12] text-muted">
          This case study is being written. The full story, what it does and how it was solved land here soon.
        </p>
      ),
    },
  ];

  if (project.does) {
    blocks.push({ key: "does", label: "Main features", heading: "What it does", body: <NumberedList items={project.does} /> });
  }
  if (project.solved) {
    blocks.push({ key: "solved", label: "Approach", heading: "How it was solved", body: <NumberedList items={project.solved} /> });
  }
  if (project.results) {
    blocks.push({
      key: "results",
      label: "Results",
      body: (
        <p data-reveal className="display-title max-w-[36ch] text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.08]">
          {project.results}
        </p>
      ),
    });
  }
  if (project.stack || project.stackNote) {
    blocks.push({
      key: "stack",
      label: "Technologies",
      heading: "Stack",
      body: (
        <div className="mt-10">
          {project.stack ? (
            <dl className="border-t border-line">
              {project.stack.map((group) => (
                <div key={group.group} data-reveal className="grid gap-3 border-b border-line py-5 md:grid-cols-[12rem_1fr]">
                  <dt className="label text-muted">{group.group}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <Chip key={item}>{item}</Chip>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted">{project.stackNote}</p>
          )}
        </div>
      ),
    });
  }
  return blocks;
}

/** The line above the last buttons on a case study: what is left to see. */
function closingLine(project: Project): string {
  if (project.site === "soon") return "Not public yet. The link goes here the day it launches.";
  if (project.site) return "The case study is the how. The site is the proof.";
  return "That is the work. Now meet the person who built it.";
}

/** Gathered to the right of the title, below the "Case study" line so that stays easy to read. */
const HEAD_DOTS: readonly DotBlob[] = [
  { x: 0.74, y: 0.56, radius: 0.17, strength: 0.85 },
  { x: 0.5, y: 0.2, radius: 0.06, strength: 0.6 },
];

/** Wide and low: points keep clear of the caption strip. */
const FIGURE_REGION = { x0: 0.05, y0: 0.1, x1: 0.95, y1: 0.9 };

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const found = getProject(slug);
  if (!found) notFound();

  const { project, index } = found;
  const next = nextProject(index);
  const blocks = buildBlocks(project);
  const total = pad2(projects.length);

  return (
    <article>
      <header className="gutter relative isolate pt-8 pb-12 md:pt-10">
        <DotField blobs={HEAD_DOTS} seed={index + 51} accent={0.14} className="absolute inset-0 -z-10 size-full opacity-40" />
        <div className="label flex items-center justify-between gap-6 text-muted">
          <Link href="/projects" className="flex items-center gap-2 transition-colors duration-300 hover:text-accent">
            <Arrow direction="left" />
            Back
          </Link>
          <p>
            Case study · <span className="text-accent-text">{pad2(index + 1)}</span> / {total}
          </p>
        </div>

        <SplitChars as="h1" text={project.title} className="display mt-10 block text-[clamp(3.6rem,13vw,14rem)] md:mt-14" />
        <p data-reveal className="display-title mt-5 max-w-[28ch] text-[clamp(1.5rem,3vw,2.5rem)] text-muted">
          {project.subtitle}
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-5">
            <dl data-reveal className="label max-w-md border-t border-line">
              <div className="flex justify-between gap-6 border-b border-line py-3">
                <dt className="text-faint">Year</dt>
                <dd className="text-fg">{project.year}</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-line py-3">
                <dt className="text-faint">Focus</dt>
                <dd className="text-fg">{project.tag}</dd>
              </div>
              <div className="flex justify-between gap-6 border-b border-line py-3">
                <dt className="text-faint">Status</dt>
                <dd className="text-fg">{project.status ?? (project.site === "soon" ? "In development" : project.site ? "Live" : "Complete")}</dd>
              </div>
            </dl>
            {project.site ? (
              <div data-reveal className="mt-6">
                <SiteLink site={project.site} title={project.title} variant="btn-accent" />
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-4 md:col-span-6 md:col-start-7">
            <div data-reveal className="md:self-end">
              <MeetLink line={`Who built ${project.title}`} />
            </div>
            {project.notice ? (
              <aside data-reveal aria-label={project.notice.title} className="crosshair border border-line-strong p-5 md:p-6">
                <p className="label flex items-center gap-2 text-accent-text">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
                  {project.notice.title}
                </p>
                <p className="mt-3 leading-relaxed text-muted">{project.notice.text}</p>
              </aside>
            ) : null}
          </div>
        </div>
      </header>

      <div className="gutter">
        {project.plate === "swarm" ? (
          <figure data-reveal className="crosshair border border-line bg-ink">
            <div className="relative aspect-[4/3] md:aspect-[21/9]">
              <SwarmField region={FIGURE_REGION} points={60} zones={6} seed={50} />
              <p className="label pointer-events-none absolute top-4 left-4 flex items-center gap-2 text-fg">
                <span className="size-1.5 animate-[blink_1s_steps(1)_infinite] rounded-full bg-accent" />
                Live
              </p>
            </div>
            <figcaption className="label flex flex-col gap-1 border-t border-line px-4 py-3 text-faint md:flex-row md:justify-between md:gap-6">
              <span className="shrink-0">Fig. {pad2(index + 1)} — {project.title}</span>
              {project.figure ? <span className="normal-case tracking-normal md:text-right">{project.figure}</span> : null}
            </figcaption>
          </figure>
        ) : project.video ? (
          // Never wider than lets the whole 16:9 recording fit on screen under the header.
          <figure data-reveal className="crosshair mx-auto max-w-[calc((100svh_-_5.5rem)_*_16_/_9)] border border-line">
            <div className="relative">
              <ShowcaseVideo
                src={project.video}
                smallSrc={project.preview ?? project.video}
                poster={project.thumb}
                label={project.figure ? `${project.title}. ${project.figure}` : project.title}
                className="aspect-video w-full"
              />
              {/* Shrinks away to the top as the page arrives, and comes back down as it leaves. */}
              <div aria-hidden="true" data-hero-cover className="hero-cover" />
            </div>
            <figcaption className="label flex flex-col gap-1 border-t border-line px-4 py-3 md:flex-row md:justify-between md:gap-6">
              <span className="shrink-0">Fig. {pad2(index + 1)} — {project.title}</span>
              {project.figure ? <span className="tracking-normal normal-case md:text-right">{project.figure}</span> : null}
            </figcaption>
          </figure>
        ) : (
          <figure data-reveal className="crosshair border border-line">
            <PixelFigure
              art={PLATE_ART[project.plate]}
              src={project.thumb}
              text={pad2(index + 1)}
              label={project.figure ?? ""}
              reveal={!project.thumb}
              className="aspect-[4/3] bg-ink md:aspect-[21/9]"
            />
            <figcaption className="label flex flex-col gap-1 border-t border-line px-4 py-3 md:flex-row md:justify-between md:gap-6">
              <span className="shrink-0">Fig. {pad2(index + 1)} — {project.title}</span>
              {project.figure ? <span className="tracking-normal normal-case md:text-right">{project.figure}</span> : null}
            </figcaption>
          </figure>
        )}
      </div>

      {blocks.map((block, i) => (
        <section key={block.key} className="gutter border-b border-line py-16 md:py-24">
          <SectionLabel index={pad2(i + 1)} total={pad2(blocks.length)}>
            {block.label}
          </SectionLabel>
          {block.heading ? (
            <SplitChars as="h2" text={block.heading} className="display mt-6 block text-[clamp(3rem,7vw,6.5rem)]" />
          ) : (
            <div className="mt-8" />
          )}
          {block.body}
        </section>
      ))}

      {project.tags ? (
        <ul aria-label="Tags" className="gutter label flex flex-wrap gap-x-5 gap-y-2 border-b border-line py-6 text-muted">
          {project.tags.map((tag) => (
            <li key={tag}>
              <span className="text-accent-text">#</span>
              {tag}
            </li>
          ))}
        </ul>
      ) : null}

      <section aria-label="Next steps" className="gutter flex flex-col gap-5 border-b border-line py-10 md:flex-row md:items-center md:justify-between">
        <p className="display-title max-w-[30ch] text-[clamp(1.25rem,2.2vw,1.875rem)] leading-snug">{closingLine(project)}</p>
        <div className="flex flex-wrap gap-2">
          {project.site ? <SiteLink site={project.site} title={project.title} /> : null}
          <MeetLink variant="chip" />
        </div>
      </section>

      <HireBand as="h2" className="border-b" />

      <Link href={`/project/${next.project.slug}`} data-cursor="Next" className="group gutter relative block overflow-hidden py-16 md:py-24">
        <span aria-hidden="true" className="absolute inset-0 origin-bottom scale-y-0 bg-accent transition-transform duration-700 ease-expo group-hover:scale-y-100" />
        <span className="label relative flex items-center gap-2 transition-colors duration-300 group-hover:text-on-accent/70">
          Next project · {pad2(next.index + 1)} / {total}
        </span>
        <span className="display relative mt-4 flex items-end justify-between gap-6 text-[clamp(3.5rem,11vw,11rem)] transition-colors duration-300 group-hover:text-on-accent">
          {next.project.title}
          <Arrow direction="up-right" className="mb-[0.12em] size-[0.42em]! transition-transform duration-700 ease-expo group-hover:translate-x-2 group-hover:-translate-y-2" />
        </span>
      </Link>
    </article>
  );
}
