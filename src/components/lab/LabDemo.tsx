"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import type { LabDemo as Demo } from "@/content/lab";
import { DitherHero } from "@/components/hero/DitherHero";
import { LiveClock } from "@/components/shell/LiveClock";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { Arrow } from "@/components/ui/primitives";
import { prefersReducedMotion } from "@/lib/motion";

function CounterDemo() {
  const digitsRef = useRef<HTMLSpanElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => () => void tweenRef.current?.kill(), []);

  const replay = (): void => {
    const digits = digitsRef.current;
    if (!digits) return;
    tweenRef.current?.kill();
    if (prefersReducedMotion()) {
      digits.textContent = "100";
      return;
    }
    const counter = { value: 0 };
    tweenRef.current = gsap.to(counter, {
      value: 100,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        digits.textContent = String(Math.round(counter.value)).padStart(3, "0");
      },
    });
  };

  return (
    <div className="flex h-full flex-col items-start justify-end gap-4 p-5">
      <span ref={digitsRef} className="display text-[clamp(6rem,16vw,11rem)] leading-[0.78] tabular-nums">
        100
      </span>
      <button type="button" onClick={replay} data-magnetic className="btn-ghost">
        Replay the count
      </button>
    </div>
  );
}

const SAMPLE = "Hover me";

/** A heading whose letters thicken under the pointer. Self-contained, so it works inside the panel. */
function TypeDemo() {
  const rootRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const letters = Array.from(root.querySelectorAll<HTMLElement>("span"));
    const handleMove = (event: PointerEvent): void => {
      letters.forEach((letter) => {
        const rect = letter.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
        const closeness = Math.max(0, 1 - distance / 260);
        letter.style.fontVariationSettings = `"wght" ${Math.round(200 + 700 * closeness * closeness * (3 - 2 * closeness))}`;
      });
    };
    const handleLeave = (): void => letters.forEach((letter) => (letter.style.fontVariationSettings = '"wght" 200'));
    const host = root.parentElement ?? root;
    host.addEventListener("pointermove", handleMove);
    host.addEventListener("pointerleave", handleLeave);
    return () => {
      host.removeEventListener("pointermove", handleMove);
      host.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <div className="grid h-full place-items-center p-5">
      <p ref={rootRef} aria-label={SAMPLE} className="display text-[clamp(4rem,11vw,9rem)] [font-variation-settings:'wght'_200]">
        {Array.from(SAMPLE).map((character, i) => (
          <span key={`${character}-${i}`} aria-hidden="true" className="inline-block transition-[font-variation-settings] duration-150">
            {character === " " ? " " : character}
          </span>
        ))}
      </p>
    </div>
  );
}

interface NoteDemoProps {
  text: string;
  link?: { href: string; label: string };
  cursor?: string;
}

function NoteDemo({ text, link, cursor }: NoteDemoProps) {
  return (
    <div data-cursor={cursor} className="bg-dots flex h-full flex-col items-start justify-end gap-4 p-5">
      <p className="heading max-w-[22ch] bg-ink text-2xl">{text}</p>
      {link ? (
        <Link href={link.href} data-magnetic className="btn-ghost">
          {link.label}
          <Arrow />
        </Link>
      ) : null}
    </div>
  );
}

/** The live panel beside each component on the Lab page. */
export function LabDemo({ demo }: { demo: Demo }) {
  if (demo === "dither") {
    return (
      <div className="relative h-full">
        <DitherHero />
      </div>
    );
  }
  if (demo === "counter") return <CounterDemo />;
  if (demo === "type") return <TypeDemo />;
  if (demo === "clock") {
    return (
      <div className="flex h-full flex-col justify-end p-5">
        <LiveClock className="display text-[clamp(4.5rem,11vw,8rem)] leading-[0.8]" />
        <p className="label mt-4">Salford, Manchester · Europe/London</p>
      </div>
    );
  }
  if (demo === "theme") {
    return (
      <div className="flex h-full flex-col items-start justify-end gap-4 p-5">
        <p className="heading text-2xl">Flip it.</p>
        <ThemeToggle />
      </div>
    );
  }
  if (demo === "journey") {
    return <NoteDemo text="This one is tied to scroll. Fly it on the home page." link={{ href: "/#journey", label: "Fly the journey" }} />;
  }
  if (demo === "cursor") return <NoteDemo cursor="Hello" text="Move the mouse over this panel: the reticle grows and takes a label." />;
  return <NoteDemo text="Not built yet. It arrives in the next stage of the site." />;
}
