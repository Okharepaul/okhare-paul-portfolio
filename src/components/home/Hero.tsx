import Link from "next/link";
import { hero } from "@/content/home";
import { contactHref, hire, nav, site } from "@/content/site";
import { DitherHero } from "@/components/hero/DitherHero";
import { LiveClock } from "@/components/shell/LiveClock";
import { Arrow, SplitChars } from "@/components/ui/primitives";
import { CycleWord } from "./CycleWord";

const infoClass = "font-mono text-[12px] tracking-[0.12em] uppercase";

/** Wide lettering fitted to the full width, with the surname set vertically at the end. */
function Wordmark() {
  const [first, second] = site.name.toUpperCase().split(" ");
  return (
    <svg
      viewBox="0 0 1057.4 100"
      role="img"
      aria-label={site.name}
      className="block h-auto w-full min-w-0 shrink font-wide text-paper lg:w-[min(100%,calc(20vh*10.574))]"
      fill="currentColor"
    >
      <text x="0" y="100" fontSize="143" fontWeight="900" textLength="968" lengthAdjust="spacingAndGlyphs">
        {first}
      </text>
      <text className="fill-accent" transform="translate(1054 100) rotate(-90)" fontSize="34" fontWeight="900" textLength="100" lengthAdjust="spacingAndGlyphs">
        {second}
      </text>
    </svg>
  );
}

export function Hero() {
  const [first, second] = site.name.split(" ");

  return (
    <section
      data-enter="none"
      aria-labelledby="hero-heading"
      className="grain relative flex min-h-[calc(100svh-3.5rem)] w-full flex-col overflow-hidden lg:h-[calc(100svh-4rem)] lg:min-h-[620px]"
    >
      <div aria-hidden="true" className="absolute inset-0">
        <DitherHero />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-transparent to-ink/30 lg:to-ink/70" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-ink from-55% via-ink/80 to-transparent lg:hidden" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-ink via-ink/70 to-transparent lg:block" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-5 pb-5 sm:px-6 md:px-10 lg:pt-[2.2vh] lg:pb-[2.2vh]">
        {/* Strip linking to the contact section; hidden on short desktop screens. */}
        <Link
          href={contactHref}
          className="animate-in group mx-auto hidden w-full max-w-2xl items-center gap-3 border border-line bg-ink/70 px-3 py-2 backdrop-blur-sm transition-colors hover:border-paper/50 md:flex md:gap-4 [@media(min-width:1024px)_and_(max-height:820px)]:hidden"
        >
          <span className="border border-paper/60 px-1 font-display text-[13px] leading-tight font-semibold">OP</span>
          <span className="flex-1 truncate font-mono text-[11px] tracking-[0.08em] text-paper/80 uppercase md:text-[12px]">{hero.strip}</span>
          <span className="hidden font-mono text-[10px] text-paper/55 uppercase sm:inline">Write</span>
          <Arrow className="text-paper/70 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* The info bar */}
        <div className="-mx-4 mt-0 hidden shrink-0 grid-cols-2 gap-y-4 border-y border-line bg-ink/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 md:-mx-10 md:mt-8 md:grid md:grid-cols-4 md:px-10 lg:mt-[2.4vh] lg:py-[1.6vh]">
          <div className="animate-in">
            <p className={`${infoClass} text-paper`}>{first}</p>
            <p className={`${infoClass} text-accent-text`}>{second}</p>
          </div>
          <div className="animate-in text-right md:text-left">
            <p className={`${infoClass} text-paper`}>{site.location.city}</p>
            <p className={`${infoClass} text-paper/55`}>{site.location.country}</p>
          </div>
          <div className="animate-in hidden md:block">
            <p className={`${infoClass} text-paper`}>{site.role}</p>
            <p className={`${infoClass} text-paper/55`}>{site.tags.join(" • ")}</p>
          </div>
          <div className="animate-in hidden items-start justify-end gap-6 md:flex">
            <div className="md:text-right">
              <p className={`${infoClass} text-paper/55`}>Local time</p>
              <p className={`${infoClass} text-paper`}>
                <LiveClock />
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-end gap-6 py-6 md:gap-8 md:py-8 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:py-[3vh]">
          <div className="relative">
            <div className="animate-in label mb-5 flex items-center gap-2">
              <span aria-hidden="true" className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-accent" />
              </span>
              <span>[ 00 ] · {hero.status}</span>
            </div>
            <h1
              id="hero-heading"
              aria-label={`${hero.heading} ${hero.cycle.join(" ")}`}
              className="display text-[clamp(3rem,min(8.5vw,9.5vh),11rem)] [font-variation-settings:'wght'_250] max-lg:[font-variation-settings:'wght'_420] [@media(hover:none)]:[font-variation-settings:'wght'_420]"
            >
              <SplitChars text={hero.heading} trigger="intro" weight="250,800,300" className="block" />
              <CycleWord words={hero.cycle} className="text-outline-accent" />
            </h1>
          </div>

          <div className="animate-in w-full max-w-sm shrink-0 backdrop-blur-md md:border md:border-line md:bg-ink/95 md:p-5 lg:mb-3 lg:p-[2vh]">
            <p className="text-[15px] leading-relaxed text-paper/80 lg:text-[clamp(13px,1.7vh,16px)]">{hero.intro}</p>
            <div className="mt-5 flex flex-wrap gap-2 sm:gap-3 lg:mt-[2vh] [&_a]:max-sm:px-3.5">
              <Link href="/projects" data-magnetic className="btn-accent">
                See projects
              </Link>
              <Link href={contactHref} data-magnetic className="btn-solid">
                Let&apos;s talk
                <Arrow />
              </Link>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 font-mono text-[11px] tracking-[0.08em] text-paper/60 uppercase lg:mt-[1.6vh] lg:pt-[1.3vh]">
              {hire.prompt}
              <Link href={hire.href} className="group -my-1 inline-flex items-center gap-1.5 py-1 text-accent-text underline-offset-4 hover:underline">
                {hire.label}
                <Arrow className="size-3! transition-transform group-hover:translate-x-0.5" />
              </Link>
            </p>
          </div>
        </div>

        <div className="animate-in shrink-0">
          <div className="mb-4 flex items-stretch gap-6 lg:mb-[1.8vh]">
            <Wordmark />
            {/* Section index, only when the screen is wide enough to leave room beside the wordmark. */}
            <nav aria-label="Sections" className="hidden min-w-[200px] flex-1 flex-col justify-between border-l border-line pl-5 min-[1024px]:[@media(min-aspect-ratio:23/10)]:flex">
              <p className="label flex justify-between">
                <span>Index</span>
                <span>{String(nav.length).padStart(2, "0")}</span>
              </p>
              <ul className="space-y-1">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="group flex items-baseline justify-between gap-3 font-mono text-[12px] tracking-[0.1em] text-paper/70 uppercase transition-colors hover:text-paper">
                      <span className="truncate">
                        <span className="mr-4 text-accent-text">{item.index}</span>
                        {item.label}
                      </span>
                      <Arrow className="size-3! -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3 lg:pt-[1.4vh]">
            <p className="label text-paper/80">{hero.signature}</p>
            <Link href="/#about" className="label -my-1 flex items-center gap-2 py-1 hover:text-paper">
              Scroll
              <Arrow direction="down" className="size-3! animate-bounce text-accent-text" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
