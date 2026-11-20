"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { selected } from "@/content/home";
import { getProject, pad2, projects } from "@/content/projects";
import { DotField } from "@/components/art/DotField";
import { DotThumb } from "@/components/art/DotThumb";
import { PixelFigure } from "@/components/art/PixelFigure";
import { SiteLink } from "@/components/projects/SiteLink";
import { MeetLink } from "@/components/ui/MeetLink";
import type { DotBlob } from "@/lib/dots";
import { PLATE_ART } from "@/lib/plate-art";
import { Arrow, SectionLabel, SplitChars } from "@/components/ui/primitives";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const LIVE_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

const featured = selected.slugs.flatMap((slug) => {
  const found = getProject(slug);
  return found ? [found] : [];
});
const total = pad2(featured.length);

const INTRO_DOTS: readonly DotBlob[] = [
  { x: 0.12, y: 0.62, radius: 0.3, strength: 0.85 },
  { x: 0.8, y: 0.95, radius: 0.18, strength: 0.55 },
];
const OUTRO_DOTS: readonly DotBlob[] = [{ x: 0.85, y: 0.25, radius: 0.34, strength: 0.8 }];

/**
 * Selected projects on a horizontal track. On large screens the section pins
 * and vertical scroll drives the track, with the figures drifting slightly
 * slower than their cards; below that the cards simply stack. Each thumbnail
 * rests as the site's dots and becomes the picture while its card is hovered or focused.
 */
export function Projects() {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const track = trackRef.current;
      if (!root || !track) return;

      const media = gsap.matchMedia();
      media.add(LIVE_QUERY, () => {
        const distance = (): number => Math.max(0, track.scrollWidth - window.innerWidth);
        const tween = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });

        track.querySelectorAll<HTMLElement>("[data-parallax]").forEach((figure) => {
          gsap.fromTo(
            figure,
            { xPercent: -5 },
            { xPercent: 5, ease: "none", scrollTrigger: { trigger: figure, containerAnimation: tween, start: "left right", end: "right left", scrub: true } },
          );
        });

        // Keyboard: tabbing to a card that is off to the side scrolls it into view.
        const handleFocus = (event: FocusEvent): void => {
          const trigger = tween.scrollTrigger;
          const target = event.target instanceof Element ? event.target : null;
          if (!target?.matches(":focus-visible")) return;
          const panel = target.closest<HTMLElement>("[data-panel]");
          if (!trigger || !panel || distance() === 0) return;
          const progress = Math.min(1, panel.offsetLeft / distance());
          window.scrollTo({ top: trigger.start + progress * (trigger.end - trigger.start) });
        };
        track.addEventListener("focusin", handleFocus);
        return () => track.removeEventListener("focusin", handleFocus);
      });
    },
    { scope: rootRef },
  );

  return (
    <div>
      <section
        ref={rootRef}
        id="projects"
        aria-labelledby="projects-heading"
        className="relative w-full scroll-mt-16 overflow-hidden border-t border-line bg-ink text-paper lg:h-screen"
      >
        <div ref={trackRef} className="flex flex-col gap-16 px-4 py-20 sm:px-6 md:px-10 lg:h-full lg:w-max lg:flex-row lg:items-stretch lg:gap-0 lg:p-0">
          <div data-panel className="relative isolate flex flex-col justify-between lg:h-full lg:w-[44vw] lg:border-r lg:border-line lg:px-10 lg:pt-24 lg:pb-14">
            <DotField blobs={INTRO_DOTS} seed={31} accent={0.14} className="absolute inset-0 -z-10 size-full opacity-40" />
            <div>
              <SectionLabel index="02" total="04">
                Work
              </SectionLabel>
              <SplitChars as="h2" id="projects-heading" text={selected.heading} className="display mt-6 block text-[clamp(3.2rem,8vw,9rem)]" />
            </div>
            <div className="mt-8 flex flex-col gap-8">
              <MeetLink line="Every project here has one engineer behind it" />
              <div className="flex items-end justify-between gap-6">
                <p className="max-w-xs text-paper/60">{selected.intro}</p>
                <p className="label hidden lg:block">Scroll →</p>
              </div>
            </div>
          </div>

          {featured.map(({ project, index }, position) => (
            <article key={project.slug} data-panel className="group flex flex-col lg:h-full lg:w-[62vw] lg:border-r lg:border-line lg:px-10 lg:pt-24 lg:pb-14 xl:w-[56vw]">
              <div className="label mb-5 flex items-baseline justify-between">
                <span>
                  <span className="text-accent-text">{pad2(position + 1)}</span> / {total}
                </span>
                <span>
                  {project.kind} · {project.year}
                </span>
              </div>
              <Link href={`/project/${project.slug}`} data-cursor="View" aria-label={`${project.title}: view the case study`} className="relative block overflow-hidden lg:min-h-0 lg:flex-1">
                <div data-parallax className="size-full lg:absolute lg:inset-y-0 lg:-left-[6%] lg:w-[112%]">
                  {project.thumb ? (
                    <DotThumb src={project.thumb} mode="hover" className="aspect-[4/3] size-full lg:aspect-auto" />
                  ) : (
                    <PixelFigure
                      art={PLATE_ART[project.plate]}
                      text={pad2(index + 1)}
                      label=""
                      mode="hover"
                      reveal={false}
                      className="aspect-[4/3] size-full bg-ink lg:aspect-auto"
                    />
                  )}
                </div>
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 border border-line transition-colors duration-500 group-hover:border-accent" />
              </Link>
              <div className="mt-6 grid gap-5 lg:grid-cols-12 lg:gap-8">
                <h3 className="heading text-[clamp(2rem,3.2vw,3.4rem)] lg:col-span-6">{project.title}</h3>
                <div className="lg:col-span-6">
                  <p className="line-clamp-2 leading-relaxed text-paper/65 md:line-clamp-3">{project.summary ?? project.subtitle}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5 max-md:hidden">
                    <h4 className="sr-only">Technologies</h4>
                    <span className="chip">{project.tag}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href={`/project/${project.slug}`} data-magnetic className="btn-solid">
                      View details
                      <span className="sr-only">: {project.title}</span>
                    </Link>
                    {project.site ? <SiteLink site={project.site} title={project.title} /> : null}
                  </div>
                </div>
              </div>
            </article>
          ))}

          <Link
            href="/projects"
            data-panel
            data-cursor="Open"
            className="group relative isolate flex flex-col justify-between border border-line p-6 transition-colors duration-500 hover:bg-accent hover:text-on-accent lg:h-full lg:w-[38vw] lg:border-0 lg:px-10 lg:pt-24 lg:pb-14"
          >
            <DotField blobs={OUTRO_DOTS} seed={37} className="absolute inset-0 -z-10 size-full opacity-40 transition-opacity duration-500 group-hover:opacity-0" />
            <span className="label group-hover:text-on-accent/70">All projects · {projects.length}</span>
            <span className="display mt-10 flex items-end justify-between gap-4 text-[clamp(3rem,6vw,7rem)]">
              View all projects
              <Arrow className="mb-3 size-10! transition-transform duration-500 group-hover:-rotate-45" />
            </span>
          </Link>
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-x-10 bottom-6 hidden h-px bg-line lg:block">
          <div ref={barRef} className="h-px origin-left scale-x-0 bg-accent" />
        </div>
      </section>
    </div>
  );
}
