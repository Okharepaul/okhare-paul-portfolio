"use client";

import { useRef, type ReactNode, type Ref } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { VALID_FOR_DAYS, paymentTerms, quoteNotes, runningCostTerms } from "@/content/quote";
import { pad2 } from "@/content/projects";
import { site } from "@/content/site";
import { Email } from "@/components/ui/Email";
import { Logo } from "@/components/ui/primitives";
import { prefersReducedMotion } from "@/lib/motion";
import { formatDate, formatGBP, formatShortDate, type Quote, type QuoteClient } from "@/lib/quote";
import { CountedTotal } from "./LiveEstimate";

gsap.registerPlugin(useGSAP);

type QuoteSheetProps = {
  quote: Quote;
  /** The estimate's reference, e.g. "OP-EST-2611-0473". */
  reference: string;
  issued: Date;
  /** Who it is for, as typed by the visitor. Either may be empty. */
  client: QuoteClient;
  /** The title takes focus when the estimate appears, so a screen reader starts from it. */
  titleRef?: Ref<HTMLHeadingElement>;
};

type CardProps = {
  label: string;
  children: ReactNode;
};

function Card({ label, children }: CardProps) {
  return (
    <div data-quote-item className="border border-line px-5 py-4">
      <p className="label">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/**
 * The finished estimate, as a document in the site's own look: who it is for,
 * every piece of work with what it covers and why it is there, the total in
 * pounds, how payment is split, and, set apart, the running costs the client
 * pays direct. It prints as one clean sheet.
 */
export function QuoteSheet({ quote, reference, issued, client, titleRef }: QuoteSheetProps) {
  const rootRef = useRef<HTMLElement>(null);
  const validUntil = new Date(issued.getTime() + VALID_FOR_DAYS * 24 * 60 * 60 * 1000);
  const preparedFor = client.name.trim() || "You";

  // The sheet comes out like paper from a printer: uncovered from the top, its parts settling one after another.
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;
      gsap.fromTo(root, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" });
      gsap.fromTo(
        root.querySelectorAll("[data-quote-item]"),
        { opacity: 0, y: 26 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power4.out", stagger: 0.045, delay: 0.35, clearProps: "transform,opacity" },
      );
    },
    { scope: rootRef },
  );

  return (
    <article ref={rootRef} aria-labelledby="quote-title" className="quote-sheet crosshair">
      <header className="quote-band flex flex-wrap items-end justify-between gap-6 px-6 py-7 md:px-10 md:py-9">
        <div className="flex items-center gap-4">
          <Logo className="size-12 md:size-14" />
          <div>
            <p className="font-mono text-sm tracking-[0.2em] uppercase">
              Okhare <span className="quote-band-accent">Paul</span>
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.24em] uppercase opacity-70">Software engineering &amp; design</p>
          </div>
        </div>
        <div className="sm:text-right">
          <h2 id="quote-title" ref={titleRef} tabIndex={-1} className="display text-[clamp(3.4rem,8vw,6.5rem)] outline-none">
            Estimate
          </h2>
          <p className="mt-1 font-mono text-xs tracking-[0.16em] uppercase">No. {reference}</p>
        </div>
      </header>

      <div className="label flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-b border-line px-6 py-3 md:px-10">
        <Email className="normal-case tracking-normal text-paper" />
        <span>{site.location.short}</span>
        <span className="text-paper">Issued {formatDate(issued)}</span>
      </div>

      <div className="grid gap-3 px-6 pt-6 md:grid-cols-3 md:px-10 md:pt-8">
        <Card label="Prepared for">
          <p className="heading text-2xl uppercase">{preparedFor}</p>
          {client.business.trim() ? <p className="text-sm text-paper/70">{client.business.trim()}</p> : null}
        </Card>
        <Card label="Project">
          <p className="heading text-2xl uppercase">{quote.type.label}</p>
          <p className="text-sm text-paper/70">{quote.type.detail}</p>
        </Card>
        <Card label="Estimate details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-xs">
            <dt className="text-paper/60">Valid until</dt>
            <dd className="text-right whitespace-nowrap">{formatShortDate(validUntil)}</dd>
            <dt className="text-paper/60">Currency</dt>
            <dd className="text-right">GBP (£)</dd>
            <dt className="text-paper/60">Lines</dt>
            <dd className="text-right">{pad2(quote.lines.length)}</dd>
          </dl>
        </Card>
      </div>

      <div className="px-6 pt-8 md:px-10">
        {/* The roles are spelled out because on a phone the table is laid out as a grid, and some browsers
            forget what a table is once its display changes. */}
        <table role="table" className="quote-table w-full border-collapse">
          <caption className="sr-only">The work in this estimate, what each line covers, why it is there and its price</caption>
          <thead role="rowgroup">
            <tr role="row" data-quote-item className="border-b border-line-strong">
              <th role="columnheader" scope="col" className="w-12 py-3 text-paper/60">
                #
              </th>
              <th role="columnheader" scope="col" className="py-3 text-paper/60">
                The work
              </th>
              <th role="columnheader" scope="col" className="py-3 pl-4 text-right text-paper/60">
                Price
              </th>
            </tr>
          </thead>
          <tbody role="rowgroup">
            {quote.lines.map((line, i) => (
              <tr key={line.id} role="row" data-quote-item>
                <td role="cell" className="py-4 font-mono text-xs text-accent-text">{pad2(i + 1)}</td>
                <td role="cell" className="py-4">
                  <p className="heading text-xl uppercase md:text-2xl">{line.title}</p>
                  <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-paper/80">{line.covers}</p>
                  <p className="mt-1.5 max-w-[62ch] text-sm leading-relaxed text-paper/60">
                    <span className="mr-2 font-mono text-[10px] tracking-[0.14em] text-accent-text uppercase">Why</span>
                    {line.why}
                  </p>
                </td>
                <td role="cell" className="py-4 pl-4 text-right font-mono text-sm tabular-nums whitespace-nowrap">{formatGBP(line.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 px-6 pt-6 md:grid-cols-2 md:px-10">
        <div data-quote-item className="quote-keep border border-line px-5 py-4">
          <p className="label">How payment works</p>
          <dl className="mt-3 flex flex-col gap-3">
            {[
              { ...paymentTerms.upfront, amount: quote.upfront },
              { ...paymentTerms.completion, amount: quote.completion },
            ].map((part) => (
              <div key={part.label} className="flex items-baseline justify-between gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0">
                <dt>
                  <span className="heading text-2xl">{part.percent}%</span> <span className="text-sm text-paper/70">{part.label}</span>
                </dt>
                <dd className="font-mono text-sm tabular-nums">{formatGBP(part.amount)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div data-quote-item className="quote-keep flex flex-col">
          <dl className="flex flex-1 flex-col justify-center gap-2 border border-b-0 border-line px-5 py-4 font-mono text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-paper/70">Subtotal</dt>
              <dd className="tabular-nums">{formatGBP(quote.subtotal)}</dd>
            </div>
            {quote.priority ? (
              <div className="flex justify-between gap-4">
                <dt className="text-paper/70">
                  {quote.priority.label} · +{quote.priority.percent}%
                </dt>
                <dd className="tabular-nums">{formatGBP(quote.priority.amount)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="quote-total flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-5 py-4">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase">
              Estimated total
              <span className="block opacity-75">GBP · for the work</span>
            </p>
            <CountedTotal amount={quote.total} className="display text-[clamp(2.6rem,5vw,4rem)]" />
          </div>
        </div>
      </div>

      <section data-quote-item aria-labelledby="quote-own" className="quote-own quote-keep mx-6 mt-6 px-5 py-5 md:mx-10 md:px-7 md:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 id="quote-own" className="display text-4xl md:text-5xl">
            {runningCostTerms.heading}
          </h3>
          <p className="label text-accent-text">{runningCostTerms.label}</p>
        </div>
        <p className="mt-3 max-w-[60ch] text-paper/85">{runningCostTerms.lead}</p>

        <dl className="mt-5 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {quote.running.map((cost) => (
            <div key={cost.id} className="border-t border-line pt-3">
              <dt className="flex items-baseline justify-between gap-4">
                <span className="heading text-xl uppercase">{cost.title}</span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-accent-text uppercase">Paid by you</span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-paper/70">{cost.note}</dd>
            </div>
          ))}
        </dl>

        <ul className="mt-6 flex flex-col gap-2 border-t border-line pt-4 text-sm leading-relaxed text-paper/85">
          {runningCostTerms.points.map((point) => (
            <li key={point} className="grid grid-cols-[1.25rem_1fr]">
              <span aria-hidden="true" className="text-accent-text">
                +
              </span>
              {point}
            </li>
          ))}
        </ul>
        <p className="heading mt-5 max-w-[46ch] text-xl uppercase md:text-2xl">{runningCostTerms.reason}</p>
      </section>

      <div className="grid gap-6 px-6 pt-8 md:grid-cols-[1.4fr_1fr] md:px-10">
        <div data-quote-item>
          <p className="label">Your answers</p>
          <dl className="mt-3 border-t border-line">
            {quote.summary.map((row) => (
              <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-4 border-b border-line py-2.5 text-sm">
                <dt className="font-mono text-xs text-paper/60 uppercase">{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div data-quote-item className="quote-keep flex flex-col justify-between gap-6">
          <ul className="flex flex-col gap-2 text-sm leading-relaxed text-paper/70">
            {quoteNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <div className="border-t border-line-strong pt-3">
            <p className="heading text-2xl uppercase">{site.name}</p>
            <p className="label mt-1">Lead Engineer</p>
          </div>
        </div>
      </div>

      <footer className="label mt-8 flex flex-wrap justify-between gap-x-8 gap-y-1 border-t border-line px-6 py-4 md:px-10">
        <span>Okhare Paul · Software engineering &amp; design</span>
        <span>
          Estimate {reference} · Valid {VALID_FOR_DAYS} days
        </span>
      </footer>
    </article>
  );
}
