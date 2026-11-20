import Link from "next/link";
import { about, education, expertise, modules, path, results, services, stack, stackTotal } from "@/content/home";
import { pad2 } from "@/content/projects";
import { DotField } from "@/components/art/DotField";
import { DotImage } from "@/components/art/DotImage";
import { HireBand } from "@/components/ui/HireBand";
import { MeetLink } from "@/components/ui/MeetLink";
import { Arrow, SectionLabel, SplitChars } from "@/components/ui/primitives";
import type { DotBlob } from "@/lib/dots";
import { Journey } from "./Journey";

/** Shared recipe: a ruled grid on desktop, a swipeable row of cards on phones. */
const rowOnMobile =
  "max-md:-mx-4 max-md:flex max-md:snap-x max-md:snap-mandatory max-md:gap-3 max-md:overflow-x-auto max-md:scroll-px-4 max-md:border-0 max-md:px-4 max-md:pb-2 no-scrollbar";
const cardOnMobile = "max-md:w-[82vw] max-md:shrink-0 max-md:snap-start max-md:border";

/** Where the dots gather in each part of the section. Kept here so every field has its own shape. */
const DOTS = {
  heading: [{ x: 0.78, y: 0.4, radius: 0.34, strength: 0.9 }],
  skills: [{ x: 0.9, y: 0.1, radius: 0.22, strength: 0.7 }],
  experience: [
    { x: 0.78, y: 0.3, radius: 0.16, strength: 0.85 },
    { x: 0.4, y: 0.2, radius: 0.08, strength: 0.6 },
  ],
} satisfies Record<string, readonly DotBlob[]>;

/**
 * One halo of dots per service picture, each gathered somewhere different.
 * Clusters sit well inside the field so they fade out before its edges.
 */
const SERVICE_DOTS: readonly (readonly DotBlob[])[] = [
  [
    { x: 0.26, y: 0.36, radius: 0.2, strength: 0.8 },
    { x: 0.78, y: 0.72, radius: 0.13, strength: 0.65 },
  ],
  [
    { x: 0.72, y: 0.34, radius: 0.2, strength: 0.75 },
    { x: 0.26, y: 0.72, radius: 0.11, strength: 0.55 },
  ],
  [
    { x: 0.42, y: 0.64, radius: 0.21, strength: 0.75 },
    { x: 0.8, y: 0.26, radius: 0.1, strength: 0.55 },
  ],
  [
    { x: 0.28, y: 0.62, radius: 0.2, strength: 0.8 },
    { x: 0.76, y: 0.28, radius: 0.12, strength: 0.6 },
  ],
];

interface BlockHeadProps {
  title: string;
  kicker: string;
}

function BlockHead({ title, kicker }: BlockHeadProps) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <SplitChars as="h3" text={title} className="heading block text-[clamp(2.4rem,5vw,4.5rem)] uppercase" />
      <p className="label hidden md:block">{kicker}</p>
    </div>
  );
}

function Intro() {
  return (
    <div className="grid grid-cols-1 gap-10 border-b border-line px-4 py-12 sm:px-6 md:px-10 md:py-16 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <p data-words className="heading text-[clamp(1.6rem,2.6vw,2.6rem)] leading-[1.12] text-paper">
          {about.lead.split(" ").map((word, i) => (
            <span key={`${word}-${i}`} className="word">
              {word}{" "}
            </span>
          ))}
        </p>
        <div className="space-y-6 pt-6">
          <p className="reveal leading-relaxed text-paper/70">{about.body}</p>
          <div className="reveal">
            <MeetLink variant="chip" />
          </div>
        </div>
      </div>

      <aside aria-label="Profile" className="reveal lg:col-span-4 lg:col-start-9">
        <div className="crosshair border border-line p-5">
          <p className="label mb-3">Profile</p>
          {about.profile.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-line py-2 font-mono text-[11px] tracking-[0.08em] uppercase">
              <span className="text-paper/55">{row.label}</span>
              <span className="text-right text-paper/90">{row.value}</span>
            </div>
          ))}
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 [&>a]:whitespace-nowrap">
            <Link href="/cv" className="btn-solid justify-between">
              View résumé
              <Arrow />
            </Link>
            <Link href="/cv?print=1" className="btn-ghost justify-between">
              Download résumé
              <span className="flex items-center gap-2 text-paper/55">
                PDF
                <Arrow direction="down" />
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Services() {
  return (
    <div className={`px-4 sm:px-6 md:px-10 max-md:py-10 ${rowOnMobile.replace("max-md:-mx-4 ", "")}`}>
      {services.map((service, i) => (
        <article
          key={service.code}
          className={`reveal grid grid-cols-1 items-center gap-8 border-b border-line py-12 md:grid-cols-2 md:gap-16 md:py-16 max-md:gap-5 max-md:border-line max-md:p-4 ${cardOnMobile} ${
            i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div className="relative isolate">
            <DotField blobs={SERVICE_DOTS[i % SERVICE_DOTS.length]} seed={i + 2} accent={0.16} className="absolute inset-0 -z-10 size-full opacity-55" />
            <DotImage
              src={service.image.src}
              label={service.title}
              isTinted={service.image.isTinted}
              className="mx-auto aspect-[4/5] w-full max-w-[440px] md:max-h-[74vh]"
            />
          </div>
          <div>
            <p className="label mb-4">
              <span className="text-accent-text">{service.number.replace("#", "# ")}</span> · {service.code}
            </p>
            <h3 className="heading text-[clamp(2.4rem,4.5vw,4.25rem)]">{service.title}</h3>
            <p className="mt-5 max-w-md leading-relaxed text-paper/70">{service.copy}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function Skills() {
  return (
    <div className="relative isolate px-4 py-16 sm:px-6 md:px-10 md:py-24">
      <DotField blobs={DOTS.skills} base={0.05} seed={11} className="absolute top-0 right-0 -z-10 h-72 w-full opacity-40 md:w-1/2" />
      <BlockHead title="Skills" kicker={`Stack · ${stackTotal}`} />
      <div className={`grid grid-cols-1 border-t border-l border-line md:grid-cols-2 lg:grid-cols-3 ${rowOnMobile}`}>
        {stack.map((category, i) => (
          <div key={category.name} className={`reveal crosshair border-r border-b border-line bg-ink p-5 md:p-6 ${cardOnMobile}`}>
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-mono text-[12px] tracking-[0.12em] text-paper uppercase">{category.name}</h4>
              <span className="label text-accent-text">{pad2(i + 1)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {category.tools.map((tool) => (
                <span key={tool} className="chip">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <p className="label mb-4">Areas of expertise</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {expertise.map((area) => (
            <li key={area} className="font-display text-2xl text-paper/80 md:text-3xl max-md:w-full max-md:border-b max-md:border-line max-md:pb-2">
              {area}
              <span aria-hidden="true" className="ml-6 text-accent max-md:hidden">
                /
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Experience() {
  return (
    <div className="relative isolate border-t border-line px-4 py-16 sm:px-6 md:px-10 md:py-24">
      <DotField blobs={DOTS.experience} seed={17} accent={0.14} className="absolute top-0 right-0 -z-10 h-60 w-full opacity-40 md:w-3/5" />
      <BlockHead title="Professional experience" kicker="Path" />
      <ol className="border-t border-line">
        {path.map((role, i) => (
          <li key={role.title} className="reveal group grid grid-cols-1 gap-4 border-b border-line py-8 transition-colors hover:bg-paper/[0.03] md:grid-cols-12 md:gap-8">
            <div className="label md:col-span-2">
              <span className="text-accent-text"># {i + 1}</span> · {role.dates}
            </div>
            <div className="md:col-span-4">
              <h4 className="heading text-3xl md:text-4xl">{role.title}</h4>
              <p className="mt-1 font-mono text-[12px] tracking-[0.1em] text-paper/60 uppercase">{role.org}</p>
            </div>
            <div className="md:col-span-6">
              <p className="leading-relaxed text-paper/70">{role.description}</p>
              <p className="label mt-5 mb-2">Skills applied · {pad2(role.tags.length)}</p>
              <ul className="flex flex-wrap gap-1.5">
                {role.tags.map((tag) => (
                  <li key={tag} className="chip tracking-normal normal-case">
                    {tag}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <h4 className="label mt-14 mb-4">Education</h4>
      <ul className="grid grid-cols-1 border-t border-l border-line md:grid-cols-3">
        {education.map((entry) => (
          <li key={entry.credential} className="reveal border-r border-b border-line bg-ink p-5">
            <p className="label text-accent-text">{entry.year}</p>
            <p className="heading mt-3 text-2xl">{entry.credential}</p>
            <p className="mt-2 text-sm text-paper/70">{entry.institution}</p>
            <p className="text-sm text-paper/50">{entry.topic}</p>
          </li>
        ))}
      </ul>

      <h4 className="label mt-10 mb-4">
        MSc Computer Science · Modules · <span className="text-accent-text">{pad2(modules.length)}</span>
      </h4>
      <ul className={`grid grid-cols-1 border-t border-l border-line md:grid-cols-2 lg:grid-cols-3 ${rowOnMobile}`}>
        {modules.map((module, i) => (
          <li key={module.title} className={`reveal border-r border-b border-line bg-ink p-5 ${cardOnMobile}`}>
            <p className="label text-accent-text">{pad2(i + 1)}</p>
            <p className="heading mt-3 text-2xl">{module.title}</p>
            <ul aria-label={`${module.title}: what it covered`} className="mt-4 flex flex-wrap gap-1.5">
              {module.skills.map((skill) => (
                <li key={skill} className="chip tracking-normal normal-case">
                  {skill}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Results() {
  return (
    <div className="relative isolate border-t border-line px-4 py-16 sm:px-6 md:px-10 md:py-24">
      <DotField base={0.07} seed={23} className="absolute inset-x-0 top-0 -z-10 h-56 w-full opacity-35" />
      <BlockHead title="Impact & results" kicker="Results" />
      <div className={`grid grid-cols-1 border-t border-l border-line md:grid-cols-2 lg:grid-cols-3 ${rowOnMobile}`}>
        {results.map((result, i) => (
          <div key={result.line} className={`reveal group border-r border-b border-line bg-ink p-6 transition-colors hover:bg-accent hover:text-on-accent ${cardOnMobile}`}>
            <p className="font-display text-6xl font-light text-accent transition-colors group-hover:text-on-accent/50">{pad2(i + 1)}</p>
            <p className="mt-6 leading-relaxed">
              {result.figure} {result.line}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Everything under "01 · About": intro, profile, journey, services, skills, path, education, results. */
export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="w-full scroll-mt-16 bg-ink text-paper">
      <div className="relative isolate px-4 pt-20 sm:px-6 md:px-10 md:pt-28">
        <DotField blobs={DOTS.heading} seed={5} accent={0.12} className="absolute inset-y-0 right-0 -z-10 h-full w-full opacity-45 md:w-3/5" />
        <SectionLabel index="01" total="04">
          About
        </SectionLabel>
        <SplitChars as="h2" id="about-heading" text={about.heading} className="display mt-6 block text-[clamp(3rem,8vw,8rem)]" />
      </div>
      <Intro />
      <Journey />
      <Services />
      <HireBand className="border-b" />
      <Skills />
      <Experience />
      <Results />
    </section>
  );
}
