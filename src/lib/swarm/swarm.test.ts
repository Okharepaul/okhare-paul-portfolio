import { describe, expect, test } from "vitest";
import { createSwarm, POINT_BLOCKED, POINT_DELIVERED, POINT_PENDING } from "./engine";
import { nearestNeighbourRoute, planRoute, routeLength, twoOpt } from "./routing";
import { jacobiEigen, kmeans, mulberry32, spectralCluster, type Vec2 } from "./spectral";

const blob = (cx: number, cy: number, count: number, seed: number): Vec2[] => {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, () => ({ x: cx + (rng() - 0.5) * 20, y: cy + (rng() - 0.5) * 20 }));
};

describe("mulberry32", () => {
  test("returns the same sequence for the same seed", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  test("stays inside [0, 1)", () => {
    const rng = mulberry32(99);
    const values = Array.from({ length: 500 }, rng);
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

describe("jacobiEigen", () => {
  test("finds the eigenvalues of a symmetric matrix", () => {
    const { values } = jacobiEigen([
      [2, 1],
      [1, 2],
    ]);
    expect([...values].sort((x, y) => x - y)).toEqual([expect.closeTo(1, 8), expect.closeTo(3, 8)]);
  });

  test("returns eigenvectors that satisfy A·v = λ·v", () => {
    const matrix = [
      [4, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ];
    const { values, vectors } = jacobiEigen(matrix);
    values.forEach((lambda, i) => {
      const v = vectors[i];
      matrix.forEach((row, r) => {
        const product = row.reduce((sum, value, c) => sum + value * v[c], 0);
        expect(product).toBeCloseTo(lambda * v[r], 8);
      });
    });
  });
});

describe("kmeans", () => {
  test("separates two obvious groups", () => {
    const rows = [[0], [0.1], [0.2], [10], [10.1], [10.2]];
    const labels = kmeans(rows, 2, mulberry32(1));
    expect(new Set(labels.slice(0, 3)).size).toBe(1);
    expect(new Set(labels.slice(3)).size).toBe(1);
    expect(labels[0]).not.toBe(labels[3]);
  });

  test("returns an empty array when there are no rows", () => {
    expect(kmeans([], 3, mulberry32(1))).toEqual([]);
  });
});

describe("spectralCluster", () => {
  test("puts three distant blobs in three different zones", () => {
    const points = [...blob(0, 0, 12, 1), ...blob(300, 0, 12, 2), ...blob(150, 300, 12, 3)];
    const labels = spectralCluster(points, 3, mulberry32(5));

    const groups = [labels.slice(0, 12), labels.slice(12, 24), labels.slice(24)];
    groups.forEach((group) => expect(new Set(group).size).toBe(1));
    expect(new Set(groups.map((group) => group[0])).size).toBe(3);
  });

  test("labels every point 0 when asked for a single zone", () => {
    expect(spectralCluster(blob(0, 0, 5, 1), 1, mulberry32(1))).toEqual([0, 0, 0, 0, 0]);
  });

  test("gives each point its own zone when there are no more points than zones", () => {
    expect(spectralCluster(blob(0, 0, 3, 1), 5, mulberry32(1))).toEqual([0, 1, 2]);
  });

  test("returns an empty array for no points", () => {
    expect(spectralCluster([], 3, mulberry32(1))).toEqual([]);
  });
});

describe("routing", () => {
  const line: Vec2[] = [
    { x: 30, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
  ];
  const origin = { x: 0, y: 0 };

  test("nearest neighbour visits the closest waiting stop first", () => {
    expect(nearestNeighbourRoute(line, [0, 1, 2], origin)).toEqual([1, 2, 0]);
  });

  test("nearest neighbour only visits the candidates it is given", () => {
    expect(nearestNeighbourRoute(line, [0, 2], origin)).toEqual([2, 0]);
  });

  test("routeLength measures the open path from the start", () => {
    expect(routeLength(line, [1, 2, 0], origin)).toBe(30);
  });

  test("2-opt uncrosses a crossed route", () => {
    const square: Vec2[] = [
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
    ];
    const crossed = [1, 0, 2];
    const improved = twoOpt(square, crossed, origin);
    expect(routeLength(square, improved, origin)).toBeLessThan(routeLength(square, crossed, origin));
  });

  test("planRoute is never longer than the greedy baseline", () => {
    const rng = mulberry32(11);
    const points = Array.from({ length: 14 }, () => ({ x: rng() * 100, y: rng() * 100 }));
    const all = points.map((_, i) => i);
    const greedy = nearestNeighbourRoute(points, all, origin);
    const planned = planRoute(points, all, origin);
    expect([...planned].sort((a, b) => a - b)).toEqual(all);
    expect(routeLength(points, planned, origin)).toBeLessThanOrEqual(routeLength(points, greedy, origin) + 1e-9);
  });
});

describe("createSwarm", () => {
  const make = () => createSwarm({ points: 24, zones: 3, seed: 2026, width: 800, height: 500 });

  test("creates one drone per zone and assigns every point a zone", () => {
    const swarm = make();
    expect(swarm.drones).toHaveLength(3);
    expect(swarm.points).toHaveLength(24);
    expect(swarm.points.every((point) => point.zone >= 0 && point.zone < 3)).toBe(true);
  });

  test("is deterministic for a given seed", () => {
    const a = make();
    const b = make();
    expect(a.points.map((p) => [p.x, p.y, p.zone])).toEqual(b.points.map((p) => [p.x, p.y, p.zone]));
  });

  test("delivers points as time passes", () => {
    const swarm = make();
    for (let i = 0; i < 400; i += 1) swarm.step(0.05);
    expect(swarm.stats.delivered).toBeGreaterThan(0);
  });

  test("blocking a point removes it from the drone's route and counts a re-route", () => {
    const swarm = make();
    const target = swarm.points.findIndex((point) => point.state === POINT_PENDING);
    const { x, y, zone } = swarm.points[target];

    const blocked = swarm.blockAt(x, y, 10);

    expect(blocked).toBe(target);
    expect(swarm.points[target].state).toBe(POINT_BLOCKED);
    expect(swarm.drones[zone].route).not.toContain(target);
    expect(swarm.stats.reroutes).toBe(1);
  });

  test("returns -1 when nothing waiting is within reach", () => {
    expect(make().blockAt(-5000, -5000, 10)).toBe(-1);
  });

  test("releases a blocked point after the block expires", () => {
    const swarm = make();
    const target = swarm.points.findIndex((point) => point.state === POINT_PENDING);
    swarm.blockAt(swarm.points[target].x, swarm.points[target].y, 10);
    for (let i = 0; i < 140; i += 1) swarm.step(0.05);
    expect(swarm.points[target].state).not.toBe(POINT_BLOCKED);
    expect([POINT_PENDING, POINT_DELIVERED]).toContain(swarm.points[target].state);
  });

  test("keeps points inside the canvas after a resize", () => {
    const swarm = make();
    swarm.resize(400, 300);
    expect(swarm.points.every((p) => p.x >= 0 && p.x <= 400 && p.y >= 0 && p.y <= 300)).toBe(true);
  });
});
