import Link from "next/link";
import { MeetLink } from "@/components/ui/MeetLink";
import { selected } from "@/content/home";
import { getProject, projects } from "@/content/projects";
import { activeSocials, hire, site } from "@/content/site";
import { PixelFigure } from "@/components/art/PixelFigure";
import { Email } from "@/components/ui/Email";
import { Arrow, Monogram } from "@/components/ui/primitives";

const linkClass =
  "-my-1 inline-block py-1 font-mono text-[12px] tracking-[0.08em] text-paper/60 uppercase transition-colors hover:text-paper focus:outline-none focus-visible:underline";

interface ColumnProps {
  index: string;
  title: string;
  children: React.ReactNode;
}

function Column({ index, title, children }: ColumnProps) {
  return (
    <div className="min-w-0 lg:col-span-2">
      <nav aria-label={title} className="flex flex-col">
        <p aria-hidden="true" className="label mb-2 text-accent-text">
          {index}
        </p>
        <h3 className="heading mb-5 text-3xl">{title}</h3>
        <ul className="space-y-3">{children}</ul>
      </nav>
    </div>
  );
}

/** Where the surname begins in the big name, so it can take the accent colour. */
const surnameStart = site.name.indexOf(" ");

export function Footer() {
  const featured = selected.slugs.flatMap((slug) => {
    const found = getProject(slug);
    return found ? [found.project] : [];
  });

  return (
    <footer className="no-print w-full border-t border-line bg-ink text-paper">
      {/* The name, very large, over a ridgeline. Letters thicken near the pointer. */}
      <div className="relative h-[46vw] max-h-[560px] min-h-[260px] overflow-hidden">
        <PixelFigure art="ridge" label="" mode="none" reveal={false} className="absolute! inset-0" canvasClassName="opacity-70" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-ink via-ink/30 to-ink" />
        <p
          aria-hidden="true"
          data-weight="120,900,340"
          className="display absolute inset-x-0 bottom-0 translate-y-[10%] px-2 text-center text-[16vw] whitespace-nowrap select-none [font-variation-settings:'wght'_120] [@media(hover:none)]:[font-variation-settings:'wght'_300]"
        >
          {Array.from(site.name).map((character, i) => (
            <span key={`${character}-${i}`} className={`char transform-none! ${i > surnameStart ? "text-accent" : ""}`}>
              {character === " " ? " " : character}
            </span>
          ))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:gap-12 sm:px-6 md:px-10 lg:grid-cols-12">
        <div className="col-span-2 lg:col-span-4">
          <Monogram className="text-2xl" />
          <p className="mt-5 font-mono text-[12px] tracking-[0.08em] text-paper uppercase">
            {site.role} — {site.location.short}.
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/55">{site.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={hire.href} className="btn-accent">
              {hire.label}
              <Arrow />
            </Link>
            <MeetLink variant="chip" />
          </div>
        </div>

        <Column index="01" title="Projects">
          {featured.map((project) => (
            <li key={project.slug}>
              <Link href={`/project/${project.slug}`} className={linkClass}>
                {project.title}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/projects" className={linkClass}>
              All projects · {projects.length}
            </Link>
          </li>
        </Column>

        <Column index="02" title="Social">
          {activeSocials.map((social) => (
            <li key={social.label}>
              <a href={social.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {social.label} ↗
              </a>
            </li>
          ))}
          <li>
            {/* The address is one long word: let it wrap inside a narrow phone column instead of widening the page. */}
            <Email className={`${linkClass} break-all`} />
          </li>
        </Column>

        <Column index="03" title="Legal">
          <li>
            <Link href="/privacy-policy" className={linkClass}>
              Privacy policy
            </Link>
          </li>
          <li>
            <Link href="/legal-notice" className={linkClass}>
              Legal notice
            </Link>
          </li>
          <li>
            <Link href="/cv" className={linkClass}>
              View résumé
            </Link>
          </li>
        </Column>

        <div className="lg:col-span-2">
          <p aria-hidden="true" className="label mb-2 text-accent-text">
            04
          </p>
          <h3 className="heading mb-5 text-3xl">{site.location.city.split(",")[0]}</h3>
          <p className="font-mono text-[12px] tracking-[0.08em] text-paper/60 uppercase">
            Manchester, UK
            <span className="mt-3 block">{site.location.coords}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-4 border-t border-line px-4 py-6 sm:flex-row sm:items-center sm:px-6 md:px-10">
        <div className="space-y-1">
          <p className="label">© 2026 {site.name}. All rights reserved</p>
          <p className="label text-paper/55">{site.credits}</p>
        </div>
        <a href="#top" className="label group -my-1 flex items-center gap-2 py-1 hover:text-paper focus:outline-none focus-visible:underline">
          Back to top
          <Arrow direction="up" className="size-3! text-accent-text transition-transform group-hover:-translate-y-0.5" />
        </a>
      </div>
    </footer>
  );
}
