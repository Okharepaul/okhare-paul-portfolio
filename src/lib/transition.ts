/**
 * Shared pieces of the page transition. Leaving a page, whatever is on screen
 * leaves first; a section can register to stage its own exit (the project
 * stack does), and the transition waits for it before changing page.
 */

/** A section's own exit. `isTakeover`: it replaces the standard exit instead of joining it. */
export interface LeavePlan {
  done: Promise<void>;
  isTakeover: boolean;
}

/** Called with the link that was clicked. Returns a plan, or null to leave it to the standard exit. */
export type LeaveHandler = (anchor: HTMLAnchorElement) => LeavePlan | null;

const handlers = new Set<LeaveHandler>();

/** Register a section's exit. Returns the function that removes it again. */
export function onPageLeave(handler: LeaveHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** Every plan the registered sections have for this click. */
export function leavePlans(anchor: HTMLAnchorElement): LeavePlan[] {
  return [...handlers].flatMap((handler) => {
    const plan = handler(anchor);
    return plan ? [plan] : [];
  });
}

/** Sent on `window` when a navigation is abandoned, so a section that staged its own exit can undo it. */
export const LEAVE_CANCELLED_EVENT = "op:leave-cancelled";

/** The standard exit, start to page change, in seconds. */
export const LEAVE_SECONDS = 1;
/** The project stack's exit when one of its projects is chosen, in seconds. */
export const STACK_LEAVE_SECONDS = 2;
/** How long after the click the stack waits before the other titles start to go. */
export const STACK_OUTRO_AFTER_MS = 250;

/** The first and last moments (seconds) at which a title in the stack starts moving. */
const STACK_FIRST_DELAY = 0.2;
const STACK_LAST_DELAY = 0.9;

/**
 * When a title in the stack starts to move, in seconds. The bottom title goes
 * first and the top one last, spread evenly over the same window however many
 * titles there are, so the whole cascade always takes the same time.
 */
export function stackDelay(index: number, count: number): number {
  if (count <= 1) return STACK_FIRST_DELAY;
  const fromEnd = Math.min(count - 1, Math.max(0, count - 1 - index));
  return STACK_FIRST_DELAY + ((STACK_LAST_DELAY - STACK_FIRST_DELAY) * fromEnd) / (count - 1);
}

/**
 * A title broken into the lines it is set on in the stack: the last word gets
 * a line to itself, so two-word names stand as two short, heavy lines.
 */
export function stackLines(title: string): string[] {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words;
  return [words.slice(0, -1).join(" "), words[words.length - 1]];
}
