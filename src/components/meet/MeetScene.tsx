"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { meet } from "@/content/meet";
import { DotField } from "@/components/art/DotField";
import type { DotBlob } from "@/lib/dots";
import { entranceHold } from "@/lib/entrance";
import { prefersReducedMotion } from "@/lib/motion";
import { nearestStop, scrollSwing } from "@/lib/portrait";
import { onSiteReady } from "@/lib/ready";
import { LightPortrait, type LightController } from "./LightPortrait";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type MeetSceneProps = {
  /** The line across the top: the way back, and the page's label. */
  top: ReactNode;
  /** The name and what stands round it on the first screen. */
  hero: ReactNode;
  /** The story. Anything in it with `data-stop` is a chapter the portrait's caption can name. */
  children: ReactNode;
};

/** Where the portrait slides aside as the story begins. */
const LIVE_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";
/** Scrolled further than this, the light stops circling and the portrait is simply lit from the front. */
const SCROLL_BEGINS_PX = 24;
/** How quickly the measured scroll speed follows the real one (per second): enough to smooth single frames. */
const SPEED_FOLLOW_RATE = 9;
/** Gathered top left, behind the open space above the name, with a few in the far corner, clear of the story's text. */
const STAGE_DOTS: readonly DotBlob[] = [
  { x: 0.1, y: 0.26, radius: 0.13, strength: 0.85 },
  { x: 0.985, y: 0.97, radius: 0.05, strength: 0.6 },
];

/**
 * The top of "Meet the developer": the portrait, the name beside it and the
 * story that scrolls past. This component owns what ties them together:
 * - it opens the portrait once the page has arrived;
 * - at the top of the page it leaves the light circling; once the page is
 *   scrolled it holds the light in front, and while the page is moving it
 *   throws the light to one side, further the faster the scroll;
 * - on wide screens it slides the portrait from the middle to the left as
 *   the story begins and names the chapter being read above the picture.
 * The words themselves are server-rendered and passed in.
 */
export function MeetScene({ top, hero, children }: MeetSceneProps) {
  const rootRef = useRef<HTMLElement>(null);
  const rigRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<LightController | null>(null);

  useEffect(() => {
    // The portrait opens once the page has arrived: after the loader on a first visit, after the curtain on a change of page.
    let timer = 0;
    const cancel = onSiteReady(() => {
      timer = window.setTimeout(() => controllerRef.current?.playIntro(), entranceHold() * 1000 + 120);
    });
    return () => {
      cancel();
      window.clearTimeout(timer);
    };
  }, []);

  // The light and the scroll. With reduced motion the portrait is left alone, lit from the front.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let lastScroll = window.scrollY;
    let speed = 0;

    const follow = (_time: number, deltaMs: number): void => {
      const seconds = Math.max(deltaMs, 1) / 1000;
      const scroll = window.scrollY;
      // Pixels a second, smoothed: one frame's jump should not throw the light.
      speed += ((scroll - lastScroll) / seconds - speed) * Math.min(1, SPEED_FOLLOW_RATE * seconds);
      lastScroll = scroll;
      controllerRef.current?.setRest(scroll > SCROLL_BEGINS_PX ? scrollSwing(speed) : null);
    };
    gsap.ticker.add(follow);
    return () => {
      gsap.ticker.remove(follow);
      controllerRef.current?.setRest(null);
    };
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      const rig = rigRef.current;
      const heroBox = root?.querySelector<HTMLElement>(".meet-hero");
      if (!root || !rig || !heroBox) return;
      const [firstWord, lastWord] = Array.from(root.querySelectorAll<HTMLElement>(".meet-word"));
      const stopBoxes = Array.from(root.querySelectorAll<HTMLElement>("[data-stop]"));

      const media = gsap.matchMedia();
      media.add(LIVE_QUERY, () => {
        let stops: number[] = [];
        let active = -2;
        const headerHeight = (): number => document.querySelector<HTMLElement>("body > header")?.offsetHeight ?? 64;

        /** The scroll position at which each chapter is centred in what is left of the screen under the header. */
        const readStops = (): void => {
          const middle = (window.innerHeight + headerHeight()) / 2;
          stops = stopBoxes.map((box) => {
            const rect = box.getBoundingClientRect();
            return rect.top + window.scrollY + rect.height / 2 - middle;
          });
        };

        /** Marks the chapter being read, and names it above the portrait. */
        const mark = (): void => {
          const scroll = window.scrollY;
          const next = scroll >= heroBox.offsetHeight / 2 ? nearestStop(stops, scroll) : -1;
          if (next === active) return;
          active = next;
          stopBoxes.forEach((box, i) => {
            box.dataset.active = String(i === next);
          });
          if (captionRef.current) captionRef.current.textContent = stopBoxes[next]?.dataset.caption ?? meet.portrait.caption;
        };

        // The same resting place the stylesheet gives it, in the form the timeline can move.
        gsap.set(rig, { x: 0, xPercent: 50 });
        const timeline = gsap.timeline({
          scrollTrigger: { trigger: heroBox, start: () => `top ${headerHeight()}px`, end: "bottom 42%", scrub: 0.5, invalidateOnRefresh: true },
        });
        timeline.to(rig, { xPercent: 0, ease: "power2.inOut", duration: 1 }, 0);
        if (firstWord) timeline.to(firstWord, { xPercent: -24, opacity: 0, ease: "power2.in", duration: 0.62 }, 0);
        if (lastWord) timeline.to(lastWord, { xPercent: 24, opacity: 0, ease: "power2.in", duration: 0.62 }, 0);

        const watcher = ScrollTrigger.create({
          trigger: root,
          start: "top bottom",
          end: "bottom top",
          onUpdate: mark,
          onRefresh: () => {
            readStops();
            mark();
          },
        });
        readStops();
        mark();

        return () => {
          watcher.kill();
          timeline.scrollTrigger?.kill();
          timeline.kill();
          stopBoxes.forEach((box) => {
            delete box.dataset.active;
          });
          if (captionRef.current) captionRef.current.textContent = meet.portrait.caption;
        };
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} data-enter="none" aria-labelledby="meet-heading" className="meet-grid">
      {/* The words come first in the markup, so the heading is met before the portrait's control; the stylesheet places them. */}
      <div className="meet-top gutter">{top}</div>
      <div className="meet-hero gutter">{hero}</div>
      <div className="meet-stage">
        <DotField blobs={STAGE_DOTS} seed={41} accent={0.16} className="absolute inset-y-0 left-0 -z-10 h-full w-full opacity-40 lg:w-[200%]" />
        <div ref={rigRef} className="meet-rig">
          <LightPortrait
            alt={meet.portrait.alt}
            caption={
              <>
                OP · <span ref={captionRef}>{meet.portrait.caption}</span>
              </>
            }
            hintPointer={meet.portrait.hintPointer}
            hintTouch={meet.portrait.hintTouch}
            controlLabel={meet.portrait.control}
            controlHelp={meet.portrait.controlHelp}
            onReady={(controller) => {
              controllerRef.current = controller;
            }}
          />
        </div>
      </div>
      <div id="meet-story" className="meet-chapters gutter scroll-mt-16">
        {children}
      </div>
    </section>
  );
}
