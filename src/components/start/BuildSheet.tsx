"use client";

import { useRef, type CSSProperties, type ReactNode, type Ref } from "react";
import { Mrs_Saint_Delafield } from "next/font/google";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { buildNotes, nextSteps, runningCostTerms } from "@/content/quote";
import { pad2 } from "@/content/projects";
import { site } from "@/content/site";
import { Email } from "@/components/ui/Email";
import { Logo } from "@/components/ui/primitives";
import { CORE_SECTION, type Build, type BuildClient } from "@/lib/build";
import { prefersReducedMotion } from "@/lib/motion";
import { formatDate, formatShortDate } from "@/lib/quote";

gsap.registerPlugin(useGSAP);

/** The hand the build is signed in, as on the owner's invoices. Here it is the client's approval. */
const signature = Mrs_Saint_Delafield({ subsets: ["latin"], weight: "400", display: "swap" });

/** Where a build stands: still being checked, approved by the visitor, or sent to the owner. */
export type BuildStatus = { kind: "draft" } | { kind: "approved"; on: Date } | { kind: "sent"; on: Date };

export const statusLabel = (status: BuildStatus): string =>
  status.kind === "draft" ? "Awaiting your approval" : status.kind === "approved" ? "Approved" : "Approved & sent";

type BuildSheetProps = {
  build: Build;
  /** The build's reference, e.g. "OP-BLD-2611-0473". */
  reference: string;
  issued: Date;
  /** Who it is from, as typed by the visitor. Either may be empty. */
  client: BuildClient;
  status: BuildStatus;
  /** The title takes focus when the build appears, so a screen reader starts from it. */
  titleRef?: Ref<HTMLHeadingElement>;
};

type CardProps = {
  label: string;
  hasDots?: boolean;
  className?: string;
  children: ReactNode;
};

/** Three small dots in a card's corner, as on the invoice. */
function Dots() {
  return (
    <span aria-hidden="true" className="qs-dots">
      <span />
      <span />
      <span />
    </span>
  );
}

function Card({ label, hasDots = false, className = "", children }: CardProps) {
  return (
    <div data-quote-item className={`qs-card ${className}`}>
      {hasDots ? <Dots /> : null}
      <p className="qs-label">{label}</p>
      {children}
    </div>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="qs-icon" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" />
      <path d="M2.5 4.25 8 8.6l5.5-4.35" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="qs-icon" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M8 14.5s-4.5-4.3-4.5-8a4.5 4.5 0 0 1 9 0c0 3.7-4.5 8-4.5 8Z" />
      <circle cx="8" cy="6.5" r="1.6" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="qs-tick" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square">
      <path d="M2 6.5l2.6 2.6L10 3.4" />
    </svg>
  );
}

type BandProps = {
  reference: string;
  issued: Date;
  titleRef?: Ref<HTMLHeadingElement>;
};

/** The dark band across the top: the mark and name, the document's title and number, then how to reach me. */
function Band({ reference, issued, titleRef }: BandProps) {
  // The first name in ink, the rest in orange, as on the invoice.
  const name = site.name.toUpperCase();
  const space = name.indexOf(" ");
  const [first, second] = space < 0 ? [name, ""] : [name.slice(0, space), name.slice(space + 1)];
  return (
    <header data-quote-item className="qs-band">
      <div className="qs-band-top">
        <div className="qs-band-card qs-brand">
          <Dots />
          <Logo className="qs-logo" />
          <div className="min-w-0">
            <p className="qs-wordmark">
              {first} <span className="qs-wordmark-accent">{second}</span>
            </p>
            <p className="qs-tagline">Software engineering &amp; design</p>
          </div>
        </div>
        <div className="qs-band-card qs-title-card">
          <h2 id="quote-title" ref={titleRef} tabIndex={-1} className="qs-title">
            Your build
          </h2>
          <p className="qs-number">No. {reference}</p>
          <svg aria-hidden="true" viewBox="0 0 8 12" className="qs-chevron" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="m1.5 1.5 5 4.5-5 4.5" />
          </svg>
        </div>
      </div>
      <div className="qs-contact">
        <span className="qs-contact-item">
          <MailIcon />
          <Email />
        </span>
        <span className="qs-contact-item">
          <PinIcon />
          {site.location.short}
        </span>
        <span className="qs-issued">Built {formatDate(issued)}</span>
      </div>
    </header>
  );
}

/**
 * Every part of the build, numbered, in the invoice's striped table, with
 * where it came from and a tick where the invoice had a price. The roles are
 * spelled out because the narrow layout restyles the rows, and some browsers
 * then stop treating them as a table.
 */
function Parts({ build }: { build: Build }) {
  return (
    <div data-quote-item className="qs-table-wrap">
      <table role="table" className="qs-table">
        <caption className="sr-only">Every part of your build, what it covers, and where it came from</caption>
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col" className="qs-col-n">
              #
            </th>
            <th role="columnheader" scope="col">Item description</th>
            <th role="columnheader" scope="col" className="qs-col-part">
              Part of
            </th>
            <th role="columnheader" scope="col" className="qs-col-in">
              In
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {build.parts.map((part, i) => (
            <tr key={part.id} role="row">
              <td role="cell" className="qs-col-n">
                {pad2(i + 1)}
              </td>
              <td role="cell">
                <p className="qs-item-title">{part.title}</p>
                <p className="qs-item-covers">{part.covers}</p>
              </td>
              <td role="cell" className="qs-col-part">
                <span className="qs-part" data-core={part.section === CORE_SECTION}>
                  {part.section}
                </span>
              </td>
              <td role="cell" className="qs-col-in">
                <TickIcon />
                <span className="sr-only">Included</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** What happens once it is sent, beside the count of what is in it. */
function Summary({ build, status }: { build: Build; status: BuildStatus }) {
  const core = build.parts.filter((part) => part.section === CORE_SECTION).length;
  // The questions the picks came from, in the order they were asked: "Scope, features, look".
  const sections = [...new Set(build.parts.filter((part) => part.section !== CORE_SECTION).map((part) => part.section.toLowerCase()))];
  const from = sections.join(", ");
  return (
    <div className="qs-split">
      <Card label="What happens next" className="qs-keep">
        <ol className="qs-next">
          {nextSteps.map((step, i) => (
            <li key={step.title}>
              <span aria-hidden="true" className="qs-next-n">
                {pad2(i + 1)}
              </span>
              <span>
                <strong>{step.title}</strong>
                <span className="qs-next-detail">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="qs-sums qs-keep">
        <div data-quote-item className="qs-card">
          <dl className="qs-sum-rows">
            <div>
              <dt>Core work</dt>
              <dd>{pad2(core)}</dd>
            </div>
            <div>
              <dt>
                Your picks
                {from ? <span className="qs-sum-note">{from.charAt(0).toUpperCase() + from.slice(1)}</span> : null}
              </dt>
              <dd>{pad2(build.parts.length - core)}</dd>
            </div>
          </dl>
          <p className="qs-pill">
            <span>
              <span aria-hidden="true" className="qs-pill-mark" />
              <strong>Running costs</strong> · paid by you, direct
            </span>
            <span>{build.running.length > 0 ? `${build.running.length} in the terms` : "None"}</span>
          </p>
        </div>
        <div data-quote-item className="qs-grand">
          <p>
            <span className="qs-grand-label">Your build</span>
            <span className="qs-grand-note">{build.type.label}</span>
          </p>
          <div className="text-right">
            <span className="qs-grand-amount">
              {pad2(build.parts.length)}
              <span className="qs-grand-unit"> parts</span>
            </span>
            <span className="qs-grand-pill" data-status={status.kind}>
              {statusLabel(status)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The terms, in the owner's words, and the client's approval. */
function Close({ build, client, status }: { build: Build; client: BuildClient; status: BuildStatus }) {
  const running = build.running.map((cost) => cost.title).join(", ");
  const terms = [...buildNotes, ...(running ? [`Paid by you, direct to the provider: ${running}.`] : []), ...runningCostTerms.points];
  const name = client.name.trim();
  const isSigned = status.kind !== "draft";
  const signer = name || (isSigned ? "The client" : "Your name");
  const isSignedByName = isSigned && name !== "";
  const role = status.kind === "draft" ? "Awaiting your approval" : `${statusLabel(status)} · ${formatShortDate(status.on)}`;
  return (
    <div className="qs-close">
      <div data-quote-item className="qs-card qs-keep">
        <p className="qs-thanks">Thank you for building it with me.</p>
        <p className="qs-label qs-terms-label">✱ Terms &amp; responsibilities</p>
        <ul className="qs-terms">
          {terms.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </div>
      <div data-quote-item className="qs-card qs-sign qs-keep">
        <p className="qs-label qs-sign-label">Approved by</p>
        {/* The approval signs the page: the name is written out in script the moment it is given. */}
        <p
          aria-hidden="true"
          className={`qs-signature ${signature.className}`}
          data-signed={isSignedByName ? "true" : "false"}
          // Its length sets its size (see .qs-signature), so a long name is written smaller, never cut off.
          style={{ "--sig-chars": Math.max(name.length, 10) } as CSSProperties}
        >
          {isSignedByName ? name : " "}
        </p>
        <p className="qs-sign-name">{signer}</p>
        <p className="qs-sign-role">{role}</p>
      </div>
    </div>
  );
}

/**
 * The finished build, laid out like the owner's own invoice (OP-2611-0473):
 * the band with his mark, three cards (who built it, the project, the
 * details), the striped table of parts, what happens next beside the count,
 * then the terms and the client's approval. No figure appears anywhere: the
 * price is agreed after a call. Sizes are the invoice's, in pixels of an A4
 * page, so a print fills one page, or two for a big build. Colours and type
 * are the site's own, and follow its theme on screen.
 */
export function BuildSheet({ build, reference, issued, client, status, titleRef }: BuildSheetProps) {
  const rootRef = useRef<HTMLElement>(null);
  const name = client.name.trim();
  const business = client.business.trim();
  const isDraft = status.kind === "draft";

  // The sheet comes out like paper from a printer: uncovered from the top, its parts settling one after another.
  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || prefersReducedMotion()) return;
      gsap.fromTo(root, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" });
      gsap.fromTo(
        root.querySelectorAll("[data-quote-item]"),
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power4.out", stagger: 0.05, delay: 0.35, clearProps: "transform,opacity" },
      );
    },
    { scope: rootRef },
  );

  return (
    <article ref={rootRef} aria-labelledby="quote-title" className="qs">
      <Band reference={reference} issued={issued} titleRef={titleRef} />

      <div className="qs-cards">
        <Card label="Built by" hasDots>
          <p className={`qs-client ${name ? "" : "qs-faint"}`}>{name || (isDraft ? "You" : "The client")}</p>
          {business ? <p className="qs-strong-sm">{business}</p> : null}
          {/* A build opened from its link carries no name; the email it came in does. */}
          <p className="qs-muted">{name ? "Client" : isDraft ? "Add your name beside your build" : "Named in the email it came with"}</p>
        </Card>
        <Card label="Project">
          <p className="qs-strong">{build.type.label}</p>
          <p className="qs-muted">{build.type.detail}</p>
        </Card>
        <Card label="Build details">
          <dl className="qs-facts">
            <dt>Build no.</dt>
            <dd>{reference}</dd>
            <dt>Built on</dt>
            <dd>{formatShortDate(issued)}</dd>
            <dt>Parts</dt>
            <dd>{build.parts.length}</dd>
            <dt>Status</dt>
            <dd className="qs-status" data-status={status.kind}>
              {statusLabel(status)}
            </dd>
          </dl>
        </Card>
      </div>

      <Parts build={build} />
      <Summary build={build} status={status} />
      <Close build={build} client={client} status={status} />

      <footer className="qs-foot">
        <span>{site.name} · Software engineering &amp; design</span>
        <span>Build {reference} · A brief, not a quote</span>
      </footer>
    </article>
  );
}
