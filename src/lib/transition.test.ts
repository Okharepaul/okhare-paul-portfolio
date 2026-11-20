import { describe, expect, test } from "vitest";
import { leavePlans, onPageLeave, stackDelay, stackLines, type LeavePlan } from "./transition";

describe("stackLines", () => {
  test("keeps a one-word title on one line", () => {
    expect(stackLines("Obsiryn")).toEqual(["Obsiryn"]);
  });

  test("gives the last word of a longer title a line to itself", () => {
    expect(stackLines("Swarm Routing")).toEqual(["Swarm", "Routing"]);
    expect(stackLines("Mary & Paul")).toEqual(["Mary &", "Paul"]);
  });

  test("ignores stray spaces and returns nothing for an empty title", () => {
    expect(stackLines("  Pod   Website ")).toEqual(["Pod", "Website"]);
    expect(stackLines("   ")).toEqual([]);
  });
});

describe("stackDelay", () => {
  test("starts the bottom title first and the top title last, inside the same window", () => {
    expect(stackDelay(11, 12)).toBeCloseTo(0.2);
    expect(stackDelay(0, 12)).toBeCloseTo(0.9);
  });

  test("steps a tenth of a second per title for a list of eight", () => {
    expect(stackDelay(7, 8)).toBeCloseTo(0.2);
    expect(stackDelay(6, 8)).toBeCloseTo(0.3);
    expect(stackDelay(0, 8)).toBeCloseTo(0.9);
  });

  test("never leaves the window, whatever it is asked", () => {
    [-3, 0, 5, 40].forEach((index) => {
      expect(stackDelay(index, 12)).toBeGreaterThanOrEqual(0.2);
      expect(stackDelay(index, 12)).toBeLessThanOrEqual(0.9);
    });
    expect(stackDelay(0, 1)).toBeCloseTo(0.2);
    expect(stackDelay(0, 0)).toBeCloseTo(0.2);
  });
});

describe("onPageLeave", () => {
  // Only passed through to the handlers, never read here.
  const anchor = {} as HTMLAnchorElement;

  test("collects a plan from every section that has one, and none once it is removed", () => {
    const plan: LeavePlan = { done: Promise.resolve(), isTakeover: true };
    const stopFirst = onPageLeave(() => plan);
    const stopSecond = onPageLeave(() => null);

    expect(leavePlans(anchor)).toEqual([plan]);

    stopFirst();
    stopSecond();
    expect(leavePlans(anchor)).toEqual([]);
  });

  test("hands each section the link that was clicked", () => {
    const seen: HTMLAnchorElement[] = [];
    const stop = onPageLeave((clicked) => {
      seen.push(clicked);
      return null;
    });

    leavePlans(anchor);
    stop();
    expect(seen).toEqual([anchor]);
  });
});
