/**
 * The arrival of a page: what is on its first screen starts tilted away into
 * the screen, hinged on one edge, and rises to face the visitor. The same
 * language as the project stack's titles, which are hinged on an edge and
 * swing open. It is for arrival only: scrolling further down a page keeps the
 * site's ordinary scroll animations.
 */

/** Where an element starts from before it rises into place. */
export interface EntrancePose {
  /** Degrees tipped back about its bottom edge (wide things). */
  rotationX: number;
  /** Degrees swung away about a side edge (tall things). */
  rotationY: number;
  /** The edge it is hinged on, as a CSS transform-origin. */
  transformOrigin: string;
}

/** Elements given the entrance automatically (not by a class in the markup) carry this until they have arrived. */
export const ENTERING_ATTRIBUTE = "data-entering";
/** Elements whose entrance is asked for in the markup; the stylesheet keeps them hidden until they are shown. */
export const MARKED_SELECTOR = ".reveal, [data-reveal], .animate-in";
/**
 * On `<html>` from before first paint until the entrances are set up: the
 * page is kept unseen for that moment, so it is never shown flat, hidden and
 * then shown rising.
 */
export const PRE_ENTER_CLASS = "pre-enter";

/** At least this many times wider than tall counts as "lying across": a line, a row, a band. */
const WIDE_RATIO = 2.2;
const TIP_DEGREES = 72;
const SWING_DEGREES = 68;
/** How far back into the screen it starts, in pixels. */
export const ENTRANCE_DEPTH_PX = -140;
/** How long each element takes to rise. */
export const ENTRANCE_SECONDS = 1.5;
/** While the page is still opening after a change of page, the rise waits this long so it is seen. */
export const ENTRANCE_HOLD_SECONDS = 0.32;
/**
 * How long an entrance should wait before starting: nothing as a rule, but a
 * beat while the page is still closed over after a change of page, so the
 * rise happens in view and not behind the curtain.
 */
export function entranceHold(): number {
  const curtain = document.querySelector(".page-curtain");
  return curtain && Number(getComputedStyle(curtain).opacity) > 0.1 ? ENTRANCE_HOLD_SECONDS : 0;
}

/** The gap between one element starting and the next, capped so a full screen still finishes promptly. */
const STAGGER_SECONDS = 0.07;
const STAGGER_TOTAL_SECONDS = 1.1;

/**
 * The starting pose for an element of this size and place. Wide things lie
 * back and stand up from their bottom edge. Tall or boxy things are doors:
 * hinged on the side nearer the edge of the screen, swung away into it.
 */
export function entrancePose(width: number, height: number, centreX: number, viewportWidth: number): EntrancePose {
  if (width >= height * WIDE_RATIO) return { rotationX: TIP_DEGREES, rotationY: 0, transformOrigin: "50% 100%" };
  return centreX <= viewportWidth / 2
    ? { rotationX: 0, rotationY: SWING_DEGREES, transformOrigin: "0% 50%" }
    : { rotationX: 0, rotationY: -SWING_DEGREES, transformOrigin: "100% 50%" };
}

/** The gap between elements for a group arriving together: the usual gap, shortened when the group is large. */
export function entranceStagger(count: number): number {
  if (count <= 1) return 0;
  return Math.min(STAGGER_SECONDS, STAGGER_TOTAL_SECONDS / (count - 1));
}

const MEDIA_SELECTOR = 'figure, video, .crosshair, [data-exit="media"]';
const TEXT_SELECTOR = 'h1, h2, h3, h4, p, li, dt, dd, blockquote, label, button, .label, .chip, a[class*="btn-"]';
/** Things that already have an entrance of their own, or have asked to be left alone, and everything inside them. */
const HANDLED_SELECTOR = '[data-enter="none"], [data-exit="none"], [data-chars], [data-reveal], .reveal, .animate-in';
/** A ceiling on how many elements one arrival will take, so a very dense screen cannot cost more than it shows. */
const MAX_ENTERING = 420;

/**
 * Everything under `root` that can take the entrance and does not already
 * have one: pictures first, then lines of text, never one inside another, and
 * nothing that is pinned to the screen. `isWanted` narrows it further (to the
 * first screen, say). In page order.
 */
export function collectEntering(root: HTMLElement, isWanted: (element: HTMLElement) => boolean = () => true): HTMLElement[] {
  const taken: HTMLElement[] = [];
  const pick = (selector: string): void => {
    root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      if (taken.length >= MAX_ENTERING || element.closest(HANDLED_SELECTOR)) return;
      if (element.offsetWidth === 0 || element.offsetHeight === 0 || !isWanted(element)) return;
      if (taken.some((other) => other.contains(element) || element.contains(other))) return;
      const position = getComputedStyle(element).position;
      if (position === "fixed" || position === "sticky") return;
      taken.push(element);
    });
  };
  pick(MEDIA_SELECTOR);
  pick(TEXT_SELECTOR);
  return inPageOrder(taken);
}

/** The same elements, sorted top of the page to bottom. */
export function inPageOrder(elements: readonly HTMLElement[]): HTMLElement[] {
  return [...elements].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}
