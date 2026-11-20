"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { site } from "@/content/site";
import { prefersReducedMotion } from "@/lib/motion";
import { markSiteReady } from "@/lib/ready";
import { getLenis } from "@/lib/scroll";

export const LOADED_STORAGE_KEY = "op:loaded";

/** What the counter is waiting on, shown as a small boot log. */
const STEPS = ["boot renderer", "load typefaces", "compile shader", "sync scroll", "ready"] as const;

const HOLD_AT = 86;
const MIN_SHOW_MS = 900;
const pad3 = (value: number): string => String(value).padStart(3, "0");

function alreadyLoadedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(LOADED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberLoaded(): void {
  try {
    window.sessionStorage.setItem(LOADED_STORAGE_KEY, "1");
  } catch {
    // Storage blocked: the loader simply plays again next time.
  }
}

/**
 * The opening screen: a boot log, a counter that runs 000 to 86 and waits
 * there for the fonts, then finishes at 100. Its contents fly up, and the
 * panel wipes away upwards to hand over to the hero. Once per visit.
 */
export function Loader() {
  const panelRef = useRef<HTMLDivElement>(null);
  const digitsRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const log = logRef.current;
    if (!panel || !log) return;

    if (alreadyLoadedThisSession() || prefersReducedMotion()) {
      panel.style.display = "none";
      markSiteReady();
      return;
    }

    const lines = Array.from(log.children) as HTMLElement[];
    const showStep = (index: number): void => {
      lines.forEach((line, i) => {
        line.hidden = i > index;
        const status = line.lastElementChild as HTMLElement | null;
        if (!status) return;
        const isCurrent = i === index && index < STEPS.length - 1;
        status.textContent = isCurrent ? "_" : "ok";
        status.className = isCurrent ? "animate-blink" : "text-paper";
      });
    };

    const paint = (value: number): void => {
      if (digitsRef.current) digitsRef.current.textContent = pad3(value);
      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`;
    };

    document.documentElement.style.overflow = "hidden";
    getLenis()?.stop();

    const counter = { value: 0 };
    let isCancelled = false;
    showStep(0);

    const opening = gsap.to(counter, {
      value: HOLD_AT,
      duration: 0.9,
      ease: "power2.inOut",
      onUpdate: () => {
        const value = Math.round(counter.value);
        paint(value);
        showStep(Math.min(STEPS.length - 2, Math.floor((value / HOLD_AT) * (STEPS.length - 1))));
      },
    });

    let closing: gsap.core.Timeline | null = null;
    const fontsReady = document.fonts.ready.catch(() => undefined);
    const minimumShown = new Promise((resolve) => window.setTimeout(resolve, MIN_SHOW_MS));

    Promise.all([fontsReady, minimumShown]).then(() => {
      if (isCancelled) return;
      closing = gsap
        .timeline({
          onComplete: () => {
            document.documentElement.style.overflow = "";
            getLenis()?.start();
            panel.style.display = "none";
            rememberLoaded();
          },
        })
        .to(counter, {
          value: 100,
          duration: 0.5,
          ease: "power3.out",
          onUpdate: () => paint(Math.round(counter.value)),
          onComplete: () => showStep(STEPS.length - 1),
        })
        .to(panel.querySelectorAll(".pl-fade"), { yPercent: -120, opacity: 0, duration: 0.6, ease: "expo.in", stagger: 0.04 }, "+=0.15")
        .add(() => markSiteReady(), "-=0.1")
        .to(panel, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, "-=0.2");
    });

    return () => {
      isCancelled = true;
      opening.kill();
      closing?.kill();
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div
      ref={panelRef}
      role="status"
      aria-label="Loading"
      className="site-loader no-print fixed inset-0 z-[100] flex flex-col justify-between bg-ink px-4 py-5 text-paper sm:px-6 md:px-10 md:py-8"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div className="pl-fade label flex items-start justify-between">
        <span>{site.name} — Portfolio</span>
        <span>©2026</span>
      </div>

      <div ref={logRef} aria-hidden="true" className="pl-fade mx-auto w-full max-w-md font-mono text-[12px] leading-6 text-paper/60">
        {STEPS.map((step, i) => (
          <div key={step} hidden={i > 0} className="flex justify-between">
            <span>
              <span className="text-paper/40">&gt;</span> {step}
            </span>
            <span className="animate-blink">_</span>
          </div>
        ))}
      </div>

      <div>
        <div className="pl-fade flex items-end justify-between">
          <span ref={digitsRef} className="display text-[clamp(7rem,26vw,24rem)] leading-[0.78] tabular-nums">
            000
          </span>
          <span className="label mb-4 hidden md:block">
            {site.location.city.split(",")[0]}, UK — {site.location.coords.split(" · ")[0]}
          </span>
        </div>
        <div className="pl-fade mt-4 h-px w-full bg-line">
          <div ref={barRef} className="h-px w-full origin-left scale-x-0 bg-accent" />
        </div>
      </div>
    </div>
  );
}
