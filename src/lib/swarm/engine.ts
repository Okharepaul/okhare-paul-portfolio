import { planRoute } from "./routing";
import { mulberry32, spectralCluster, type Rng, type Vec2 } from "./spectral";

/**
 * The swarm simulation behind SwarmField and the sandbox.
 *
 * This is a real-time loop, so the simulation state is deliberately mutable
 * and kept private to the object returned by `createSwarm`. The clustering
 * and routing it calls are pure functions.
 */

export const POINT_PENDING = 0;
export const POINT_DELIVERED = 1;
export const POINT_BLOCKED = 2;
export type PointState = typeof POINT_PENDING | typeof POINT_DELIVERED | typeof POINT_BLOCKED;

export interface SwarmPoint extends Vec2 {
  /** Position inside the region, 0..1 on both axes. Survives resizes. */
  u: number;
  v: number;
  zone: number;
  state: PointState;
  blockedAt: number;
}

export interface Drone extends Vec2 {
  zone: number;
  route: number[];
  /** Seconds left hovering at the current stop. */
  hover: number;
  trail: Vec2[];
}

export interface Region {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface SwarmConfig {
  points: number;
  zones: number;
  seed: number;
  width: number;
  height: number;
  /** Where delivery points may land, as fractions of the canvas. */
  region?: Region;
  /** Flight speed in px per second. */
  speed?: number;
}

export interface SwarmStats {
  delivered: number;
  blocked: number;
  reroutes: number;
  runs: number;
}

export interface Swarm {
  readonly points: readonly SwarmPoint[];
  readonly drones: readonly Drone[];
  readonly stats: Readonly<SwarmStats>;
  readonly zones: number;
  step(dt: number): void;
  resize(width: number, height: number): void;
  /** Block the nearest waiting point within `radius` px. Returns its index, or -1. */
  blockAt(x: number, y: number, radius: number): number;
}

const FULL_REGION: Region = { x0: 0.04, y0: 0.06, x1: 0.96, y1: 0.94 };
const DEFAULT_SPEED = 62;
const HOVER_SECONDS = 0.32;
const BLOCK_SECONDS = 6;
const RESET_SECONDS = 1.4;
const TRAIL_STEP = 5;
const TRAIL_LENGTH = 54;
const MAX_STEP = 0.05;
const MIN_GAP = 0.055;
const MAX_PLACEMENT_TRIES = 40;

function gaussian(rng: Rng): number {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

const clamp01 = (value: number): number => Math.min(0.98, Math.max(0.02, value));

/** Delivery points bunch around a few neighbourhoods, like a real city. */
function scatterPoints(count: number, zones: number, rng: Rng): { u: number; v: number }[] {
  const centres = Array.from({ length: zones + 2 }, () => ({ u: 0.12 + rng() * 0.76, v: 0.14 + rng() * 0.72 }));
  const placed: { u: number; v: number }[] = [];

  while (placed.length < count) {
    let candidate = { u: rng(), v: rng() };
    for (let attempt = 0; attempt < MAX_PLACEMENT_TRIES; attempt += 1) {
      const centre = centres[Math.floor(rng() * centres.length)];
      const next =
        rng() < 0.82
          ? { u: clamp01(centre.u + gaussian(rng) * 0.11), v: clamp01(centre.v + gaussian(rng) * 0.13) }
          : { u: clamp01(rng()), v: clamp01(rng()) };
      candidate = next;
      if (placed.every((p) => Math.hypot(p.u - next.u, p.v - next.v) > MIN_GAP)) break;
    }
    placed.push(candidate);
  }

  return placed;
}

export function createSwarm(config: SwarmConfig): Swarm {
  const region = config.region ?? FULL_REGION;
  const speed = config.speed ?? DEFAULT_SPEED;
  const rng = mulberry32(config.seed);
  const zones = Math.max(1, Math.min(config.zones, config.points));

  let width = config.width;
  let height = config.height;
  let clock = 0;
  const stats: SwarmStats = { delivered: 0, blocked: 0, reroutes: 0, runs: 0 };
  const resetTimers = new Array<number>(zones).fill(0);

  const toX = (u: number): number => (region.x0 + u * (region.x1 - region.x0)) * width;
  const toY = (v: number): number => (region.y0 + v * (region.y1 - region.y0)) * height;

  const points: SwarmPoint[] = scatterPoints(config.points, zones, rng).map(({ u, v }) => ({
    u,
    v,
    x: toX(u),
    y: toY(v),
    zone: 0,
    state: POINT_PENDING,
    blockedAt: 0,
  }));

  const labels = spectralCluster(points, zones, rng);
  points.forEach((point, i) => {
    point.zone = labels[i];
  });

  const pendingIn = (zone: number): number[] =>
    points.flatMap((point, i) => (point.zone === zone && point.state === POINT_PENDING ? [i] : []));

  const drones: Drone[] = Array.from({ length: zones }, (_, zone) => {
    const members = points.filter((point) => point.zone === zone);
    const home = members[0] ?? { x: width / 2, y: height / 2 };
    return { zone, x: home.x, y: home.y, route: [], hover: zone * 0.35, trail: [] };
  });

  const replan = (drone: Drone): void => {
    drone.route = planRoute(points, pendingIn(drone.zone), drone);
  };
  drones.forEach(replan);

  const extendTrail = (drone: Drone): void => {
    const last = drone.trail[drone.trail.length - 1];
    if (last && Math.hypot(last.x - drone.x, last.y - drone.y) < TRAIL_STEP) return;
    drone.trail.push({ x: drone.x, y: drone.y });
    if (drone.trail.length > TRAIL_LENGTH) drone.trail.shift();
  };

  const releaseExpiredBlocks = (): void => {
    points.forEach((point) => {
      if (point.state !== POINT_BLOCKED || clock - point.blockedAt < BLOCK_SECONDS) return;
      point.state = POINT_PENDING;
      stats.blocked -= 1;
      replan(drones[point.zone]);
    });
  };

  const startNextRun = (drone: Drone, dt: number): void => {
    const zonePoints = points.filter((point) => point.zone === drone.zone);
    if (zonePoints.length === 0) return;
    if (zonePoints.some((point) => point.state === POINT_BLOCKED)) return;
    resetTimers[drone.zone] += dt;
    if (resetTimers[drone.zone] < RESET_SECONDS) return;
    resetTimers[drone.zone] = 0;
    zonePoints.forEach((point) => {
      point.state = POINT_PENDING;
    });
    stats.runs += 1;
    replan(drone);
  };

  const advance = (drone: Drone, dt: number): void => {
    if (drone.hover > 0) {
      drone.hover -= dt;
      return;
    }
    if (drone.route.length === 0) {
      startNextRun(drone, dt);
      return;
    }

    const target = points[drone.route[0]];
    const dx = target.x - drone.x;
    const dy = target.y - drone.y;
    const gap = Math.hypot(dx, dy);
    const travel = speed * dt;

    if (gap <= travel) {
      drone.x = target.x;
      drone.y = target.y;
      drone.route = drone.route.slice(1);
      drone.hover = HOVER_SECONDS;
      if (target.state === POINT_PENDING) {
        target.state = POINT_DELIVERED;
        stats.delivered += 1;
      }
    } else {
      drone.x += (dx / gap) * travel;
      drone.y += (dy / gap) * travel;
    }
    extendTrail(drone);
  };

  return {
    points,
    drones,
    stats,
    zones,

    step(dt: number): void {
      const delta = Math.min(Math.max(dt, 0), MAX_STEP);
      clock += delta;
      releaseExpiredBlocks();
      drones.forEach((drone) => advance(drone, delta));
    },

    resize(nextWidth: number, nextHeight: number): void {
      if (nextWidth <= 0 || nextHeight <= 0) return;
      const scaleX = nextWidth / width;
      const scaleY = nextHeight / height;
      width = nextWidth;
      height = nextHeight;
      points.forEach((point) => {
        point.x = toX(point.u);
        point.y = toY(point.v);
      });
      drones.forEach((drone) => {
        drone.x *= scaleX;
        drone.y *= scaleY;
        drone.trail = [];
      });
    },

    blockAt(x: number, y: number, radius: number): number {
      let best = -1;
      let bestDistance = radius;
      points.forEach((point, i) => {
        if (point.state !== POINT_PENDING) return;
        const d = Math.hypot(point.x - x, point.y - y);
        if (d < bestDistance) {
          bestDistance = d;
          best = i;
        }
      });
      if (best === -1) return -1;

      const point = points[best];
      point.state = POINT_BLOCKED;
      point.blockedAt = clock;
      stats.blocked += 1;
      stats.reroutes += 1;
      replan(drones[point.zone]);
      return best;
    },
  };
}
