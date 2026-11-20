"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { pad2, projects } from "@/content/projects";
import { DotThumb } from "@/components/art/DotThumb";
import { PixelFigure } from "@/components/art/PixelFigure";
import { PLATE_ART } from "@/lib/plate-art";
import { PreviewVideo } from "./PreviewVideo";

type StackPreviewProps = {
  /** Position in the list of the title being hovered, or null when none is. */
  active: number | null;
  /** Where the middle of that title sits on screen, in pixels from the top. */
  y: number;
};

/** Keeps the frame clear of the top and bottom of the column it sits in. */
const EDGE_GAP_PX = 28;
/** Once the page has settled, the picture files are fetched quietly so the first hover does not wait for one. */
const WARM_AFTER_MS = 3200;
const LARGE_SCREEN = "(min-width: 1024px)";

const total = pad2(projects.length);

/**
 * The picture that goes with the hovered title. It is only there while a
 * title is hovered or focused: it swings in from the side, hinged on its left
 * edge to mirror the titles, level with the title that called it, and its
 * picture resolves out of the site's dots before the clip starts. Moving to
 * another title slides it there and swaps the picture; leaving swings it away.
 * Large screens only, and decorative: the titles are the links.
 */
export function StackPreview({ active, y }: StackPreviewProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /** The last title hovered: its words stay in place while the frame swings away. */
  const [last, setLast] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (active === null) return;
    // Level with the hovered title, measured inside the pinned column, but never so high or low that the frame leaves it.
    const column = hostRef.current?.offsetParent?.getBoundingClientRect();
    const columnTop = column?.top ?? 0;
    const columnHeight = column?.height ?? window.innerHeight;
    const half = (frameRef.current?.offsetHeight ?? 0) / 2;
    const highest = EDGE_GAP_PX + half;
    const lowest = Math.max(highest, columnHeight - half - EDGE_GAP_PX);
    const next = Math.min(lowest, Math.max(highest, y - columnTop));
    const id = window.requestAnimationFrame(() => {
      setLast(active);
      setOffset(next);
    });
    return () => window.cancelAnimationFrame(id);
  }, [active, y]);

  // Each picture is only drawn when its title is first hovered; this just puts the files in the browser's cache.
  useEffect(() => {
    if (!window.matchMedia(LARGE_SCREEN).matches) return;
    let warmed: HTMLImageElement[] = [];
    const timer = window.setTimeout(() => {
      warmed = projects.flatMap((project) => {
        if (!project.thumb) return [];
        const image = new Image();
        image.decoding = "async";
        image.src = project.thumb;
        return [image];
      });
    }, WARM_AFTER_MS);
    return () => {
      window.clearTimeout(timer);
      // Dropping the address stops any download still under way.
      warmed.forEach((image) => {
        image.src = "";
      });
    };
  }, []);

  const isOpen = active !== null;
  const shown = projects[last];

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-exit="none"
      className="pointer-events-none absolute top-0 left-[5vw] hidden w-[clamp(17rem,29vw,33rem)] [perspective:100vw] lg:block"
      style={{ transform: `translateY(calc(${offset}px - 50%))`, transition: "transform 0.9s cubic-bezier(0.075, 0.82, 0.165, 1)" } as CSSProperties}
    >
      <div
        ref={frameRef}
        className={`origin-left transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(0.075,0.82,0.165,1)] motion-reduce:transition-none ${
          isOpen ? "opacity-100 [transform:rotateY(28deg)]" : "opacity-0 [transform:rotateY(78deg)_scale(0.94)]"
        }`}
      >
        <div className="crosshair relative">
          <div className="relative aspect-[16/10] overflow-hidden border border-line-strong bg-ink">
            {projects.map((project, index) => {
              const isShown = active === index;
              return (
                <div key={project.slug} className={`absolute inset-0 ${isShown ? "z-10" : "z-0"}`}>
                  {project.thumb ? (
                    <DotThumb src={project.thumb} mode="manual" isShown={isShown} className="size-full" />
                  ) : (
                    <PixelFigure
                      art={PLATE_ART[project.plate]}
                      text={pad2(index + 1)}
                      label=""
                      mode="none"
                      reveal={false}
                      className={`size-full bg-ink transition-opacity duration-500 ${isShown ? "opacity-100" : "opacity-0"}`}
                    />
                  )}
                  {project.preview ? <PreviewVideo src={project.preview} isActive={isShown} /> : null}
                </div>
              );
            })}
          </div>
        </div>
        <p className="label mt-4">
          <span className="text-accent-text">{pad2(last + 1)}</span> / {total} · {shown.kind} · {shown.year}
        </p>
        <p className="mt-2 max-w-sm text-sm text-paper/70">{shown.tagline}</p>
      </div>
    </div>
  );
}
