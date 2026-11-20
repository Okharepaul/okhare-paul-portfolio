"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import {
  ENTERING_ATTRIBUTE,
  ENTRANCE_DEPTH_PX,
  ENTRANCE_SECONDS,
  PRE_ENTER_CLASS,
  collectEntering,
  entranceHold,
  entrancePose,
  entranceStagger,
  inPageOrder,
} from "@/lib/entrance";
import { prefersReducedMotion } from "@/lib/motion";
import { isSiteReady, onSiteReady } from "@/lib/ready";
import { SCROLL_LERP, WHEEL_MULTIPLIER, keyBelongsToPage, keyScrollDelta, setLenis } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger, useGSAP, CustomEase);

/** A swing that can be followed by eye for its first half second, then a long settle. */
const ENTRANCE_EASE = CustomEase.create("entrance", "0.22, 1, 0.36, 1");
/** How far a heading on the first screen tips back while its letters rise. */
const HEADING_TIP_DEGREES = 58;
/**
 * A block starts its scroll animation once its top is this far above the
 * bottom of the screen. The same line decides what counts as "on the first
 * screen", so every block belongs to exactly one of the two: arrival or scroll.
 */
const REVEAL_MARGIN_PX = 80;

/**
 * True for an element on the first screen as the page arrives. Those take the
 * 3D arrival; everything further down keeps its ordinary scroll animation.
 */
function isOnFirstScreen(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight - REVEAL_MARGIN_PX;
}

/**
 * The way out when anything in the wiring fails: show the whole page as it is,
 * flat and still, rather than leave any of it hidden. That means undoing the
 * stylesheet's hidden start states and every start pose already written inline.
 */
function showEverything(): void {
  document.documentElement.classList.remove("motion", PRE_ENTER_CLASS);
  const posed = gsap.utils.toArray<HTMLElement>(`.char, .reveal, [data-reveal], .animate-in, [data-chars], [${ENTERING_ATTRIBUTE}]`);
  if (posed.length > 0) gsap.set(posed, { clearProps: "all" });
  posed.forEach((element) => element.removeAttribute(ENTERING_ATTRIBUTE));
}

/** The distance the 3D entrances are viewed from: about a screen's width, never so close that they distort. */
const viewDistance = (): number => Math.max(900, window.innerWidth);

/**
 * Puts each element in its starting pose: tilted away on one edge, back in
 * the screen, unseen. All sizes are read before anything is moved.
 */
function poseForEntrance(elements: readonly HTMLElement[]): void {
  const rects = elements.map((element) => element.getBoundingClientRect());
  const perspective = viewDistance();
  elements.forEach((element, i) => {
    const rect = rects[i];
    gsap.set(element, {
      ...entrancePose(rect.width, rect.height, rect.left + rect.width / 2, window.innerWidth),
      z: ENTRANCE_DEPTH_PX,
      opacity: 0,
      transformPerspective: perspective,
    });
  });
}

declare global {
  interface Window {
    /** Set once animations are wired, so the failsafe in <head> stands down. */
    __motionReady?: boolean;
  }
}

const CHAR_START = "top 88%";

/**
 * Headings: letters rise out of a mask, one after another, as the heading
 * scrolls into view. A heading on the first screen is part of the page's
 * arrival, so it also stands up from its bottom edge while its letters rise.
 */
function revealChars(): void {
  const headings = gsap.utils.toArray<HTMLElement>("[data-chars]");
  // Read where each one is before any of them is moved.
  const isArriving = headings.map((element) => isOnFirstScreen(element) && !element.closest(".animate-in, .reveal, [data-reveal]"));

  headings.forEach((element, i) => {
    const chars = element.querySelectorAll(".char");
    if (chars.length === 0) return;
    const tween = gsap.fromTo(
      chars,
      { yPercent: 115, y: 0 },
      { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.022, paused: true },
    );
    const tilt = isArriving[i]
      ? gsap.fromTo(
          element,
          { rotationX: HEADING_TIP_DEGREES, transformPerspective: viewDistance(), transformOrigin: "50% 100%" },
          { rotationX: 0, duration: ENTRANCE_SECONDS, ease: ENTRANCE_EASE, paused: true, clearProps: "transform,transformOrigin" },
        )
      : null;
    const play = (): void => {
      const hold = entranceHold();
      tween.delay(hold).restart(true);
      tilt?.delay(hold).restart(true);
    };
    if (element.dataset.chars === "intro") {
      onSiteReady(play);
      return;
    }
    ScrollTrigger.create({ trigger: element, start: CHAR_START, once: true, onEnter: play });
  });
}

/** Further down the page, a marked block fades up as it scrolls into view. */
function fadeUpOnScroll(element: HTMLElement): void {
  gsap.fromTo(
    element,
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, ease: "power4.out", scrollTrigger: { trigger: element, start: `top bottom-=${REVEAL_MARGIN_PX}` } },
  );
}

/**
 * The arrival of a page, and the scroll animation for the rest of it.
 *
 * What is on the first screen as the page arrives rises into place in 3D: the
 * blocks marked for it in the markup, and every picture and line of text
 * besides. Each starts tilted away into the screen on one edge and turns to
 * face the visitor, one after another. Below the first screen nothing is
 * different from before: marked blocks fade up as they scroll into view, and
 * everything else is simply there.
 *
 * Poses the first screen now, and returns the function that sets it going
 * (held until the loader lifts).
 */
function arriveAndReveal(): () => void {
  const marked = gsap.utils.toArray<HTMLElement>(".reveal, [data-reveal]");
  // Read where everything is before anything is moved.
  const isArriving = marked.map(isOnFirstScreen);
  // The page itself, and the footer under it, should a page be short enough to show it at once.
  const found = gsap.utils.toArray<HTMLElement>("#main, body > footer").flatMap((root) => collectEntering(root, isOnFirstScreen));
  // Some of these are meant to be faint: they rise to their own opacity, not to full.
  const restingOpacity = new Map(found.map((element) => [element, Number(getComputedStyle(element).opacity)]));
  const arriving = inPageOrder([...marked.filter((_element, i) => isArriving[i]), ...found]);

  marked.filter((_element, i) => !isArriving[i]).forEach(fadeUpOnScroll);
  found.forEach((element) => element.setAttribute(ENTERING_ATTRIBUTE, ""));
  poseForEntrance(arriving);

  /** Hands an element back to its stylesheet once it has arrived. */
  const settle = (element: HTMLElement): void => {
    // Something else has taken it up meanwhile (the page is leaving, or a button is leaning to the pointer): leave it be.
    if (gsap.isTweening(element)) return;
    if (restingOpacity.has(element)) {
      element.removeAttribute(ENTERING_ATTRIBUTE);
      gsap.set(element, { clearProps: "opacity,transform,transformOrigin" });
      return;
    }
    // Marked blocks are hidden by the stylesheet until shown, so their opacity stays set.
    gsap.set(element, { clearProps: "transform,transformOrigin" });
  };

  return (): void => {
    if (arriving.length === 0) return;
    try {
      gsap.to(arriving, {
        rotationX: 0,
        rotationY: 0,
        z: 0,
        opacity: (_index: number, target: HTMLElement) => restingOpacity.get(target) ?? 1,
        duration: ENTRANCE_SECONDS,
        ease: ENTRANCE_EASE,
        delay: entranceHold(),
        stagger: entranceStagger(arriving.length),
        overwrite: "auto",
        onComplete: () => arriving.forEach(settle),
      });
    } catch {
      // This runs later than the rest of the wiring (after the loader), so it needs its own way out.
      showEverything();
    }
  };
}

/** A paragraph lights up word by word, in step with scrolling. */
function scrubWords(): void {
  gsap.utils.toArray<HTMLElement>("[data-words]").forEach((element) => {
    gsap.fromTo(
      element.querySelectorAll(".word"),
      { opacity: 0.38 },
      { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: element, start: "top 85%", end: "bottom 75%", scrub: true } },
    );
  });
}

/** Numbers roll up to their value, keeping leading zeros so the width never shifts. */
function countUp(): void {
  gsap.utils.toArray<HTMLElement>("[data-count]").forEach((element) => {
    const target = Number(element.dataset.count);
    if (!Number.isFinite(target)) return;
    const width = Number(element.dataset.pad ?? 0);
    const suffix = element.dataset.suffix ?? "";
    const counter = { value: 0 };
    gsap.to(counter, {
      value: target,
      duration: 1.4,
      ease: "power3.out",
      scrollTrigger: { trigger: element, start: "top 92%", once: true },
      onUpdate: () => {
        element.textContent = `${String(Math.round(counter.value)).padStart(width, "0")}${suffix}`;
      },
    });
  });
}

/** Everything in the hero marked .animate-in rises into place once the loader has lifted. */
function heroEntrance(): void {
  const items = gsap.utils.toArray<HTMLElement>(".animate-in");
  if (items.length === 0) return;
  poseForEntrance(items);
  const tween = gsap.to(items, {
    rotationX: 0,
    rotationY: 0,
    z: 0,
    opacity: 1,
    duration: ENTRANCE_SECONDS,
    stagger: 0.05,
    delay: 0.35,
    ease: ENTRANCE_EASE,
    paused: true,
    clearProps: "transform,transformOrigin",
  });
  onSiteReady(() => tween.play());
}

/**
 * Proximity weight: the closer the pointer, the heavier each letter. Driven by
 * the variable font's weight axis; the loop stops as soon as nothing is moving.
 */
function proximityWeight(element: HTMLElement): () => void {
  const [min, max, radius] = (element.dataset.weight ?? "").split(",").map(Number);
  const chars = Array.from(element.querySelectorAll<HTMLElement>(".char"));
  if (!min || !max || !radius || chars.length === 0) return () => {};

  const weights = chars.map(() => min);
  let centres: { x: number; y: number }[] = [];
  let pointer = { x: -9999, y: -9999 };
  let frame = 0;
  let isInside = false;

  const measure = (): void => {
    centres = chars.map((char) => {
      const rect = char.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });
  };

  const tick = (): void => {
    let isMoving = false;
    chars.forEach((char, i) => {
      const centre = centres[i];
      if (!centre) return;
      const closeness = Math.max(0, 1 - Math.hypot(pointer.x - centre.x, pointer.y - centre.y) / radius);
      const target = min + (max - min) * closeness * closeness * (3 - 2 * closeness);
      weights[i] += 0.18 * (target - weights[i]);
      if (Math.abs(target - weights[i]) > 0.5) isMoving = true;
      char.style.fontVariationSettings = `"wght" ${weights[i].toFixed(0)}`;
    });
    frame = isMoving || isInside ? window.requestAnimationFrame(tick) : 0;
  };

  const handleMove = (event: PointerEvent): void => {
    pointer = { x: event.clientX, y: event.clientY };
    if (frame === 0) {
      measure();
      frame = window.requestAnimationFrame(tick);
    }
  };
  const handleEnter = (): void => {
    isInside = true;
  };
  const handleLeave = (): void => {
    isInside = false;
    pointer = { x: -9999, y: -9999 };
  };

  const host = element.parentElement ?? element;
  window.addEventListener("pointermove", handleMove, { passive: true });
  host.addEventListener("pointerenter", handleEnter);
  host.addEventListener("pointerleave", handleLeave);
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);
  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener("pointermove", handleMove);
    host.removeEventListener("pointerenter", handleEnter);
    host.removeEventListener("pointerleave", handleLeave);
    window.removeEventListener("scroll", measure);
    window.removeEventListener("resize", measure);
  };
}

/**
 * One place that wires scroll and entrance motion for whatever page is showing.
 * Pages stay server components and opt in with classes and data attributes:
 *   data-chars    letters rise from a mask ("intro" waits for the loader)
 *   data-weight   "min,max,radius": letters thicken near the pointer
 *   .reveal       block fades up as it scrolls into view (also `data-reveal`); on the first
 *                 screen it takes the page's 3D arrival instead
 *   data-enter    "none": this section and everything in it is left out of the automatic arrival
 *                 (needed round anything inside a Suspense boundary, which React claims later than the page)
 *   data-words    paragraph lights up word by word with scroll
 *   data-count    number rolls up (data-pad for leading zeros)
 *   .animate-in   hero items that arrive once the loader is done
 */
export function Motion() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  /** The path last set up, so a change of page can be told from a first visit. */
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ lerp: SCROLL_LERP, wheelMultiplier: WHEEL_MULTIPLIER, anchors: true, stopInertiaOnNavigate: true });
    lenisRef.current = lenis;
    setLenis(lenis);
    // The loader mounts first, so it cannot stop a scroller that does not exist yet: hold it here instead.
    const releaseScroll = isSiteReady() ? null : onSiteReady(() => lenis.start());
    if (releaseScroll) lenis.stop();
    const raf = (time: number): void => lenis.raf(time * 1000);
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // The keyboard glides like the wheel does: left to the browser, a key press would jump.
    const handleKey = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.isComposing || event.ctrlKey || event.metaKey || event.altKey || lenis.isStopped) return;
      // Shift with anything but the space bar is how text is selected from the keyboard.
      if (event.shiftKey && event.key !== " ") return;
      if (!keyBelongsToPage(event.target, event.key)) return;
      const delta = keyScrollDelta(event.key, event.shiftKey, window.innerHeight);
      if (delta === null) return;
      event.preventDefault();
      const target = Math.min(lenis.limit, Math.max(0, lenis.targetScroll + delta));
      lenis.scrollTo(target, { lerp: SCROLL_LERP });
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      releaseScroll?.();
      window.removeEventListener("keydown", handleKey);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  useGSAP(
    (_context, contextSafe) => {
      // A new page starts at the top, unless the link pointed at a section. Done first, so that
      // everything below is measured where the visitor will see it.
      const isNewPage = lastPath.current !== null && lastPath.current !== pathname;
      lastPath.current = pathname;
      if (isNewPage && !window.location.hash) {
        lenisRef.current?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
      }

      if (prefersReducedMotion()) {
        window.__motionReady = true;
        document.documentElement.classList.remove(PRE_ENTER_CLASS);
        return;
      }

      const cleanups: (() => void)[] = [];
      try {
        revealChars();
        const arrive = arriveAndReveal();
        // Held until the loader has lifted, so a first visit sees the page arrive.
        cleanups.push(onSiteReady(contextSafe ? contextSafe(arrive) : arrive));
        scrubWords();
        countUp();
        heroEntrance();
        if (window.matchMedia("(hover: hover)").matches) {
          gsap.utils.toArray<HTMLElement>("[data-weight]").forEach((element) => cleanups.push(proximityWeight(element)));
        }
        window.__motionReady = true;
        // Everything is in its starting pose: the page can be let through again.
        document.documentElement.classList.remove(PRE_ENTER_CLASS);
      } catch {
        showEverything();
      }

      // Pinned sections register their own triggers; put everything in page
      // order before measuring so pin spacing lands in the right places.
      document.fonts.ready
        .then(() => {
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        })
        .catch(() => undefined);

      return () => cleanups.forEach((cleanup) => cleanup());
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
