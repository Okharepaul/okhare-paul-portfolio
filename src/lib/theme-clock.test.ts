import { describe, expect, test } from "vitest";
import {
  THEME_BOOT_SCRIPT,
  THEME_STORAGE_KEY,
  clockTheme,
  nextSwitch,
  overrideFor,
  readOverride,
  resolveTheme,
  themeForHour,
} from "./theme-clock";

/** A local-time moment on 21 Nov 2026. */
const at = (hour: number, minute = 0): Date => new Date(2026, 10, 21, hour, minute);

describe("themeForHour", () => {
  test("is light from 07:00 up to 18:59 and dark from 19:00 to 06:59", () => {
    expect(themeForHour(6)).toBe("dark");
    expect(themeForHour(7)).toBe("light");
    expect(themeForHour(12)).toBe("light");
    expect(themeForHour(18)).toBe("light");
    expect(themeForHour(19)).toBe("dark");
    expect(themeForHour(23)).toBe("dark");
    expect(themeForHour(0)).toBe("dark");
  });

  test("reads the visitor's local hour", () => {
    expect(clockTheme(at(6, 59))).toBe("dark");
    expect(clockTheme(at(7, 0))).toBe("light");
    expect(clockTheme(at(18, 59))).toBe("light");
    expect(clockTheme(at(19, 0))).toBe("dark");
  });
});

describe("nextSwitch", () => {
  test("before dawn it is 07:00 the same day", () => {
    expect(nextSwitch(at(3, 30))).toEqual(at(7));
  });

  test("in the day it is 19:00 the same day", () => {
    expect(nextSwitch(at(7))).toEqual(at(19));
    expect(nextSwitch(at(18, 59))).toEqual(at(19));
  });

  test("in the evening it is 07:00 the next day, across the month's end too", () => {
    expect(nextSwitch(at(19))).toEqual(new Date(2026, 10, 22, 7));
    expect(nextSwitch(new Date(2026, 10, 30, 22))).toEqual(new Date(2026, 11, 1, 7));
  });
});

describe("a theme picked by hand", () => {
  test("is stored until the next switch when it differs from the clock", () => {
    const raw = overrideFor("dark", at(10));
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw ?? "")).toEqual({ theme: "dark", until: at(19).getTime() });
  });

  test("stores nothing when it is the clock's own theme", () => {
    expect(overrideFor("light", at(10))).toBeNull();
  });

  test("holds until the switch, then the clock takes over", () => {
    const raw = overrideFor("dark", at(10));
    expect(resolveTheme(raw, at(18, 59))).toBe("dark");
    expect(resolveTheme(raw, at(19))).toBe("dark");
    expect(resolveTheme(raw, at(19, 1))).toBe("dark");
    const morning = overrideFor("light", at(20));
    expect(resolveTheme(morning, at(23))).toBe("light");
    expect(resolveTheme(morning, new Date(2026, 10, 22, 7, 0, 1))).toBe("light");
    expect(resolveTheme(morning, new Date(2026, 10, 22, 6, 59))).toBe("light");
  });

  test("expires exactly at the switch", () => {
    const raw = overrideFor("dark", at(10));
    expect(readOverride(raw, at(19))).toBeNull();
  });

  test("ignores old plain values, broken JSON and anything malformed", () => {
    expect(readOverride("dark", at(10))).toBeNull();
    expect(readOverride("{oops", at(10))).toBeNull();
    expect(readOverride(JSON.stringify({ theme: "blue", until: at(19).getTime() }), at(10))).toBeNull();
    expect(readOverride(JSON.stringify({ theme: "dark", until: "later" }), at(10))).toBeNull();
    expect(readOverride(null, at(10))).toBeNull();
    expect(resolveTheme("dark", at(10))).toBe("light");
  });
});

describe("THEME_BOOT_SCRIPT", () => {
  /** Runs the head script against a stand-in page and returns the theme it set. */
  function boot(stored: string | null, now: Date): string | undefined {
    const dataset: Record<string, string> = {};
    const document = { documentElement: { dataset } };
    const localStorage = { getItem: (key: string) => (key === THEME_STORAGE_KEY ? stored : null) };
    class FixedDate extends Date {
      constructor() {
        super(now.getTime());
      }
    }
    new Function("document", "localStorage", "Date", THEME_BOOT_SCRIPT)(document, localStorage, FixedDate);
    return dataset.theme;
  }

  test("makes the same call as resolveTheme", () => {
    const picks = [null, "dark", overrideFor("dark", at(10)), overrideFor("light", at(20)), "{oops"];
    const moments = [at(3), at(6, 59), at(7), at(12), at(18, 59), at(19), at(19, 1), at(23)];
    for (const raw of picks) {
      for (const now of moments) {
        expect(boot(raw, now)).toBe(resolveTheme(raw, now));
      }
    }
  });
});
