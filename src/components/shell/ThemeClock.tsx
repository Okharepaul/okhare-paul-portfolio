"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { THEME_STORAGE_KEY, nextSwitch, resolveTheme, type Theme } from "@/lib/theme-clock";

/** A beat past the hour, so the check lands after the switch and never just before it. */
const SWITCH_MARGIN_MS = 1000;

/** The visitor's last pick this visit, for when the browser will not keep it (private mode, blocked storage). */
let pickThisVisit: string | null = null;

/** Called by the switch with what it stored (or null when the pick matched the clock). */
export function rememberPick(pick: string | null): void {
  pickThisVisit = pick;
}

function storedPick(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) ?? pickThisVisit;
  } catch {
    return pickThisVisit;
  }
}

/** The new theme opens as a circle from the middle of the screen, as the switch's does from the switch. */
function show(theme: Theme): void {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  const apply = (): void => {
    root.dataset.theme = theme;
  };
  if (document.hidden || typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
    apply();
    return;
  }
  root.style.setProperty("--vt-x", "50%");
  root.style.setProperty("--vt-y", "50%");
  document.startViewTransition(apply);
}

/**
 * Keeps the theme in step with the visitor's clock while the page stays open:
 * at 07:00 it turns light, at 19:00 dark. The script in <head> makes the same
 * call on arrival. Coming back to the tab checks again, since a sleeping
 * laptop can carry a page past the hour without its timer firing.
 */
export function ThemeClock() {
  useEffect(() => {
    let timer = 0;
    const check = (): void => {
      window.clearTimeout(timer);
      const now = new Date();
      show(resolveTheme(storedPick(), now));
      timer = window.setTimeout(check, nextSwitch(now).getTime() - now.getTime() + SWITCH_MARGIN_MS);
    };
    const handleVisible = (): void => {
      if (!document.hidden) check();
    };
    check();
    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  return null;
}
