import { describe, expect, test } from "vitest";
import {
  FALL_RATE,
  FOLLOW_RATE,
  FRAME_COUNT,
  FRONT_FRAME,
  LAST_FRAME,
  angleToFrame,
  approach,
  approachFrame,
  blendFor,
  formatAngle,
  frameSrc,
  frameAtTravel,
  frameToAngle,
  lampPosition,
  lightDescription,
  lightWords,
  nearestStop,
  orbitSpeed,
  scrollSwing,
  smoothstep,
  softBlend,
  travelAtFrame,
  TRAVEL_TOTAL,
  SWING_MAX_DEG,
  pointerAngle,
  stepAngle,
  swayAngle,
  SWAY_MAX_DEG,
} from "./portrait";

const everyFrame = (): boolean => true;

describe("frames and angles", () => {
  test("the first and last frames have the light behind, the middle one in front", () => {
    expect(frameToAngle(0)).toBe(-180);
    expect(frameToAngle(FRONT_FRAME)).toBe(0);
    expect(frameToAngle(LAST_FRAME)).toBe(180);
    expect(FRAME_COUNT).toBe(61);
  });

  test("an angle and its frame convert back and forth", () => {
    [-180, -108, -6, 0, 48, 180].forEach((angle) => expect(frameToAngle(angleToFrame(angle))).toBeCloseTo(angle, 10));
  });

  test("an angle outside the turn is held at its ends", () => {
    expect(angleToFrame(-400)).toBe(0);
    expect(angleToFrame(400)).toBe(LAST_FRAME);
  });

  test("names the picture files with two digits", () => {
    expect(frameSrc(0)).toBe("/portrait/f00.webp");
    expect(frameSrc(7)).toBe("/portrait/f07.webp");
    expect(frameSrc(60)).toBe("/portrait/f60.webp");
  });
});

describe("steering with the pointer", () => {
  test("the edges put the light behind and the centre brings it to the front", () => {
    expect(pointerAngle(0)).toBe(-150);
    expect(pointerAngle(0.5)).toBe(0);
    expect(pointerAngle(1)).toBe(150);
  });

  test("a pointer outside the portrait counts as its nearest edge", () => {
    expect(pointerAngle(-0.4)).toBe(-150);
    expect(pointerAngle(1.7)).toBe(150);
  });

  test("the light closes most of the gap to a hand in half a second, and never overshoots", () => {
    const after = approach(0, 60, FOLLOW_RATE, 0.5);
    expect(after).toBeGreaterThan(50);
    expect(after).toBeLessThan(60);
  });

  test("it follows a hand faster than it returns to rest", () => {
    expect(approach(0, 60, FOLLOW_RATE, 0.2)).toBeGreaterThan(approach(0, 60, FALL_RATE, 0.2));
  });

  test("the same time passes the same way in one step or many", () => {
    const once = approach(10, 40, FOLLOW_RATE, 0.1);
    const twice = approach(approach(10, 40, FOLLOW_RATE, 0.05), 40, FOLLOW_RATE, 0.05);
    expect(twice).toBeCloseTo(once, 10);
  });

  test("a key press cannot push the light past directly behind", () => {
    expect(stepAngle(174, 30)).toBe(180);
    expect(stepAngle(-174, -30)).toBe(-180);
    expect(stepAngle(0, -6)).toBe(-6);
  });
});

describe("travelling evenly to the eye", () => {
  test("the measure runs from nothing to the whole turn and never goes backwards", () => {
    expect(travelAtFrame(0)).toBe(0);
    expect(travelAtFrame(LAST_FRAME)).toBeCloseTo(TRAVEL_TOTAL, 10);
    const sums = Array.from({ length: 601 }, (_, i) => travelAtFrame(i / 10));
    sums.slice(1).forEach((sum, i) => expect(sum).toBeGreaterThan(sums[i]));
  });

  test("frames that look alike are close together; a jump between frames is far", () => {
    const alike = travelAtFrame(6) - travelAtFrame(5);
    const jump = travelAtFrame(9) - travelAtFrame(8);
    expect(jump).toBeGreaterThan(5 * alike);
  });

  test("going there and back lands on the same frame", () => {
    [0, 3.5, 8.2, 8.9, 17, 30, 44.44, 55.5, 60].forEach((frame) => expect(frameAtTravel(travelAtFrame(frame))).toBeCloseTo(frame, 8));
    expect(frameAtTravel(-4)).toBe(0);
    expect(frameAtTravel(TRAVEL_TOTAL + 9)).toBeCloseTo(LAST_FRAME, 10);
  });

  test("moving at an even pace, the picture changes by about the same amount every moment", () => {
    // What changes on screen in one small step of travel, taken from the measured change between frames.
    const step = 0.05;
    const frames = Array.from({ length: Math.floor(TRAVEL_TOTAL / step) }, (_, i) => frameAtTravel(i * step));
    const moved = frames.slice(1).map((frame, i) => travelAtFrame(frame) - travelAtFrame(frames[i]));
    moved.forEach((amount) => expect(amount).toBeCloseTo(step, 6));
  });

  test("easing towards a frame crosses a jump slowly instead of leaping it", () => {
    const even = approachFrame(8, 9, 5, 0.05);
    const leap = approach(8, 9, 5, 0.05);
    expect(even).toBeGreaterThan(8);
    expect(even).toBeLessThan(9);
    expect(approachFrame(4, 4, 5, 0.05)).toBeCloseTo(4, 8);
    expect(Number.isFinite(leap)).toBe(true);
  });
});

describe("the light circling the sitter", () => {
  test("dwells a little on the lit face and is quicker round the back", () => {
    expect(orbitSpeed(FRONT_FRAME, 10)).toBeLessThan(orbitSpeed(0, 10));
    expect(orbitSpeed(15, 10)).toBeCloseTo(orbitSpeed(45, 10), 10);
    expect(orbitSpeed(0, 10) / orbitSpeed(FRONT_FRAME, 10)).toBeLessThan(2);
  });

  test("one turn takes about the time asked for", () => {
    const seconds = 10;
    const step = 1 / 240;
    let travel = 0;
    let elapsed = 0;
    while (travel < TRAVEL_TOTAL) {
      travel += orbitSpeed(frameAtTravel(travel), seconds) * step;
      elapsed += step;
    }
    expect(elapsed).toBeGreaterThan(seconds * 0.8);
    expect(elapsed).toBeLessThan(seconds * 1.2);
  });

  test("starts and stops without a jolt", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBe(0.5);
    expect(smoothstep(0.02)).toBeLessThan(0.002);
    expect(smoothstep(7)).toBe(1);
  });
});

describe("rounding the corners between frames", () => {
  const total = (shares: { share: number }[]): number => shares.reduce((sum, item) => sum + item.share, 0);

  test("the shares of one picture add up to the whole", () => {
    [0, 0.4, 8.5, 15, 29.9, 30, 44.2, 59.7, 60].forEach((position) => expect(total(softBlend(position, everyFrame))).toBeCloseTo(1, 8));
  });

  test("takes in the neighbours either side, most from the nearest", () => {
    const shares = softBlend(30, everyFrame);
    const at = (frame: number): number => shares.find((item) => item.frame === frame)?.share ?? 0;
    expect(at(30)).toBeGreaterThan(at(29));
    expect(at(29)).toBeGreaterThan(0);
    expect(at(31)).toBeGreaterThan(0);
    expect(shares.length).toBeLessThanOrEqual(8);
  });

  test("a small move changes the picture by a small amount, even across the biggest jump", () => {
    const share = (position: number, frame: number): number => softBlend(position, everyFrame).find((item) => item.frame === frame)?.share ?? 0;
    for (let position = 7.5; position < 9.5; position += 0.01) {
      [7, 8, 9, 10].forEach((frame) => expect(Math.abs(share(position + 0.01, frame) - share(position, frame))).toBeLessThan(0.05));
    }
  });

  test("works with only some frames loaded, and with none", () => {
    expect(total(softBlend(13, (index) => index % 3 === 0))).toBeCloseTo(1, 8);
    expect(softBlend(13, () => false)).toEqual([]);
  });
});

describe("the light at rest", () => {
  test("starts from where it is held and heads left first", () => {
    expect(swayAngle(0)).toBeCloseTo(0, 10);
    expect(swayAngle(0.4)).toBeLessThan(0);
  });

  test("goes a little to the left and a little to the right, and never far", () => {
    const drift = Array.from({ length: 1200 }, (_, i) => swayAngle(i / 10));
    expect(Math.min(...drift)).toBeLessThan(-5);
    expect(Math.max(...drift)).toBeGreaterThan(5);
    drift.forEach((angle) => expect(Math.abs(angle)).toBeLessThanOrEqual(SWAY_MAX_DEG));
    expect(SWAY_MAX_DEG).toBeLessThan(12);
  });

  test("is slow: under five degrees in any half second", () => {
    const drift = Array.from({ length: 600 }, (_, i) => swayAngle(i / 2));
    drift.slice(1).forEach((angle, i) => expect(Math.abs(angle - drift[i])).toBeLessThan(5));
  });
});

describe("which frames to draw", () => {
  test("on a frame, that frame alone", () => {
    expect(blendFor(12, everyFrame)).toEqual({ lower: 12, upper: 12, mix: 0 });
  });

  test("between two frames, a blend in proportion", () => {
    expect(blendFor(12.25, everyFrame)).toEqual({ lower: 12, upper: 13, mix: 0.25 });
  });

  test("bridges a gap in what has loaded", () => {
    const everyThird = (index: number): boolean => index % 3 === 0;
    expect(blendFor(13, everyThird)).toEqual({ lower: 12, upper: 15, mix: 1 / 3 });
  });

  test("with only the first frame loaded, shows that", () => {
    expect(blendFor(40, (index) => index === 0)).toEqual({ lower: 0, upper: 0, mix: 0 });
  });

  test("with only a later frame loaded, shows that", () => {
    expect(blendFor(4, (index) => index === 30)).toEqual({ lower: 30, upper: 30, mix: 0 });
  });

  test("nothing loaded, nothing to draw", () => {
    expect(blendFor(10, () => false)).toBeNull();
  });
});

describe("the readout", () => {
  test("prints three digits and a true minus sign", () => {
    expect(formatAngle(-48)).toBe("−048°");
    expect(formatAngle(0)).toBe("000°");
    expect(formatAngle(132.4)).toBe("+132°");
    expect(formatAngle(-0.2)).toBe("000°");
  });

  test("says where the light is, from the viewer's side", () => {
    expect(lightWords(0)).toBe("Front");
    expect(lightWords(-48)).toBe("Front left");
    expect(lightWords(90)).toBe("Right side");
    expect(lightWords(-130)).toBe("Behind left");
    expect(lightWords(180)).toBe("Behind");
  });

  test("reads as a sentence for a screen reader", () => {
    expect(lightDescription(0)).toBe("Light in front, 0 degrees");
    expect(lightDescription(-48)).toBe("Light in front, to the left, 48 degrees");
    expect(lightDescription(96)).toBe("Light to the right, 96 degrees");
    expect(lightDescription(-150)).toBe("Light behind, to the left, 150 degrees");
    expect(lightDescription(180)).toBe("Light behind, 180 degrees");
  });
});

describe("the lamp on its circle", () => {
  test("is nearest the viewer in front and hidden behind the sitter at the back", () => {
    expect(lampPosition(0)).toMatchObject({ depth: 1, isBehind: false });
    expect(lampPosition(0).x).toBeCloseTo(0, 10);
    expect(lampPosition(180).isBehind).toBe(true);
    expect(lampPosition(-90).x).toBeCloseTo(-1, 10);
    expect(lampPosition(90).x).toBeCloseTo(1, 10);
  });
});

describe("the light thrown by scrolling", () => {
  test("a page at rest, or barely moving, leaves the portrait lit from the front", () => {
    expect(scrollSwing(0)).toBe(0);
    expect(scrollSwing(20)).toBe(0);
    expect(scrollSwing(-20)).toBe(0);
  });

  test("scrolling down throws it right, scrolling up throws it left", () => {
    expect(scrollSwing(800)).toBeGreaterThan(0);
    expect(scrollSwing(-800)).toBe(-scrollSwing(800));
  });

  test("the faster the scroll, the further round, up to nearly behind", () => {
    expect(scrollSwing(1500)).toBeGreaterThan(scrollSwing(600));
    expect(scrollSwing(600)).toBeGreaterThan(40);
    expect(scrollSwing(50000)).toBe(SWING_MAX_DEG);
    expect(scrollSwing(-50000)).toBe(-SWING_MAX_DEG);
  });
});

describe("the chapter being read", () => {
  const stops = [1000, 2000, 3000];

  test("is the one the page is nearest", () => {
    expect(nearestStop(stops, 0)).toBe(0);
    expect(nearestStop(stops, 1600)).toBe(1);
    expect(nearestStop(stops, 2900)).toBe(2);
  });

  test("is none when there are no chapters", () => {
    expect(nearestStop([], 500)).toBe(-1);
  });
});
