import type { Vec2 } from "./spectral";

const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Length of the open path start → order[0] → order[1] → … */
export function routeLength(points: readonly Vec2[], order: readonly number[], start: Vec2): number {
  let total = 0;
  let previous = start;
  for (const index of order) {
    total += distance(previous, points[index]);
    previous = points[index];
  }
  return total;
}

/** Greedy baseline: always fly to the closest stop that is still waiting. */
export function nearestNeighbourRoute(
  points: readonly Vec2[],
  candidates: readonly number[],
  start: Vec2,
): number[] {
  const remaining = new Set(candidates);
  const order: number[] = [];
  let current = start;

  while (remaining.size > 0) {
    let best = -1;
    let bestDistance = Infinity;
    for (const index of remaining) {
      const d = distance(current, points[index]);
      if (d < bestDistance) {
        bestDistance = d;
        best = index;
      }
    }
    remaining.delete(best);
    order.push(best);
    current = points[best];
  }

  return order;
}

const TWO_OPT_MAX_PASSES = 8;

/** 2-opt on an open path: reverse any segment that uncrosses the route. */
export function twoOpt(points: readonly Vec2[], order: readonly number[], start: Vec2): number[] {
  let best = [...order];
  if (best.length < 3) return best;

  const at = (route: readonly number[], i: number): Vec2 => (i < 0 ? start : points[route[i]]);

  for (let pass = 0; pass < TWO_OPT_MAX_PASSES; pass += 1) {
    let improved = false;
    for (let i = 0; i < best.length - 1; i += 1) {
      for (let j = i + 1; j < best.length; j += 1) {
        const before = distance(at(best, i - 1), at(best, i)) + (j + 1 < best.length ? distance(at(best, j), at(best, j + 1)) : 0);
        const after = distance(at(best, i - 1), at(best, j)) + (j + 1 < best.length ? distance(at(best, i), at(best, j + 1)) : 0);
        if (after + 1e-9 < before) {
          best = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
          improved = true;
        }
      }
    }
    if (!improved) break;
  }

  return best;
}

/** Nearest-neighbour seed, then 2-opt. */
export function planRoute(points: readonly Vec2[], candidates: readonly number[], start: Vec2): number[] {
  return twoOpt(points, nearestNeighbourRoute(points, candidates, start), start);
}
