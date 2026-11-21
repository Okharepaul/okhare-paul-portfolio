import Link from "next/link";
import { contact, labBand } from "@/content/home";
import { labComponents, labExperiments } from "@/content/lab";
import { pad2 } from "@/content/projects";
import { activeSocials, hire, site } from "@/content/site";
import { DotField } from "@/components/art/DotField";
import { Email } from "@/components/ui/Email";
import type { DotBlob } from "@/lib/dots";
import { Arrow, SectionLabel, SplitChars } from "@/components/ui/primitives";
import { ContactForm } from "./ContactForm";
import { GlobeCanvas } from "./Journey";

/** Gathered top right, clear of the heading and the row of links underneath. */
const LAB_DOTS: readonly DotBlob[] = [
  { x: 0.84, y: 0.24, radius: 0.15, strength: 0.9 },
  { x: 0.58, y: 0.1, radius: 0.07, strength: 0.6 },
];
const CONTACT_DOTS: readonly DotBlob[] = [{ x: 0.06, y: 0.96, radius: 0.3, strength: 0.8 }];

/** "03 · Lab": a short band that points at the Lab page. */
export function LabBand() {
  return (
    <section id="lab" aria-labelledby="lab-heading" className="relative scroll-mt-16 border-t border-line px-4 py-14 sm:px-6 md:px-10 md:py-20">
      <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0 opacity-40" />
      <DotField blobs={LAB_DOTS} seed={41} accent={0.18} className="absolute inset-0 size-full opacity-40" />
      <div className="relative">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionLabel index="03" total="04">
              Lab
            </SectionLabel>
            <SplitChars as="h2" id="lab-heading" text={labBand.heading} className="display mt-5 block text-[clamp(2.8rem,6.5vw,6rem)]" />
            <p className="label mt-4 text-paper/70">
              <span className="text-accent-text">{pad2(labComponents.length)}</span> components dissected ·{" "}
              <span className="text-accent-text">{pad2(labExperiments.length)}</span> {labExperiments.length === 1 ? "experiment" : "experiments"}
            </p>
          </div>
          <Link href="/lab" data-magnetic className="btn-accent shrink-0 self-start md:self-auto">
            {labBand.cta}
            <Arrow />
          </Link>
        </div>

        <ul className="mt-10 grid grid-cols-1 border-t border-line md:grid-cols-3 md:gap-8 md:border-t-0">
          {labBand.links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-baseline gap-3 border-b border-line px-1 py-3 transition-colors duration-200 hover:bg-paper hover:text-ink focus:outline-none focus-visible:bg-paper focus-visible:text-ink md:border-t"
              >
                <span className="font-display text-[19px] text-paper transition-colors group-hover:text-ink group-focus-visible:text-ink">{link.label}</span>
                <span aria-hidden="true" className="min-w-6 flex-1 translate-y-[-3px] border-b border-dotted border-paper/25 group-hover:border-ink/40" />
                <span className="font-mono text-[11px] tracking-[0.08em] text-paper/60 uppercase transition-colors group-hover:text-ink group-focus-visible:text-ink">{link.tag}</span>
                <span aria-hidden="true" className="w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const rowClass = "flex items-center gap-4 py-4 text-paper/80";

/** "04 · Contact": headline, email, details and the message form. */
export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="relative w-full scroll-mt-16 overflow-hidden border-t border-line bg-ink px-4 py-20 text-paper sm:px-6 md:px-10 md:py-28"
    >
      <GlobeCanvas isBare initialProgress={1} className="pointer-events-none absolute top-10 -right-40 hidden w-[620px] opacity-25 lg:block" />
      <DotField blobs={CONTACT_DOTS} base={0.03} seed={43} accent={0.16} className="absolute inset-0 size-full opacity-35" />

      <div className="reveal relative">
        <SectionLabel index="04" total="04">
          Contact
        </SectionLabel>
        <SplitChars as="h2" id="contact-heading" text={contact.heading} className="display mt-6 block text-[clamp(3rem,9vw,9rem)]" />
        <Email className="group mt-6 inline-flex max-w-full items-center gap-4 border-b border-line pb-2 font-display text-[clamp(1.6rem,4.4vw,4.6rem)] leading-none font-light text-paper/80 transition-colors hover:border-paper hover:text-paper">
          <Arrow direction="up-right" className="size-[0.7em]! text-accent transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Email>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h3 className="heading text-3xl md:text-4xl">Let&apos;s talk</h3>
            <p className="mt-4 max-w-md leading-relaxed text-paper/70">{contact.copy}</p>
            <Link href={hire.href} data-magnetic className="btn-accent mt-6">
              {hire.label}
              <Arrow />
            </Link>
            <ul className="mt-8 border-t border-line">
              <li className={`border-b border-line ${rowClass}`}>
                <span className="label w-14">Email</span>
                <Email className="flex-1 font-mono text-[13px] transition-colors hover:text-paper" />
              </li>
              {site.phone ? (
                <li className={`border-b border-line ${rowClass}`}>
                  <span className="label w-14">Tel</span>
                  <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="flex-1 font-mono text-[13px] transition-colors hover:text-paper">
                    {site.phone}
                  </a>
                </li>
              ) : null}
              <li className={`border-b border-line ${rowClass}`}>
                <span className="label w-14">Base</span>
                <span className="flex-1 font-mono text-[13px]">{site.location.full}</span>
              </li>
            </ul>
            {activeSocials.length > 0 ? (
              <div className="mt-6 flex gap-2">
                {activeSocials.map((social) => (
                  <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    {social.label}
                    <Arrow direction="up-right" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
