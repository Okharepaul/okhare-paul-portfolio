import type Lenis from "lenis";

/** The single smooth-scroll instance, shared so the loader and the band can reach it. */
let instance: Lenis | null = null;

export const getLenis = (): Lenis | null => instance;

export function setLenis(lenis: Lenis | null): void {
  instance = lenis;
}

/**
 * How the page glides. The share of the remaining distance covered each frame (at 60 a second):
 * lower is a longer, softer settle. 0.075 lets a flick of the wheel coast for about a second
 * without the page feeling late to answer.
 */
export const SCROLL_LERP = 0.075;
/** A notch of the wheel moves the page a little less than the browser would, so fast wheels do not fling it. */
export const WHEEL_MULTIPLIER = 0.9;
/** One press of an arrow key, in pixels. */
export const ARROW_STEP_PX = 120;
/** Page Down and the space bar move this share of the screen, leaving a strip of what was there. */
export const PAGE_STEP_SHARE = 0.86;

/**
 * How far a key moves the page, in pixels (down is positive); Home and End give an infinity,
 * to be held to the ends of the page. Null for a key that does not scroll.
 */
export function keyScrollDelta(key: string, isShiftHeld: boolean, viewportHeight: number): number | null {
  const page = viewportHeight * PAGE_STEP_SHARE;
  switch (key) {
    case "ArrowDown":
      return ARROW_STEP_PX;
    case "ArrowUp":
      return -ARROW_STEP_PX;
    case "PageDown":
      return page;
    case "PageUp":
      return -page;
    case " ":
      return isShiftHeld ? -page : page;
    case "Home":
      return Number.NEGATIVE_INFINITY;
    case "End":
      return Number.POSITIVE_INFINITY;
    default:
      return null;
  }
}

/** True when a key pressed on this element belongs to the page, not to a field, a control or a scrolling box. */
export function keyBelongsToPage(target: EventTarget | null, key: string): boolean {
  // An open dialog owns the keyboard, wherever focus happens to rest.
  if (document.querySelector('[aria-modal="true"]')) return false;
  if (!(target instanceof Element)) return true;
  if (target.closest("[data-lenis-prevent], [contenteditable='true']")) return false;
  if (target === document.body || target === document.documentElement) return true;
  // A link scrolls the page with every key but Enter; anything else that holds focus keeps its keys.
  return target.tagName === "A" && key !== "Enter";
}

/** Smooth-scroll to an element or to the top; falls back to the browser when Lenis is off. */
export function scrollToTarget(target: HTMLElement | number): void {
  if (instance) {
    instance.scrollTo(target, { duration: 1.4 });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
  else target.scrollIntoView({ behavior: "smooth" });
}
