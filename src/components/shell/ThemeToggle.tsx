"use client";

import { useSyncExternalStore, type MouseEvent } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import { THEME_STORAGE_KEY, overrideFor, type Theme } from "@/lib/theme-clock";
import { rememberPick } from "./ThemeClock";

export { THEME_STORAGE_KEY, type Theme };

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

/** The current theme, kept in sync with the `data-theme` attribute on <html>. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "dark");
}

/** Shows the theme picked, and keeps it only until the next 7 o'clock (a pick matching the clock needs no keeping). */
function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  const pick = overrideFor(theme, new Date());
  rememberPick(pick);
  try {
    if (pick) window.localStorage.setItem(THEME_STORAGE_KEY, pick);
    else window.localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Private mode or blocked storage: the switch still works for this visit.
  }
}

const OPTIONS: readonly { value: Theme; label: string; short: string }[] = [
  { value: "dark", label: "Dark", short: "DK" },
  { value: "light", label: "Light", short: "LT" },
];

/** Dark | light switch. The new theme opens as a circle from where you clicked. The site otherwise follows the clock (ThemeClock). */
export function ThemeToggle() {
  const theme = useTheme();

  const choose = (next: Theme, event: MouseEvent<HTMLButtonElement>): void => {
    if (next === theme) return;
    const root = document.documentElement;
    root.style.setProperty("--vt-x", `${event.clientX}px`);
    root.style.setProperty("--vt-y", `${event.clientY}px`);

    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
      applyTheme(next);
      return;
    }
    document.startViewTransition(() => applyTheme(next));
  };

  return (
    <div role="group" aria-label="Colour theme" className="flex items-center border border-line font-mono text-[11px] tracking-[0.1em] uppercase">
      {OPTIONS.map((option) => {
        const isActive = option.value === theme;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            aria-label={`${option.label} theme`}
            onClick={(event) => choose(option.value, event)}
            className={`cursor-pointer px-2 py-1.5 transition-colors ${isActive ? "bg-paper text-ink" : "text-paper/50 hover:text-paper"}`}
          >
            <span aria-hidden="true">{option.short}</span>
          </button>
        );
      })}
    </div>
  );
}
