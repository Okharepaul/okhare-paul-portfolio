/**
 * The maths behind the lit portrait on "Meet the developer". The portrait is
 * 61 photographs of the same sitting, each with the light 6 degrees further
 * round: from directly behind (−180°), past the viewer's left, to the front
 * (0°) and on round the right to behind again (+180°). Everything here is
 * pure, so the component only has to load pictures and draw.
 */

export const FRAME_COUNT = 61;
export const FRAME_STEP_DEG = 6;
export const LAST_FRAME = FRAME_COUNT - 1;
/** The frame with the light straight on. */
export const FRONT_FRAME = LAST_FRAME / 2;
/** The size the frames were made at. */
export const FRAME_WIDTH = 696;
export const FRAME_HEIGHT = 864;

/** The pointer steers the light between these, either side of the front, as in the owner's prototype. */
export const POINTER_REACH_DEG = 150;
/** How quickly the light follows a hand, returns to rest when let go, and follows the scroll (per second). */
export const FOLLOW_RATE = 5.5;
export const FALL_RATE = 1.6;
export const SCROLL_RATE = 4;

const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));

export const frameSrc = (index: number): string => `/portrait/f${String(index).padStart(2, "0")}.webp`;

/** Where the light is for a (fractional) frame, in degrees: −180 behind, negative on the viewer's left, 0 in front. */
export const frameToAngle = (frame: number): number => -180 + frame * FRAME_STEP_DEG;

/** The (fractional) frame that shows the light at this angle. */
export const angleToFrame = (angle: number): number => clamp((angle + 180) / FRAME_STEP_DEG, 0, LAST_FRAME);

/** The light's angle for a pointer `share` of the way across the portrait (0 left edge, 1 right edge). */
export function pointerAngle(share: number): number {
  return -POINTER_REACH_DEG + 2 * POINTER_REACH_DEG * clamp(share, 0, 1);
}

/** One step of easing towards a target that keeps the same feel at any frame rate. */
export function approach(current: number, target: number, rate: number, seconds: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * seconds));
}

/**
 * How much the picture changes from each frame to the next (mean difference
 * in brightness, measured from the photographs: `FRAME_CHANGE[i]` is frame i
 * to i + 1). The frames are 6 degrees apart on paper but not to the eye: some
 * neighbours are all but identical (3 to 8, 52 to 57) and some jump (8 to 9
 * is twenty times those). Stepping through them at an even rate therefore
 * stalls and lurches. Everything that moves the light moves it along this
 * measure instead, so the picture changes at an even pace.
 */
const FRAME_CHANGE: readonly number[] = [
  0.21, 1.05, 0.92, 0.12, 0.11, 0.11, 0.11, 0.12, 2.73, 2.07, 1.64, 1.45, 1.32, 1.27, 1.29, 1.54, 1.23, 1.12, 1.59, 1.75,
  1.79, 1.5, 1.04, 1.14, 1.08, 0.98, 0.93, 0.9, 0.89, 1.29, 1.01, 0.98, 1.01, 1.06, 1.15, 1.2, 1.31, 1.2, 1.38, 1.57,
  1.55, 1.42, 1.03, 1.26, 1.6, 2.01, 1.77, 1.71, 1.69, 1.72, 1.88, 2.06, 0.13, 0.12, 0.12, 0.13, 0.14, 0.99, 0.97, 0.17,
];
/** Even the near-identical frames are given this much, so the light does not skip through the silhouette in an instant. */
const LEAST_CHANGE = 0.15;

/** The whole turn, measured in "travel": by definition as many units as there are steps between frames. */
export const TRAVEL_TOTAL = LAST_FRAME;

/** How far round the light has travelled, to the eye, by each frame. Starts at 0 and ends at `TRAVEL_TOTAL`. */
const TRAVEL_AT: readonly number[] = (() => {
  const steps = FRAME_CHANGE.map((change) => Math.max(change, LEAST_CHANGE));
  const scale = TRAVEL_TOTAL / steps.reduce((sum, step) => sum + step, 0);
  return steps.reduce<number[]>((sums, step) => [...sums, sums[sums.length - 1] + step * scale], [0]);
})();

/** How far the light has travelled, to the eye, at a (fractional) frame. */
export function travelAtFrame(frame: number): number {
  const at = clamp(frame, 0, LAST_FRAME);
  const lower = Math.min(LAST_FRAME - 1, Math.floor(at));
  return TRAVEL_AT[lower] + (TRAVEL_AT[lower + 1] - TRAVEL_AT[lower]) * (at - lower);
}

/** The (fractional) frame at which the light has travelled this far. The inverse of `travelAtFrame`. */
export function frameAtTravel(travel: number): number {
  const at = clamp(travel, 0, TRAVEL_TOTAL);
  const found = TRAVEL_AT.findIndex((sum) => sum >= at);
  // Rounding can leave the last sum a hair short of the total: that is still the last frame.
  const upper = found === -1 ? LAST_FRAME : Math.max(1, found);
  const span = TRAVEL_AT[upper] - TRAVEL_AT[upper - 1];
  return upper - 1 + (span > 0 ? (at - TRAVEL_AT[upper - 1]) / span : 0);
}

/** One step of easing a frame towards another, taken along the even measure so it never lurches across a jump. */
export function approachFrame(current: number, target: number, rate: number, seconds: number): number {
  return frameAtTravel(approach(travelAtFrame(current), travelAtFrame(target), rate, seconds));
}

/** The light takes a little longer over the lit face than round the back: this much slower in front, faster behind. */
const ORBIT_LINGER = 0.3;

/**
 * How fast the circling light travels (units of travel a second) at this
 * frame. The pace is even to the eye, eased a little so it dwells on the lit
 * face; one whole turn takes about `secondsPerTurn`.
 */
export function orbitSpeed(frame: number, secondsPerTurn: number): number {
  const front = Math.cos((frameToAngle(frame) * Math.PI) / 180);
  return (TRAVEL_TOTAL / secondsPerTurn) * (1 - ORBIT_LINGER * front);
}

/** Ease from 0 to 1 with no sudden start or stop. */
export const smoothstep = (t: number): number => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

/** Scrolling slower than this (pixels a second) leaves the light where it is. */
const SWING_FROM_SPEED = 30;
/** Degrees of light for each pixel a second of scrolling, and the furthest a scroll can throw it. */
const SWING_PER_SPEED = 0.085;
export const SWING_MAX_DEG = 150;

/**
 * Where scrolling throws the light, in degrees from the front, for a scroll
 * speed in pixels a second (positive is down the page). Scrolling down swings
 * it to the right and scrolling up to the left, further the faster the page
 * moves; a fast scroll takes it almost behind the sitter. At rest it is 0:
 * the plain portrait, lit from the front.
 */
export function scrollSwing(speed: number): number {
  const size = Math.abs(speed);
  if (size <= SWING_FROM_SPEED) return 0;
  return Math.sign(speed) * Math.min(SWING_MAX_DEG, (size - SWING_FROM_SPEED) * SWING_PER_SPEED);
}

/** How far the resting light drifts either side of where it is held, in degrees: a slow swing with a quicker, smaller one on top. */
const SWAY_SLOW = { degrees: 7, seconds: 7.5 } as const;
const SWAY_QUICK = { degrees: 2, seconds: 3.1 } as const;
/** The furthest the resting light ever gets from where it is held. */
export const SWAY_MAX_DEG = SWAY_SLOW.degrees + SWAY_QUICK.degrees;

/**
 * The resting light is never quite still: it drifts a little to the left and
 * a little to the right, so the portrait looks alive. This is that drift in
 * degrees, `seconds` after the light came to rest. It starts at nothing and
 * heads left first, which is the way the opening pass is already travelling.
 */
export function swayAngle(seconds: number): number {
  const turn = 2 * Math.PI * seconds;
  return -(SWAY_SLOW.degrees * Math.sin(turn / SWAY_SLOW.seconds) + SWAY_QUICK.degrees * Math.sin(turn / SWAY_QUICK.seconds));
}

export interface FrameBlend {
  lower: number;
  upper: number;
  /** How much of `upper` to lay over `lower`, 0..1. */
  mix: number;
}

/**
 * Which two loaded frames to blend for a position between frames. Blending
 * two lightings is physically the same as lighting from both at part power,
 * so a gap in what has loaded still looks right. Null when nothing has loaded.
 */
export function blendFor(position: number, isLoaded: (index: number) => boolean): FrameBlend | null {
  const at = clamp(position, 0, LAST_FRAME);
  let lower = Math.floor(at);
  while (lower >= 0 && !isLoaded(lower)) lower -= 1;
  let upper = Math.ceil(at);
  while (upper <= LAST_FRAME && !isLoaded(upper)) upper += 1;
  const hasLower = lower >= 0;
  const hasUpper = upper <= LAST_FRAME;
  if (!hasLower && !hasUpper) return null;
  if (!hasLower) return { lower: upper, upper, mix: 0 };
  if (!hasUpper || upper === lower) return { lower, upper: lower, mix: 0 };
  return { lower, upper, mix: (at - lower) / (upper - lower) };
}

export interface FrameShare {
  frame: number;
  /** This frame's share of the picture, 0..1. The shares of one picture add up to 1. */
  share: number;
}

/** How far either side of the light's place (in units of travel) the picture is averaged over. */
const SOFTEN_REACH = 1.1;
/** Where the samples are taken across that reach, and how much each counts: most in the middle. */
const SOFTEN_TAPS: readonly { offset: number; weight: number }[] = [
  { offset: -1, weight: 1 },
  { offset: -0.5, weight: 2 },
  { offset: 0, weight: 3 },
  { offset: 0.5, weight: 2 },
  { offset: 1, weight: 1 },
];
const SOFTEN_WEIGHT = SOFTEN_TAPS.reduce((sum, tap) => sum + tap.weight, 0);

/**
 * The frames to draw for a position, and how much of each. A plain cross-fade
 * between two neighbours changes direction abruptly at every frame the
 * photographs turn a corner at (the light "ticks"). Averaging the picture over
 * a short stretch either side rounds those corners, the way a real lamp never
 * moves in straight segments. Empty when nothing has loaded.
 */
export function softBlend(position: number, isLoaded: (index: number) => boolean): FrameShare[] {
  const centre = travelAtFrame(position);
  const shares = new Map<number, number>();
  const add = (frame: number, share: number): void => {
    if (share > 0) shares.set(frame, (shares.get(frame) ?? 0) + share);
  };
  SOFTEN_TAPS.forEach((tap) => {
    const blend = blendFor(frameAtTravel(centre + tap.offset * SOFTEN_REACH), isLoaded);
    if (!blend) return;
    const weight = tap.weight / SOFTEN_WEIGHT;
    add(blend.lower, weight * (1 - blend.mix));
    add(blend.upper, weight * blend.mix);
  });
  return [...shares.entries()].map(([frame, share]) => ({ frame, share })).sort((a, b) => a.frame - b.frame);
}

/** "−048°": the angle as the readout prints it, always three digits, with a true minus sign. */
export function formatAngle(angle: number): string {
  const rounded = Math.round(angle);
  const sign = rounded < 0 ? "−" : rounded > 0 ? "+" : "";
  return `${sign}${String(Math.abs(rounded)).padStart(3, "0")}°`;
}

/**
 * Where one way of describing the light gives way to the next, in degrees from
 * the front. Set by looking at the frames: up to about 115 degrees half the
 * face is still lit, which reads as light from the side, not from behind.
 */
const FRONT_WITHIN = 15;
const FRONT_SIDE_WITHIN = 70;
const SIDE_WITHIN = 115;
const BEHIND_SIDE_WITHIN = 165;

/** Where the light is, in two or three words. Left and right are the viewer's. */
export function lightWords(angle: number): string {
  const size = Math.abs(angle);
  const side = angle < 0 ? "left" : "right";
  if (size <= FRONT_WITHIN) return "Front";
  if (size <= FRONT_SIDE_WITHIN) return `Front ${side}`;
  if (size <= SIDE_WITHIN) return `${side === "left" ? "Left" : "Right"} side`;
  if (size <= BEHIND_SIDE_WITHIN) return `Behind ${side}`;
  return "Behind";
}

/** The same, as a sentence for a screen reader. */
export function lightDescription(angle: number): string {
  const size = Math.abs(angle);
  const side = angle < 0 ? "left" : "right";
  const degrees = `${Math.round(size)} degrees`;
  if (size <= FRONT_WITHIN) return `Light in front, ${degrees}`;
  if (size <= FRONT_SIDE_WITHIN) return `Light in front, to the ${side}, ${degrees}`;
  if (size <= SIDE_WITHIN) return `Light to the ${side}, ${degrees}`;
  if (size <= BEHIND_SIDE_WITHIN) return `Light behind, to the ${side}, ${degrees}`;
  return `Light behind, ${degrees}`;
}

/** The light moved by a key press, kept inside the full turn. */
export const stepAngle = (angle: number, delta: number): number => clamp(angle + delta, -180, 180);

export interface LampPosition {
  /** −1 at the viewer's far left, +1 at the far right. */
  x: number;
  /** +1 nearest the viewer, −1 directly behind the sitter. */
  depth: number;
  isBehind: boolean;
}

/** Where the lamp sits on its circle round the sitter, seen from above. */
export function lampPosition(angle: number): LampPosition {
  const radians = (angle * Math.PI) / 180;
  const depth = Math.cos(radians);
  return { x: Math.sin(radians), depth, isBehind: depth < 0 };
}

/** Which of these scroll positions the page is nearest, or -1 when there are none. */
export function nearestStop(stops: readonly number[], scroll: number): number {
  return stops.reduce((best, stop, i) => (best === -1 || Math.abs(stop - scroll) < Math.abs(stops[best] - scroll) ? i : best), -1);
}
