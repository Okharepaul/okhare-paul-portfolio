import { describe, expect, test } from "vitest";
import { bayer8, blobDensity, cellReveal, clamp01, halftoneShare, halftoneTones, hash2, luminance, valueNoise } from "./dots";

describe("bayer8", () => {
  test("uses each of the 64 thresholds exactly once per 8×8 tile", () => {
    const thresholds = new Set<number>();
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) thresholds.add(bayer8(x, y));
    }
    expect(thresholds.size).toBe(64);
    expect(Math.min(...thresholds)).toBeCloseTo(0.5 / 64);
    expect(Math.max(...thresholds)).toBeCloseTo(63.5 / 64);
  });

  test("repeats every eight cells", () => {
    expect(bayer8(3, 5)).toBe(bayer8(11, 13));
  });
});

describe("hash2 and valueNoise", () => {
  test("give the same answer for the same cell and stay inside 0..1", () => {
    expect(hash2(4, 9, 2)).toBe(hash2(4, 9, 2));
    for (let i = 0; i < 200; i += 1) {
      const noise = valueNoise(i * 0.37, i * 0.11, 3);
      expect(noise).toBeGreaterThanOrEqual(0);
      expect(noise).toBeLessThan(1);
    }
  });

  test("change with the seed", () => {
    expect(hash2(4, 9, 1)).not.toBe(hash2(4, 9, 2));
  });

  test("meet the lattice values at whole coordinates", () => {
    expect(valueNoise(6, 2, 4)).toBeCloseTo(hash2(6, 2, 4));
  });
});

describe("blobDensity", () => {
  const blob = { x: 0.5, y: 0.5, radius: 0.2 };

  test("peaks at the centre of a cluster and fades with distance", () => {
    const centre = blobDensity([blob], 500, 500, 1000, 1000);
    const near = blobDensity([blob], 600, 500, 1000, 1000);
    const far = blobDensity([blob], 1000, 1000, 1000, 1000);
    expect(centre).toBe(1);
    expect(near).toBeLessThan(centre);
    expect(far).toBeLessThan(0.01);
  });

  test("is zero with no clusters and never exceeds one where clusters overlap", () => {
    expect(blobDensity([], 10, 10, 100, 100)).toBe(0);
    expect(blobDensity([blob, blob, blob], 500, 500, 1000, 1000)).toBe(1);
  });

  test("scales a cluster by its strength", () => {
    expect(blobDensity([{ ...blob, strength: 0.4 }], 500, 500, 1000, 1000)).toBeCloseTo(0.4);
  });
});

describe("cellReveal", () => {
  test("shows nothing at the start and everything at the end, whatever the order", () => {
    [0, 0.3, 1].forEach((order) => {
      expect(cellReveal(0, order)).toBe(0);
      expect(cellReveal(1, order)).toBe(1);
    });
  });

  test("starts later cells later", () => {
    expect(cellReveal(0.3, 0)).toBeGreaterThan(cellReveal(0.3, 0.5));
    expect(cellReveal(0.3, 1)).toBe(0);
  });
});

describe("clamp01", () => {
  test("keeps a value inside 0..1", () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(7)).toBe(1);
  });
});

describe("luminance", () => {
  test("runs from 0 for black to 1 for white, with green weighing most", () => {
    expect(luminance(0, 0, 0)).toBe(0);
    expect(luminance(255, 255, 255)).toBeCloseTo(1);
    expect(luminance(0, 255, 0)).toBeGreaterThan(luminance(255, 0, 0));
    expect(luminance(255, 0, 0)).toBeGreaterThan(luminance(0, 0, 255));
  });
});

describe("halftoneShare", () => {
  test("draws nothing for an empty tone and never fills the whole cell", () => {
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        expect(halftoneShare(0, x, y)).toBe(0);
        expect(halftoneShare(1, x, y)).toBeLessThan(1);
      }
    }
  });

  test("gives every cell a dot once the tone is strong, and a bigger one as it strengthens", () => {
    expect(halftoneShare(0.5, 3, 5)).toBeGreaterThan(0);
    expect(halftoneShare(0.9, 3, 5)).toBeGreaterThan(halftoneShare(0.5, 3, 5));
    expect(halftoneShare(4, 3, 5)).toBe(halftoneShare(1, 3, 5));
  });

  test("thins a faint tone into a scatter: some cells of a tile get a dot, most do not", () => {
    let dots = 0;
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) if (halftoneShare(0.05, x, y) > 0) dots += 1;
    }
    expect(dots).toBeGreaterThan(0);
    expect(dots).toBeLessThan(32);
  });
});

describe("halftoneTones", () => {
  test("returns nothing for no cells and a blank for a picture of one flat tone", () => {
    expect(halftoneTones([])).toEqual([]);
    expect(halftoneTones([0.5, 0.5, 0.5])).toEqual([0, 0, 0]);
  });

  test("draws a dark picture by its highlights", () => {
    const tones = halftoneTones([0.02, 0.05, 0.03, 0.04, 0.9]);
    expect(tones[4]).toBe(1);
    expect(tones[0]).toBe(0);
  });

  test("draws a pale picture by its dark marks, so most of it stays open ground", () => {
    const tones = halftoneTones([0.95, 0.96, 0.94, 0.97, 0.1]);
    expect(tones[4]).toBe(1);
    expect(tones.filter((tone) => tone < 0.2)).toHaveLength(4);
  });

  test("keeps every tone inside 0..1 and leaves the input alone", () => {
    const brightness = [0.1, 0.4, 0.2, 0.8, 0.3, 0.05];
    const before = [...brightness];
    halftoneTones(brightness).forEach((tone) => {
      expect(tone).toBeGreaterThanOrEqual(0);
      expect(tone).toBeLessThanOrEqual(1);
    });
    expect(brightness).toEqual(before);
  });
});
