/**
 * Shared maths for the site's dot textures (the hero shader's look, on a 2D
 * canvas): ordered-dither thresholds, a small value noise and soft clusters.
 */

/** Size of one dot cell in CSS pixels; the same lattice as the hero. */
export const DOT_CELL_PX = 9;

/** One cell of the 2×2 ordered-dither matrix: 0, 2 / 3, 1. */
function quad(x: number, y: number): number {
  const bx = x & 1;
  const by = y & 1;
  return 2 * bx + 3 * by - 4 * bx * by;
}

/** 8×8 Bayer threshold in (0, 1) for an integer cell. Every value 0..63 appears once per 8×8 tile. */
export function bayer8(x: number, y: number): number {
  return (quad(x, y) * 16 + quad(x >> 1, y >> 1) * 4 + quad(x >> 2, y >> 2) + 0.5) / 64;
}

/** Repeatable pseudo-random number in [0, 1) for a cell. */
export function hash2(x: number, y: number, seed = 0): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Smooth 2D value noise in [0, 1). */
export function valueNoise(x: number, y: number, seed = 0): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const top = hash2(ix, iy, seed) + (hash2(ix + 1, iy, seed) - hash2(ix, iy, seed)) * fx;
  const bottom = hash2(ix, iy + 1, seed) + (hash2(ix + 1, iy + 1, seed) - hash2(ix, iy + 1, seed)) * fx;
  return top + (bottom - top) * fy;
}

export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** A soft cluster of dots. Position and radius are fractions of the field. */
export interface DotBlob {
  x: number;
  y: number;
  /** Radius as a fraction of the field's mean side. */
  radius: number;
  /** Peak density, 0..1. Defaults to 1. */
  strength?: number;
}

/** Density (0..1) that a set of clusters gives a point, before noise and dithering. */
export function blobDensity(blobs: readonly DotBlob[], px: number, py: number, width: number, height: number): number {
  const side = (width + height) / 2;
  const total = blobs.reduce((sum, blob) => {
    const radius = Math.max(1, blob.radius * side);
    const dx = px - blob.x * width;
    const dy = py - blob.y * height;
    return sum + (blob.strength ?? 1) * Math.exp(-(dx * dx + dy * dy) / (radius * radius));
  }, 0);
  return clamp01(total);
}

/** Brightness of an sRGB colour (channels 0..255) as 0..1. Rec. 709 weights, which is plenty for dithering. */
export function luminance(red: number, green: number, blue: number): number {
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
}

/** Below this strength a tone is drawn as scattered small dots; above it, as a dot in every cell that grows with the tone. */
const HALFTONE_FAINT = 0.2;
const HALFTONE_MIN_SHARE = 0.26;
const HALFTONE_MAX_SHARE = 0.84;
/** The narrowest band of brightness that is stretched to the full range of dot sizes. */
const HALFTONE_MIN_SPAN = 0.3;

/**
 * Halftone: the side of a dot as a share of its cell for a tone of strength
 * 0..1, or 0 for an empty cell. Strong tones get big dots. Faint ones thin out
 * through the ordered dither into a scatter of small dots, the way the dot
 * fields fade, instead of shrinking to specks too small to see.
 */
export function halftoneShare(tone: number, column: number, row: number): number {
  const level = clamp01(tone);
  if (level < HALFTONE_FAINT) return level / HALFTONE_FAINT > bayer8(column, row) ? HALFTONE_MIN_SHARE : 0;
  return HALFTONE_MIN_SHARE + ((HALFTONE_MAX_SHARE - HALFTONE_MIN_SHARE) * (level - HALFTONE_FAINT)) / (1 - HALFTONE_FAINT);
}

/**
 * Turns a picture's brightness per cell (0..1) into the tone its dots should
 * carry. Dots always stand for the less common tone, so a pale page is drawn
 * by its dark marks and a dark one by its highlights, and the result stays
 * mostly open ground either way. The range is stretched between the 5th and
 * 95th percentile so flat pictures still use the whole range of dot sizes.
 */
export function halftoneTones(brightness: readonly number[]): number[] {
  if (brightness.length === 0) return [];
  const mean = brightness.reduce((sum, value) => sum + value, 0) / brightness.length;
  const raw = mean > 0.5 ? brightness.map((value) => 1 - value) : [...brightness];
  const sorted = [...raw].sort((a, b) => a - b);
  // A picture of one flat tone has nothing to draw.
  if (sorted[sorted.length - 1] - sorted[0] < 0.02) return raw.map(() => 0);
  const low = sorted[Math.floor(0.05 * (sorted.length - 1))];
  const high = sorted[Math.floor(0.95 * (sorted.length - 1))];
  // Never stretch by more than this: on a near-flat page with a few marks, that would turn the paper's grain into dots.
  const span = Math.max(high - low, HALFTONE_MIN_SPAN);
  return raw.map((value) => clamp01((value - low) / span));
}

/**
 * How far one cell has come through a reveal, 0..1. Each cell starts at a
 * moment set by its `order` (0..1), so the picture arrives dot by dot; all
 * cells are done when `progress` reaches 1.
 */
export function cellReveal(progress: number, order: number, spread = 0.6): number {
  return clamp01((progress - order * spread) / (1 - spread));
}
