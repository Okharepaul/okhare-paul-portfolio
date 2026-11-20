/**
 * One tiny signal shared by the loader and anything that should wait for it
 * (the hero's letters and entrance).
 */

type Listener = () => void;

let ready = false;
const listeners = new Set<Listener>();

export const isSiteReady = (): boolean => ready;

export function markSiteReady(): void {
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

/** Runs `listener` once the loader has finished (immediately if it already has). */
export function onSiteReady(listener: Listener): () => void {
  if (ready) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
