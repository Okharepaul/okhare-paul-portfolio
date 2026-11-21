/**
 * The site follows the visitor's own clock: light from 7 in the morning,
 * dark from 7 in the evening, in whatever time zone they are in. Picking a
 * theme with the switch holds it only until the next 7 o'clock, when the
 * clock takes over again.
 */

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "op:theme";
/** Light from this hour (07:00)... */
export const DAY_START_HOUR = 7;
/** ...dark from this one (19:00). */
export const NIGHT_START_HOUR = 19;

/** A theme picked by hand, and the moment (ms since 1970) it hands back to the clock. */
export interface ThemeOverride {
  readonly theme: Theme;
  readonly until: number;
}

const isTheme = (value: unknown): value is Theme => value === "dark" || value === "light";

/** The clock's theme for an hour of the day (0 to 23). */
export function themeForHour(hour: number): Theme {
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "light" : "dark";
}

/** The clock's theme at a moment, read in the visitor's local time. */
export function clockTheme(now: Date): Theme {
  return themeForHour(now.getHours());
}

/** The next 07:00 or 19:00 after a moment, local time. */
export function nextSwitch(now: Date): Date {
  const hour = now.getHours();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), DAY_START_HOUR);
  if (hour < DAY_START_HOUR) return next;
  if (hour < NIGHT_START_HOUR) return new Date(now.getFullYear(), now.getMonth(), now.getDate(), NIGHT_START_HOUR);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, DAY_START_HOUR);
}

/** A stored pick, if it is well formed and still in force. Anything else (old plain values included) is ignored. */
export function readOverride(raw: string | null, now: Date): ThemeOverride | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { theme, until } = parsed as Record<string, unknown>;
    if (!isTheme(theme) || typeof until !== "number" || until <= now.getTime()) return null;
    return { theme, until };
  } catch {
    return null;
  }
}

/** What to store when the visitor picks a theme: nothing if it is the clock's own, else the pick until the next switch. */
export function overrideFor(theme: Theme, now: Date): string | null {
  if (theme === clockTheme(now)) return null;
  const pick: ThemeOverride = { theme, until: nextSwitch(now).getTime() };
  return JSON.stringify(pick);
}

/** The theme to show: a pick still in force, else the clock's. */
export function resolveTheme(raw: string | null, now: Date): Theme {
  return readOverride(raw, now)?.theme ?? clockTheme(now);
}

/**
 * The same decision as resolveTheme, as a few lines of plain script for the
 * page <head>, so the right theme is on before anything is painted. Built only
 * from the constants above: no visitor input reaches it.
 */
export const THEME_BOOT_SCRIPT =
  `var d=document.documentElement,n=new Date(),h=n.getHours(),t=h>=${DAY_START_HOUR}&&h<${NIGHT_START_HOUR}?"light":"dark";` +
  `try{var o=JSON.parse(localStorage.getItem("${THEME_STORAGE_KEY}"));` +
  `if(o&&(o.theme==="light"||o.theme==="dark")&&typeof o.until==="number"&&o.until>n.getTime())t=o.theme}catch(e){}` +
  `d.dataset.theme=t;`;
