import { describe, expect, test } from "vitest";
import { MAX_STRETCH, STRETCH_FROM_SPEED, formatProgress, scrollForOffset, scrollGeometry, stretchFor } from "./scrollbar";

const base = { trackHeight: 800, viewportHeight: 900, pageHeight: 9000, scroll: 0, minThumb: 44 };

describe("where the thumb sits", () => {
  test("its length is the share of the page on screen", () => {
    expect(scrollGeometry(base).thumb).toBeCloseTo(80);
  });

  test("it is never shorter than the least it may be, however long the page", () => {
    expect(scrollGeometry({ ...base, pageHeight: 90_000 }).thumb).toBe(44);
  });

  test("it runs from the top of the track to the bottom as the page scrolls", () => {
    expect(scrollGeometry(base).offset).toBe(0);
    const end = scrollGeometry({ ...base, scroll: 8100 });
    expect(end.progress).toBe(1);
    expect(end.offset + end.thumb).toBeCloseTo(800);
  });

  test("scrolling past either end (a bounce) holds it at that end", () => {
    expect(scrollGeometry({ ...base, scroll: -50 }).progress).toBe(0);
    expect(scrollGeometry({ ...base, scroll: 99_999 }).progress).toBe(1);
  });

  test("a page that fits on screen has nothing to scroll", () => {
    const fits = scrollGeometry({ ...base, pageHeight: 900 });
    expect(fits.isScrollable).toBe(false);
    expect(fits.offset).toBe(0);
  });

  test("a track with no height does not divide by zero", () => {
    const none = scrollGeometry({ ...base, trackHeight: 0 });
    expect(none.isScrollable).toBe(false);
    expect(Number.isFinite(none.thumb)).toBe(true);
  });
});

describe("dragging the thumb", () => {
  test("a point on the track is the inverse of where the thumb is drawn", () => {
    const halfway = scrollGeometry({ ...base, scroll: 4050 });
    expect(scrollForOffset(halfway.offset, halfway, base.trackHeight)).toBeCloseTo(4050);
  });

  test("dragging beyond the track stops at the ends of the page", () => {
    const geometry = scrollGeometry(base);
    expect(scrollForOffset(-100, geometry, base.trackHeight)).toBe(0);
    expect(scrollForOffset(5000, geometry, base.trackHeight)).toBe(geometry.maxScroll);
  });
});

describe("the stretch of a fast scroll", () => {
  test("reading pace leaves the thumb alone, in either direction", () => {
    expect(stretchFor(0)).toBe(0);
    expect(stretchFor(STRETCH_FROM_SPEED)).toBe(0);
    expect(stretchFor(-STRETCH_FROM_SPEED)).toBe(0);
  });

  test("it grows with speed, the same up as down, and never past its limit", () => {
    expect(stretchFor(2000)).toBeGreaterThan(stretchFor(1000));
    expect(stretchFor(-2000)).toBe(stretchFor(2000));
    expect(stretchFor(1e9)).toBe(MAX_STRETCH);
    expect(stretchFor(Number.NaN)).toBe(0);
  });
});

describe("the readout", () => {
  test("is three digits from 000 to 100", () => {
    expect(formatProgress(0)).toBe("000");
    expect(formatProgress(0.07)).toBe("007");
    expect(formatProgress(0.425)).toBe("043");
    expect(formatProgress(1)).toBe("100");
    expect(formatProgress(3)).toBe("100");
    expect(formatProgress(Number.NaN)).toBe("000");
  });
});
