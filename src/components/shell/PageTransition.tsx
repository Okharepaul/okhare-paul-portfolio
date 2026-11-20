"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ENTERING_ATTRIBUTE, MARKED_SELECTOR } from "@/lib/entrance";
import { prefersReducedMotion } from "@/lib/motion";
import { scrollToTarget } from "@/lib/scroll";
import { LEAVE_CANCELLED_EVENT, LEAVE_SECONDS, STACK_LEAVE_SECONDS, leavePlans } from "@/lib/transition";

gsap.registerPlugin(CustomEase);

/** Pictures settle back and fade. */
const MEDIA_EASE = CustomEase.create("exit-media", "0.23, 1, 0.32, 1");
/** Lines of text swing shut. */
const TEXT_EASE = CustomEase.create("exit-text", "0.25, 0.46, 0.45, 0.94");
/** The cover over a case study's picture comes back down. */
const COVER_EASE = CustomEase.create("exit-cover", "0.755, 0.05, 0.855, 0.06");

const MEDIA_SELECTOR = 'figure, video, .crosshair, [data-exit="media"]';
const HEADING_SELECTOR = "h1, h2, h3, [data-chars]";
const TEXT_SELECTOR = 'p, li, dt, dd, blockquote, label, button, .label, .chip, a[class*="btn-"]';
/** More than this on one screen and the exit would cost more than it shows. */
const MAX_EXITING = 160;
/** The curtain closes over the last part of the exit and opens again as the next page arrives. */
const CURTAIN_SECONDS = 0.5;
/** If a navigation never lands on a new page, put everything back. */
const STUCK_AFTER_MS = 4000;
const withoutTrailingSlash = (pathname: string): string => (pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname);

function isPlainLeftClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

/** The element a hash points at, or null (also when the hash is malformed). */
function hashTarget(hash: string): HTMLElement | null {
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

interface Exiting {
  media: HTMLElement[];
  headings: HTMLElement[];
  text: HTMLElement[];
  covers: HTMLElement[];
}

/**
 * What is on screen right now, sorted by how it should leave. An element is
 * only taken once: never inside one already taken, never around one. Sections
 * marked `data-exit="none"` stage their own exit and are left alone.
 */
function collectExiting(root: HTMLElement): Exiting {
  const taken: HTMLElement[] = [];
  const isOnScreen = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
  };
  const pick = (selector: string): HTMLElement[] => {
    const picked: HTMLElement[] = [];
    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      if (taken.length >= MAX_EXITING || element.closest('[data-exit="none"]') || !isOnScreen(element)) return;
      if (taken.some((other) => other.contains(element) || element.contains(other))) return;
      taken.push(element);
      picked.push(element);
    });
    return picked;
  };

  // A picture with a cover leaves by having the cover close over it, so it is kept out of the pictures that shrink away.
  // (The cover itself is scaled to nothing at rest, so it is its frame that is measured.)
  const covers = Array.from(root.querySelectorAll<HTMLElement>("[data-hero-cover]")).filter((cover) => {
    const frame = cover.parentElement;
    if (!frame || !isOnScreen(frame)) return false;
    taken.push(frame.closest<HTMLElement>("figure") ?? frame);
    return true;
  });
  const media = pick(MEDIA_SELECTOR);
  const headings = pick(HEADING_SELECTOR);
  const text = pick(TEXT_SELECTOR);
  return { media, headings, text, covers };
}

/** How an element looked before it was sent off, so an abandoned navigation can put it back exactly. */
interface Snapshot {
  element: HTMLElement;
  opacity: string;
  transform: string;
  transformOrigin: string;
}

const snapshot = (element: HTMLElement): Snapshot => ({
  element,
  opacity: element.style.opacity,
  transform: element.style.transform,
  transformOrigin: element.style.transformOrigin,
});

function restore({ element, opacity, transform, transformOrigin }: Snapshot): void {
  element.style.opacity = opacity;
  element.style.transform = transform;
  element.style.transformOrigin = transformOrigin;
}

/**
 * A visitor can click away while the page is still arriving. Each element
 * about to leave has its entrance finished on the spot first, so the exit
 * starts from where the element belongs and nothing is left half-turned.
 */
function finishEntrance(element: HTMLElement): void {
  gsap.killTweensOf(element);
  if (element.hasAttribute(ENTERING_ATTRIBUTE)) {
    element.removeAttribute(ENTERING_ATTRIBUTE);
    gsap.set(element, { clearProps: "opacity,transform,transformOrigin" });
    return;
  }
  // Blocks marked in the markup are hidden by the stylesheet until shown, so they are shown outright.
  if (element.matches(MARKED_SELECTOR)) gsap.set(element, { opacity: 1, clearProps: "transform,transformOrigin" });
  else gsap.set(element, { clearProps: "transform,transformOrigin" });
}

/**
 * Everything on screen leaves: pictures settle back, headings slide off, lines
 * swing shut. Starts after `delay` seconds. Returns the tweens, so they alone
 * can be stopped later.
 */
function playExit({ media, headings, text, covers }: Exiting, delay: number): gsap.core.Tween[] {
  // The cover was taken away by a CSS animation, which would win over any new transform: retire it first.
  covers.forEach((cover) => {
    cover.style.animation = "none";
  });
  // Empty groups are skipped: asked to move nothing, the animation library logs a warning.
  const tweens = [
    media.length > 0 ? gsap.to(media, { scale: 0.9, opacity: 0, duration: 1, ease: MEDIA_EASE, delay, overwrite: "auto" }) : null,
    headings.length > 0
      ? gsap.to(headings, { x: -50, opacity: 0, duration: 0.5, ease: "power2.in", stagger: { amount: 0.2 }, delay: delay + 0.1, overwrite: "auto" })
      : null,
    text.length > 0
      ? gsap.to(text, {
          rotationY: 35,
          opacity: 0,
          transformPerspective: 250,
          transformOrigin: "left center",
          duration: 0.5,
          ease: TEXT_EASE,
          stagger: { amount: 0.35 },
          delay,
          overwrite: "auto",
        })
      : null,
    covers.length > 0 ? gsap.fromTo(covers, { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: COVER_EASE, delay }) : null,
  ];
  return tweens.filter((tween) => tween !== null);
}

/**
 * Page transitions. On a link to another page, what is on screen leaves
 * first, each kind of thing in its own way, and the ground colour closes over
 * it; then the page changes and the ground opens again on the new page as its
 * own entrances play. A section can stage its own exit (see `onPageLeave`).
 * It also turns same-page section links ("/#about") into a smooth scroll.
 * With reduced motion, links simply navigate.
 */
export function PageTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const curtainRef = useRef<HTMLDivElement>(null);
  const isFirstPage = useRef(true);
  const isBusy = useRef(false);
  const stuckTimer = useRef(0);
  /** Counts departures and arrivals, so a departure overtaken by another navigation knows not to finish. */
  const leaveId = useRef(0);
  const tweensRef = useRef<gsap.core.Tween[]>([]);
  const snapshotsRef = useRef<Snapshot[]>([]);
  const coversRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const leave = (anchor: HTMLAnchorElement, destination: string): void => {
      const curtain = curtainRef.current;
      const main = document.getElementById("main");
      if (!curtain || !main) {
        router.push(destination);
        return;
      }
      isBusy.current = true;
      leaveId.current += 1;
      const id = leaveId.current;
      const from = window.location.pathname;
      router.prefetch(destination);

      const plans = leavePlans(anchor);
      const total = plans.some((plan) => plan.isTakeover) ? STACK_LEAVE_SECONDS : LEAVE_SECONDS;
      // The standard exit always fills the last second, however long a section's own exit runs before it.
      const offset = total - LEAVE_SECONDS;
      const exiting = collectExiting(main);
      const leaving = [...exiting.media, ...exiting.headings, ...exiting.text];
      leaving.forEach(finishEntrance);
      snapshotsRef.current = leaving.map(snapshot);
      coversRef.current = exiting.covers;
      tweensRef.current = playExit(exiting, offset);
      gsap.to(curtain, { opacity: 1, duration: CURTAIN_SECONDS, delay: total - CURTAIN_SECONDS, ease: "none" });

      // Back, forward or another navigation may have happened meanwhile: only finish a departure that is still the current one.
      const finish = (): void => {
        if (leaveId.current === id && window.location.pathname === from) router.push(destination);
      };
      const timer = new Promise<void>((resolve) => window.setTimeout(resolve, total * 1000));
      Promise.all([timer, ...plans.map((plan) => plan.done)]).then(finish, finish);

      stuckTimer.current = window.setTimeout(
        () => {
          // The new page never came: put this one back exactly as it was.
          isBusy.current = false;
          leaveId.current += 1;
          tweensRef.current.forEach((tween) => tween.kill());
          snapshotsRef.current.forEach(restore);
          // A cover's resting place is out of the way, which its retired animation no longer provides.
          if (coversRef.current.length > 0) gsap.set(coversRef.current, { scaleY: 0 });
          gsap.to(curtain, { opacity: 0, duration: CURTAIN_SECONDS, overwrite: true });
          window.dispatchEvent(new Event(LEAVE_CANCELLED_EVENT));
        },
        total * 1000 + STUCK_AFTER_MS,
      );
    };

    const handleClick = (event: MouseEvent): void => {
      if (event.defaultPrevented || !isPlainLeftClick(event)) return;
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const isSamePage =
        withoutTrailingSlash(url.pathname) === withoutTrailingSlash(window.location.pathname) && url.search === window.location.search;

      // Same page: scroll to the section (or the top) instead of jumping.
      if (isSamePage) {
        const target = url.hash ? hashTarget(url.hash) : null;
        if (url.hash && !target) return;
        event.preventDefault();
        scrollToTarget(target ?? 0);
        // Keep keyboard order honest: focus follows the jump (this is what makes "Skip to main content" work).
        if (target) {
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }
        return;
      }

      // Same path, different query (e.g. ?print=1): let the router handle it without a transition.
      if (withoutTrailingSlash(url.pathname) === withoutTrailingSlash(window.location.pathname)) return;
      if (prefersReducedMotion()) return;

      event.preventDefault();
      // A second click while the page is leaving is ignored rather than restarting it.
      if (isBusy.current) return;
      leave(anchor, `${url.pathname}${url.search}${url.hash}`);
    };

    // Capture phase, so this runs before the router's own link handling.
    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.clearTimeout(stuckTimer.current);
    };
  }, [router]);

  // A new page has arrived (by a link, or back/forward): open the curtain on it.
  useEffect(() => {
    window.clearTimeout(stuckTimer.current);
    isBusy.current = false;
    leaveId.current += 1;
    tweensRef.current = [];
    snapshotsRef.current = [];
    coversRef.current = [];
    if (isFirstPage.current) {
      isFirstPage.current = false;
      return;
    }
    const curtain = curtainRef.current;
    if (!curtain) return;
    gsap.to(curtain, { opacity: 0, duration: CURTAIN_SECONDS, ease: "none", overwrite: true });
  }, [pathname]);

  return <div ref={curtainRef} aria-hidden="true" className="page-curtain no-print" />;
}
