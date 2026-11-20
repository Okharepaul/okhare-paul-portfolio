import { hash2 } from "@/lib/dots";
import type { LatLon } from "@/lib/geo";
import { LAND_COLS, LAND_MASK_BASE64, LAND_ROWS } from "./land-mask";

/**
 * A dot globe: land comes from a small bitmask, each dot is projected
 * orthographically, and a great-circle arc links two places.
 */

const RAD = Math.PI / 180;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

let landBits: Uint8Array | null = null;

function land(): Uint8Array {
  if (!landBits) landBits = Uint8Array.from(atob(LAND_MASK_BASE64), (character) => character.charCodeAt(0));
  return landBits;
}

export function isLand(lat: number, lon: number): boolean {
  const row = Math.min(LAND_ROWS - 1, Math.max(0, Math.floor(((90 - lat) / 180) * LAND_ROWS)));
  const column = ((Math.floor(((lon + 180) / 360) * LAND_COLS) % LAND_COLS) + LAND_COLS) % LAND_COLS;
  const index = row * LAND_COLS + column;
  return (land()[index >> 3] & (1 << (index & 7))) !== 0;
}

const toVector = ({ lat, lon }: LatLon): Vec3 => ({
  x: Math.cos(lat * RAD) * Math.sin(lon * RAD),
  y: Math.sin(lat * RAD),
  z: Math.cos(lat * RAD) * Math.cos(lon * RAD),
});

const toLatLon = ({ x, y, z }: Vec3): LatLon => ({ lat: Math.asin(y) / RAD, lon: Math.atan2(x, z) / RAD });

/** Point at fraction `t` along the great circle from a to b. */
export function alongGreatCircle(a: LatLon, b: LatLon, t: number): LatLon {
  const va = toVector(a);
  const vb = toVector(b);
  const angle = Math.acos(Math.min(1, Math.max(-1, va.x * vb.x + va.y * vb.y + va.z * vb.z)));
  if (angle < 1e-6) return a;
  const wa = Math.sin((1 - t) * angle) / Math.sin(angle);
  const wb = Math.sin(t * angle) / Math.sin(angle);
  return toLatLon({ x: wa * va.x + wb * vb.x, y: wa * va.y + wb * vb.y, z: wa * va.z + wb * vb.z });
}

export interface GlobeStop extends LatLon {
  label: string;
}

/**
 * A patch of land drawn in the accent colour: everything within `radius`
 * degrees of a place, thinning out to nothing over a soft edge beyond it.
 */
export interface GlobeHighlight extends LatLon {
  radius: number;
}

export interface GlobeOptions {
  /** Canvas size in device pixels (the globe is drawn square). */
  size: number;
  from: GlobeStop;
  to: GlobeStop;
  /** 0..1 along the route. */
  progress: number;
  color: string;
  accent: string;
  /** Hide the route and labels (used for the decorative globe). */
  isBare?: boolean;
  /** Extra turn around the axis, in degrees, on top of following the traveller. */
  spin?: number;
  /** Extra tilt towards the viewer, in degrees. */
  tilt?: number;
  /** Patches of land drawn in the accent colour. */
  highlights?: readonly GlobeHighlight[];
}

const DOT_STEP_DEG = 2.6;
const ARC_POINTS = 90;
/** The view never tips further than this, so the poles cannot flip over. */
const MAX_TILT_DEG = 80;
/** Share of the remaining land dots scattered in the accent colour. */
const ACCENT_SPECKS = 0.06;
/** How far past its radius a highlight keeps thinning out, as a share of the radius. */
const HIGHLIGHT_FRINGE = 0.7;

/** Largest extra tilt (either way) that keeps the view inside `MAX_TILT_DEG`. */
export const GLOBE_TILT_RANGE_DEG = 60;

const NO_HIGHLIGHTS: readonly GlobeHighlight[] = [];

/** One dot of the globe's lattice. Everything here depends on the place only, never on the view. */
interface GlobeDot {
  sinLat: number;
  cosLat: number;
  lonRad: number;
  isOnLand: boolean;
  /** Repeatable 0..1 number that decides the accent scatter and the dithered edge of a highlight. */
  chance: number;
  vector: Vec3;
}

let lattice: GlobeDot[] | null = null;

/** The lattice is the same every frame, so it is built once: only the turning is per-frame work. */
function globeDots(): GlobeDot[] {
  if (lattice) return lattice;
  const dots: GlobeDot[] = [];
  for (let lat = -88; lat <= 88; lat += DOT_STEP_DEG) {
    const lonStep = DOT_STEP_DEG / Math.max(0.12, Math.cos(lat * RAD));
    for (let lon = -180; lon < 180; lon += lonStep) {
      dots.push({
        sinLat: Math.sin(lat * RAD),
        cosLat: Math.cos(lat * RAD),
        lonRad: lon * RAD,
        isOnLand: isLand(lat, lon),
        chance: hash2(Math.round(lat * 10), Math.round(lon * 10), 9),
        vector: toVector({ lat, lon }),
      });
    }
  }
  lattice = dots;
  return dots;
}

const accentCache = new WeakMap<readonly GlobeHighlight[], Uint8Array>();

/**
 * Which dots take the accent colour: land inside a highlight, a dithered
 * fringe around it, and a thin scatter elsewhere. Worked out once per set of
 * highlights (pass the same array each frame).
 */
function accentFlags(highlights: readonly GlobeHighlight[]): Uint8Array {
  const cached = accentCache.get(highlights);
  if (cached) return cached;
  const patches = highlights.map((highlight) => ({ centre: toVector(highlight), radius: highlight.radius * RAD }));
  const flags = Uint8Array.from(globeDots(), ({ isOnLand, chance, vector }) => {
    if (!isOnLand) return 0;
    if (chance < ACCENT_SPECKS) return 1;
    const isInPatch = patches.some(({ centre, radius }) => {
      const distance = Math.acos(Math.min(1, vector.x * centre.x + vector.y * centre.y + vector.z * centre.z));
      // Solid inside the radius; beyond it, fewer and fewer dots, so the edge is dithered rather than cut.
      return distance <= radius || chance < 1 - (distance - radius) / (radius * HIGHLIGHT_FRINGE);
    });
    return isInPatch ? 1 : 0;
  });
  accentCache.set(highlights, flags);
  return flags;
}

export function drawGlobe(ctx: CanvasRenderingContext2D, options: GlobeOptions): void {
  const { size, from, to, progress, color, accent, isBare = false, spin: extraSpin = 0, tilt: extraTilt = 0, highlights = NO_HIGHLIGHTS } = options;
  const centre = size / 2;
  const radius = size * 0.43;
  const unit = size / 640;

  // The view follows the traveller, so the current position stays near the middle.
  const focus = alongGreatCircle(from, to, progress);
  const spin = (focus.lon + extraSpin) * RAD;
  const tilt = Math.min(MAX_TILT_DEG, Math.max(-MAX_TILT_DEG, focus.lat * 0.72 + extraTilt)) * RAD;
  const sinTilt = Math.sin(tilt);
  const cosTilt = Math.cos(tilt);

  const project = (place: LatLon): { x: number; y: number; depth: number } => {
    const lat = place.lat * RAD;
    const lon = place.lon * RAD - spin;
    const x = Math.cos(lat) * Math.sin(lon);
    const y0 = Math.sin(lat);
    const z0 = Math.cos(lat) * Math.cos(lon);
    const y = y0 * cosTilt - z0 * sinTilt;
    const depth = y0 * sinTilt + z0 * cosTilt;
    return { x: centre + radius * x, y: centre - radius * y, depth };
  };

  ctx.clearRect(0, 0, size, size);

  // Halo
  const halo = ctx.createRadialGradient(centre, centre, radius * 0.7, centre, centre, radius * 1.16);
  halo.addColorStop(0, "transparent");
  halo.addColorStop(0.78, color);
  halo.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);

  // Dots: square for land, a faint speck for sea. Land inside a highlight, and
  // a scatter of other land dots, take the accent colour.
  // Turned and tilted inline (no objects made per dot): this loop runs every frame.
  const dots = globeDots();
  const flags = accentFlags(highlights);
  for (let i = 0; i < dots.length; i += 1) {
    const dot = dots[i];
    const turned = dot.lonRad - spin;
    const z0 = dot.cosLat * Math.cos(turned);
    const depth = dot.sinLat * sinTilt + z0 * cosTilt;
    if (depth <= 0.02) continue;
    const x = centre + radius * dot.cosLat * Math.sin(turned);
    const y = centre - radius * (dot.sinLat * cosTilt - z0 * sinTilt);
    const side = (dot.isOnLand ? 3.1 : 1.1) * unit * (0.55 + 0.45 * depth);
    ctx.fillStyle = flags[i] === 1 ? accent : color;
    ctx.globalAlpha = (dot.isOnLand ? 0.95 : 0.3) * (0.3 + 0.7 * depth);
    ctx.fillRect(x - side / 2, y - side / 2, side, side);
  }
  ctx.globalAlpha = 1;
  if (isBare) return;

  // Route: dashed ahead, solid accent behind the traveller.
  for (let i = 0; i <= ARC_POINTS; i += 1) {
    const t = i / ARC_POINTS;
    const point = project(alongGreatCircle(from, to, t));
    if (point.depth <= 0) continue;
    const isFlown = t <= progress;
    if (!isFlown && i % 2 === 1) continue;
    ctx.fillStyle = isFlown ? accent : color;
    ctx.globalAlpha = isFlown ? 1 : 0.55;
    const dot = (isFlown ? 2.6 : 1.6) * unit;
    ctx.fillRect(point.x - dot / 2, point.y - dot / 2, dot, dot);
  }
  ctx.globalAlpha = 1;

  // Stops
  ctx.font = `${Math.round(11 * unit)}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  ctx.textBaseline = "middle";
  [from, to].forEach((stop, i) => {
    const point = project(stop);
    if (point.depth <= 0) return;
    const isReached = i === 0 || progress >= 0.98;
    const box = 9 * unit;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, unit);
    ctx.strokeRect(point.x - box, point.y - box, box * 2, box * 2);
    ctx.fillStyle = isReached ? color : "transparent";
    ctx.fillRect(point.x - 3 * unit, point.y - 3 * unit, 6 * unit, 6 * unit);
    const isOnRight = point.x > centre;
    ctx.textAlign = isOnRight ? "right" : "left";
    ctx.fillStyle = color;
    ctx.fillText(stop.label, point.x + (isOnRight ? -1 : 1) * 16 * unit, point.y + (i === 0 ? 0 : -1) * 2 * unit);
  });
  ctx.textAlign = "left";

  // The traveller
  if (progress > 0.01 && progress < 0.99) {
    const point = project(focus);
    ctx.fillStyle = accent;
    ctx.fillRect(point.x - 4 * unit, point.y - 4 * unit, 8 * unit, 8 * unit);
  }
}
