import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { cv, cvExperience, cvSkills } from "@/content/cv";
import { getProject } from "@/content/projects";
import { activeSocials, site } from "@/content/site";
import { PrintButton } from "@/components/cv/PrintButton";
import { MeetLink } from "@/components/ui/MeetLink";
import { Email } from "@/components/ui/Email";
import { Arrow, Chip, Corners } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "CV",
  description: `CV of ${cv.name}: ${cv.headline}.`,
};

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="display-title border-b border-line pb-3 text-2xl uppercase">{children}</h2>;
}

const recentProjects = cv.recentProjects.flatMap((slug) => {
  const found = getProject(slug);
  return found ? [found.project] : [];
});

export default function CvPage() {
  return (
    <div className="gutter py-8 md:py-10 print:p-0">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="btn">
          <Arrow direction="left" />
          Back to website
        </Link>
        {/*
          useSearchParams needs a Suspense boundary; the fallback keeps the layout steady. The button inside is
          taken up by React a moment after the rest of the page, so it is left out of the automatic entrance:
          posing it before then would change markup React has not yet claimed.
        */}
        <span data-enter="none" className="flex flex-wrap gap-2">
          <MeetLink variant="chip" />
          <Suspense fallback={<span className="btn btn-solid" aria-hidden="true">Download PDF</span>}>
            <PrintButton />
          </Suspense>
        </span>
      </div>

      <article className="relative mt-8 border border-line bg-stage p-6 md:p-12 print:mt-0 print:border-0 print:p-0">
        <Corners className="print:hidden" />

        <header className="border-b border-line pb-8">
          <h1 className="display text-[clamp(3rem,8vw,6.5rem)] print:text-5xl">{cv.name}</h1>
          <p className="display-title mt-3 text-[clamp(1.25rem,2.4vw,2rem)] text-muted print:text-xl">{cv.headline}</p>
          <ul className="label mt-6 flex flex-wrap gap-x-8 gap-y-2 text-muted">
            <li>
              <Email className="text-fg" />
            </li>
            <li>{site.location.full}</li>
            <li>{site.url.replace("https://", "")}</li>
            {activeSocials.map((social) => (
              <li key={social.label}>
                <a href={social.url} target="_blank" rel="noopener noreferrer" className="link-line text-fg">
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </header>

        <div className="mt-10 grid gap-12 md:grid-cols-12 md:gap-10 print:mt-6 print:grid-cols-12 print:gap-6">
          <div className="flex flex-col gap-12 md:col-span-8 print:col-span-8 print:gap-6">
            <section>
              <Heading>Profile</Heading>
              <p className="mt-4 text-muted">{cv.profile}</p>
            </section>

            <section>
              <Heading>Professional experience</Heading>
              <ol>
                {cvExperience.map((role) => (
                  <li key={role.title} className="break-inside-avoid border-b border-line py-6 last:border-b-0 print:py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="display-title text-[1.75rem] print:text-xl">{role.title}</h3>
                      <p className="label text-muted">{role.dates}</p>
                    </div>
                    <p className="label mt-1 text-accent">
                      {role.org} <span className="text-faint">· {role.place}</span>
                    </p>
                    <ul className="mt-4 flex list-none flex-col gap-2 text-[0.9375rem] text-muted">
                      {role.bullets.map((bullet) => (
                        <li key={bullet} className="grid grid-cols-[1rem_1fr]">
                          <span aria-hidden="true" className="text-accent">
                            —
                          </span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <Heading>Recent projects</Heading>
              <ul>
                {recentProjects.map((project) => (
                  <li key={project.slug} className="grid gap-1 border-b border-line py-4 last:border-b-0 md:grid-cols-[12rem_1fr] print:py-2">
                    <Link href={`/project/${project.slug}`} className="display-title link-line w-fit text-xl">
                      {project.title}
                    </Link>
                    <p className="text-[0.9375rem] text-muted">{project.subtitle}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <aside className="flex flex-col gap-12 md:col-span-4 print:col-span-4 print:gap-6">
            <section>
              <Heading>Education</Heading>
              <ul>
                {cv.education.map((entry) => (
                  <li key={entry.credential} className="border-b border-line py-4 last:border-b-0 print:py-2">
                    <p className="label text-accent">{entry.year}</p>
                    <p className="mt-1 text-fg">{entry.credential}</p>
                    <p className="text-sm text-muted">{entry.institution}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <Heading>Skills</Heading>
              {cvSkills.map((skill) => (
                <div key={skill.group} className="mt-5 print:mt-3">
                  <h3 className="label text-muted">{skill.group}</h3>
                  <ul className="mt-2.5 flex flex-wrap gap-1.5">
                    {skill.items.map((item) => (
                      <li key={item}>
                        <Chip>{item}</Chip>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section>
              <Heading>Key strengths</Heading>
              <ul className="mt-4 flex flex-col gap-2 text-[0.9375rem] text-muted">
                {cv.strengths.map((strength) => (
                  <li key={strength}>{strength}</li>
                ))}
              </ul>
            </section>

            <section>
              <Heading>Interests</Heading>
              <ul className="mt-4 flex flex-col gap-2 text-[0.9375rem] text-muted">
                {cv.interests.map((interest) => (
                  <li key={interest}>{interest}</li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </article>

      <div className="no-print label mt-8 flex gap-6 text-muted">
        <Link href="/" className="link-line hover:text-fg">
          Back to website
        </Link>
        <Link href="/lab" className="link-line hover:text-fg">
          Lab
        </Link>
      </div>
    </div>
  );
}
