import Link from "next/link";
import { chapters, meet } from "@/content/meet";
import { pad2 } from "@/content/projects";
import { site } from "@/content/site";
import { Arrow, SectionLabel, SplitChars } from "@/components/ui/primitives";

const infoClass = "font-mono text-[12px] tracking-[0.12em] uppercase";
/** Letters near the pointer thicken, as on the home page's heading: lightest, heaviest, reach in pixels. */
const NAME_WEIGHT = "300,760,260";
const total = pad2(chapters.length);

/** A paragraph set word by word, so it can light up as it is scrolled through. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="word">
          {word}{" "}
        </span>
      ))}
    </>
  );
}

/** The line across the top of the page: the way back, and what the page is. */
export function MeetTop() {
  return (
    <>
      <Link href="/#about" className="animate-in label group flex items-center gap-2 whitespace-nowrap hover:text-paper">
        <Arrow direction="left" className="size-3! transition-transform group-hover:-translate-x-0.5" />
        Back to About
      </Link>
      {/* The number is dropped on a phone, where the line has no room for it. */}
      <div className="animate-in whitespace-nowrap sm:hidden">
        <SectionLabel>{meet.label}</SectionLabel>
      </div>
      <div className="animate-in whitespace-nowrap max-sm:hidden">
        <SectionLabel index="00">{meet.label}</SectionLabel>
      </div>
    </>
  );
}

/** The first screen: the name, set either side of the portrait on wide screens, and a few facts. */
export function MeetHero() {
  const [first, last] = site.name.split(" ");
  return (
    <>
      <h1 id="meet-heading" className="meet-name display">
        <span className="sr-only">{meet.label}: </span>
        <span className="meet-word meet-word-first">
          <SplitChars text={first} trigger="intro" weight={NAME_WEIGHT} className="block" />
        </span>
        <span className="meet-word meet-word-last">
          <SplitChars text={last} trigger="intro" weight={NAME_WEIGHT} className="block" />
        </span>
      </h1>

      <p className="meet-lead animate-in leading-relaxed text-paper/70">{site.description}</p>

      <div className="meet-facts">
        <div className="animate-in">
          <p className={`${infoClass} text-paper`}>{meet.role}</p>
          <p className={`${infoClass} text-paper/55`}>{meet.tags.join(" • ")}</p>
        </div>
        <div className="animate-in">
          <p className={`${infoClass} text-paper`}>{meet.place}</p>
          <p className={`${infoClass} text-paper/55`}>{meet.coords}</p>
        </div>
      </div>

      <a href="#meet-story" className="meet-scroll animate-in label hover:text-paper">
        Scroll
        <Arrow direction="down" className="size-3! animate-bounce text-accent-text" />
      </a>
    </>
  );
}

/** The story: the whole road in one line, then one chapter for each side of the owner. */
export function MeetChapters() {
  return (
    <>
      <div data-stop className="meet-chapter border-t-0!">
        <p className="label reveal">
          [ <span className="text-accent-text">{meet.chaptersLabel}</span> ] · {meet.prologue.kicker}
        </p>
        <p data-words className="heading mt-6 max-w-[24ch] text-[clamp(1.9rem,3.1vw,3.2rem)] leading-[1.06] text-paper">
          <Words text={meet.prologue.text} />
        </p>
      </div>

      {chapters.map((chapter, i) => {
        const facts = chapter.facts.filter((fact) => fact.value.length > 0);
        return (
          <article
            key={chapter.id}
            id={`meet-${chapter.id}`}
            aria-labelledby={`meet-${chapter.id}-title`}
            data-stop
            data-caption={`${pad2(i + 1)} / ${total} · ${chapter.title}`}
            className="meet-chapter"
          >
            <div className="flex items-end justify-between gap-6">
              <span aria-hidden="true" className="meet-chapter-index display tabular-nums">
                {pad2(i + 1)}
              </span>
              <p className="label reveal text-right">
                {chapter.kicker.split(" · ").map((part) => (
                  <span key={part} className="block">
                    {part}
                  </span>
                ))}
              </p>
            </div>
            <SplitChars as="h2" id={`meet-${chapter.id}-title`} text={chapter.title} className="display mt-7 block text-[clamp(3rem,6.2vw,6.5rem)]" />
            <p data-words className="heading mt-6 max-w-[30ch] text-[clamp(1.45rem,2.15vw,2.2rem)] leading-[1.14] text-paper">
              <Words text={chapter.body} />
            </p>

            <dl className="reveal mt-8 border-t border-line">
              {facts.map((fact) => (
                <div key={fact.label} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-4 border-b border-line py-2.5 font-mono text-[11px] tracking-[0.08em] uppercase">
                  <dt className="text-paper/55">{fact.label}</dt>
                  <dd className="text-paper/90">{fact.value}</dd>
                </div>
              ))}
            </dl>

            {chapter.link ? (
              <div className="reveal mt-6">
                <Link href={chapter.link.href} data-magnetic className="btn-ghost">
                  {chapter.link.label}
                  <Arrow />
                </Link>
              </div>
            ) : null}
          </article>
        );
      })}
    </>
  );
}
