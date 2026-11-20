import { describe, expect, test } from "vitest";
import { ENTRANCE_DEPTH_PX, entrancePose, entranceStagger } from "./entrance";

const VIEWPORT = 1440;

describe("entrancePose", () => {
  test("lays a wide element back on its bottom edge", () => {
    const pose = entrancePose(600, 24, 400, VIEWPORT);
    expect(pose.rotationX).toBeGreaterThan(0);
    expect(pose.rotationY).toBe(0);
    expect(pose.transformOrigin).toBe("50% 100%");
  });

  test("swings a tall element away on its left edge when it sits in the left half", () => {
    const pose = entrancePose(300, 400, 300, VIEWPORT);
    expect(pose.rotationX).toBe(0);
    expect(pose.rotationY).toBeGreaterThan(0);
    expect(pose.transformOrigin).toBe("0% 50%");
  });

  test("mirrors that on the right half: hinged on the right edge, swung the other way", () => {
    const left = entrancePose(300, 400, 300, VIEWPORT);
    const right = entrancePose(300, 400, 1100, VIEWPORT);
    expect(right.rotationY).toBe(-left.rotationY);
    expect(right.transformOrigin).toBe("100% 50%");
  });

  test("treats a box only a little wider than tall as a door, not a line", () => {
    expect(entrancePose(320, 200, 300, VIEWPORT).rotationY).not.toBe(0);
    expect(entrancePose(480, 200, 300, VIEWPORT).rotationX).not.toBe(0);
  });

  test("never tilts past edge-on, so the element is always on its way into view", () => {
    [entrancePose(600, 24, 400, VIEWPORT), entrancePose(300, 400, 300, VIEWPORT), entrancePose(300, 400, 1100, VIEWPORT)].forEach((pose) => {
      expect(Math.abs(pose.rotationX)).toBeLessThan(90);
      expect(Math.abs(pose.rotationY)).toBeLessThan(90);
    });
  });

  test("starts behind the page, not in front of it", () => {
    expect(ENTRANCE_DEPTH_PX).toBeLessThan(0);
  });
});

describe("entranceStagger", () => {
  test("needs no gap for a lone element", () => {
    expect(entranceStagger(0)).toBe(0);
    expect(entranceStagger(1)).toBe(0);
  });

  test("uses the usual gap for a handful", () => {
    expect(entranceStagger(4)).toBeCloseTo(0.07);
  });

  test("shortens the gap for a crowd so the last one still starts within about a second", () => {
    const count = 60;
    const gap = entranceStagger(count);
    expect(gap).toBeLessThan(0.07);
    expect(gap * (count - 1)).toBeLessThanOrEqual(1.1 + 1e-9);
  });
});
