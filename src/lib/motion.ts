/** True when the visitor has asked the OS for less motion. Safe to call on the server. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True for mouse/trackpad devices: hover effects and the trace cursor only make sense there. */
export function hasFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** True when the browser reports the visitor's "use less data" setting. Not every browser reports it. */
export function savesData(): boolean {
  if (typeof navigator === "undefined") return false;
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean } };
  return connection?.saveData === true;
}

export type Rgb = [number, number, number];

/** "rgb(222, 222, 222)" → [0.87, 0.87, 0.87]. Falls back to mid grey if the string is unexpected. */
export function parseRgb(value: string): Rgb {
  const channels = value.match(/[\d.]+/g);
  if (!channels || channels.length < 3) return [0.5, 0.5, 0.5];
  return [Number(channels[0]) / 255, Number(channels[1]) / 255, Number(channels[2]) / 255];
}
