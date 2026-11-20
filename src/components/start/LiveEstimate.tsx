"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { pad2 } from "@/content/projects";
import { prefersReducedMotion } from "@/lib/motion";
import { formatGBP, type Quote } from "@/lib/quote";

type LiveEstimateProps = {
  /** The estimate for the answers so far, or null before the first answer. */
  quote: Quote | null;
};

type CountedTotalProps = {
  amount: number;
  className?: string;
};

/**
 * A sum of money that counts to its new value whenever it changes. The moving
 * figure is for the eye only; what a screen reader hears is the settled
 * amount, announced once.
 */
export function CountedTotal({ amount, className = "" }: CountedTotalProps) {
  const figureRef = useRef<HTMLSpanElement>(null);
  const shownRef = useRef(amount);
  // React writes the figure once; after that the count below owns its text, so a new amount is never shown
  // whole for a frame before the count towards it begins.
  const [firstText] = useState(() => formatGBP(amount));

  useEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;
    if (prefersReducedMotion() || shownRef.current === amount) {
      shownRef.current = amount;
      figure.textContent = formatGBP(amount);
      return;
    }
    const counter = { value: shownRef.current };
    const tween = gsap.to(counter, {
      value: amount,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => {
        shownRef.current = counter.value;
        figure.textContent = formatGBP(Math.round(counter.value));
      },
      onComplete: () => {
        shownRef.current = amount;
        figure.textContent = formatGBP(amount);
      },
    });
    return () => {
      tween.kill();
    };
  }, [amount]);

  return (
    <span className={className}>
      <span ref={figureRef} aria-hidden="true" className="tabular-nums">
        {firstText}
      </span>
      <span role="status" className="sr-only">
        Estimated total {formatGBP(amount)}
      </span>
    </span>
  );
}

/**
 * The estimate, building as the questions are answered: a receipt that gains
 * a line for every choice and keeps a running total. It sits beside the
 * questions on large screens and under them on small ones.
 */
export function LiveEstimate({ quote }: LiveEstimateProps) {
  return (
    // Never taller than the screen: the lines scroll inside it, so the total is always in view.
    <aside aria-label="Your estimate so far" className="receipt crosshair flex flex-col lg:max-h-[calc(100svh-7.5rem)]">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <p className="label flex items-center gap-2.5 text-paper">
          <span aria-hidden="true" className="size-1.5 animate-[blink_1s_steps(1)_infinite] rounded-full bg-accent" />
          Live estimate
        </p>
        <p className="label">GBP · £</p>
      </header>

      {quote ? (
        <>
          <div className="px-5 pt-5">
            <p className="label">
              <span className="text-accent-text">{quote.type.code}</span> · Project
            </p>
            <p className="heading mt-2 text-3xl uppercase">{quote.type.label}</p>
          </div>

          <ul data-lenis-prevent className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-5">
            {quote.lines.map((line, i) => (
              <li key={line.id} className="receipt-row" style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}>
                <span>
                  <span className="text-paper/45">{pad2(i + 1)}</span> {line.title}
                </span>
                {/* Keyed by its amount: a changed price is a new element, which plays the flash. */}
                <span key={line.price} className="receipt-price">
                  {formatGBP(line.price)}
                </span>
              </li>
            ))}
            {quote.priority ? (
              <li className="receipt-row text-accent-text">
                <span>
                  {quote.priority.label} +{quote.priority.percent}%
                </span>
                <span className="receipt-price">{formatGBP(quote.priority.amount)}</span>
              </li>
            ) : null}
          </ul>

          <div className="border-t border-line px-5 py-5">
            <p className="label">Estimated total</p>
            <CountedTotal amount={quote.total} className="display mt-2 block text-[clamp(3rem,4.6vw,4.5rem)] text-accent" />
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              For the work. Domains and other running costs are yours to pay direct; the quote sets them out.
            </p>
          </div>
        </>
      ) : (
        <div className="px-5 py-10">
          <p className="heading text-3xl uppercase text-paper/35">£ — — —</p>
          <p className="mt-4 max-w-[30ch] text-sm leading-relaxed text-paper/60">
            Choose what we are building and the estimate starts here, one line at a time.
          </p>
        </div>
      )}
    </aside>
  );
}
