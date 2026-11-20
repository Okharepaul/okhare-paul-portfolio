/**
 * The arithmetic behind the site's own scroll bar, kept apart from the page so
 * it can be tested: where the thumb sits and how long it is, which scroll
 * position a point on the track stands for, and how far a fast scroll
 * stretches the thumb.
 */

export type ScrollMetrics = {
  /** Height of the track the thumb runs along, in pixels. */
  trackHeight: number;
  viewportHeight: number;
  pageHeight: number;
  scroll: number;
  /** The thumb is never shorter than this, so it can always be seen and caught. */
  minThumb: number;
};

export type ScrollGeometry = {
  isScrollable: boolean;
  /** Length of the thumb, in pixels. */
  thumb: number;
  /** Distance from the top of the track to the top of the thumb. */
  offset: number;
  /** 0 at the top of the page, 1 at the bottom. */
  progress: number;
  /** The furthest the page can scroll. */
  maxScroll: number;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export function scrollGeometry({ trackHeight, viewportHeight, pageHeight, scroll, minThumb }: ScrollMetrics): ScrollGeometry {
  const track = Math.max(0, trackHeight);
  const maxScroll = Math.max(0, pageHeight - viewportHeight);
  if (maxScroll < 1 || track === 0 || pageHeight <= 0) {
    return { isScrollable: false, thumb: track, offset: 0, progress: 0, maxScroll };
  }
  const thumb = clamp((track * viewportHeight) / pageHeight, Math.min(minThumb, track), track);
  const progress = clamp(scroll / maxScroll, 0, 1);
  return { isScrollable: true, thumb, offset: (track - thumb) * progress, progress, maxScroll };
}

/** The scroll position that puts the top of the thumb at `offset` pixels down the track. */
export function scrollForOffset(offset: number, geometry: ScrollGeometry, trackHeight: number): number {
  const travel = trackHeight - geometry.thumb;
  if (travel <= 0) return 0;
  return clamp(offset / travel, 0, 1) * geometry.maxScroll;
}

/** Below this speed (pixels a second) the thumb keeps its length: reading-pace scrolling should not wobble it. */
export const STRETCH_FROM_SPEED = 240;
/** Extra length per pixel a second above that. */
export const STRETCH_PER_SPEED = 0.00016;
/** The most the thumb may stretch, as a share of its length. */
export const MAX_STRETCH = 0.55;

/** How much longer than at rest the thumb is drawn at this scroll speed (pixels a second, either way). */
export function stretchFor(velocity: number): number {
  const speed = Math.abs(velocity);
  if (!Number.isFinite(speed) || speed <= STRETCH_FROM_SPEED) return 0;
  return Math.min(MAX_STRETCH, (speed - STRETCH_FROM_SPEED) * STRETCH_PER_SPEED);
}

/** The readout beside the thumb: how far down the page, as three digits ("007", "100"). */
export function formatProgress(progress: number): string {
  const percent = Math.round(clamp(Number.isFinite(progress) ? progress : 0, 0, 1) * 100);
  return String(percent).padStart(3, "0");
}
