"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { contactHref, hire, nav, site } from "@/content/site";
import { Arrow } from "@/components/ui/primitives";
import { ThemeToggle } from "./ThemeToggle";

const DESKTOP_QUERY = "(min-width: 48rem)";

// No `display` here: the name is inline-block, the numbered links are inline-flex (two display
// utilities on one element would fight, and the gap between number and label would be lost).
const linkClass =
  "-my-1 py-1 font-mono text-[12px] tracking-[0.12em] text-paper/80 uppercase transition-colors hover:text-paper focus:outline-none focus-visible:underline";

function isActive(pathname: string, href: string): boolean {
  if (href === "/lab") return pathname.startsWith("/lab");
  // The project list and every case study.
  if (href === "/projects") return pathname.startsWith("/project");
  if (href === "/#about") return pathname.startsWith("/meet-the-developer");
  return false;
}

interface NavItemProps {
  item: (typeof nav)[number];
  isCurrent: boolean;
  showIndex?: boolean;
}

function NavItem({ item, isCurrent, showIndex = true }: NavItemProps) {
  return (
    <li>
      <Link href={item.href} aria-current={isCurrent ? "page" : undefined} className={`${linkClass} group relative inline-flex items-baseline gap-3`}>
        {showIndex ? <span className="text-[10px] text-accent-text tabular-nums">{item.index}</span> : null}
        <span>{item.label}</span>
        <span
          aria-hidden="true"
          className={`absolute -bottom-1.5 left-0 h-px bg-accent transition-all duration-300 group-hover:w-full ${isCurrent ? "w-full" : "w-0"}`}
        />
      </Link>
    </li>
  );
}

export function Header() {
  const pathname = usePathname();
  // Remember which page the menu was opened on: navigating (Back included) closes it without an effect.
  const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null);
  const isMenuOpen = menuOpenedOn === pathname;
  const [first, second] = site.name.split(" ");

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setMenuOpenedOn(null);
    };
    // The menu only exists below the md breakpoint; close it if the window grows past that.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const handleDesktop = (): void => {
      if (desktop.matches) setMenuOpenedOn(null);
    };
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", handleDesktop);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", handleDesktop);
    };
  }, [isMenuOpen]);

  const closeMenu = (): void => setMenuOpenedOn(null);

  return (
    <header className="no-print sticky top-0 z-50 border-b border-line bg-ink/85 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 md:h-16 md:px-10 lg:grid-cols-[1fr_auto_auto_auto_1fr]">
        <Link href="/" onClick={closeMenu} className={`${linkClass} inline-block justify-self-start`}>
          {first}
          <span className="text-paper/55">.</span>
          <span className="text-accent-text">{second}</span>
        </Link>

        <ul className="hidden items-center gap-8 justify-self-end pr-10 lg:flex xl:gap-12 xl:pr-14">
          {nav.slice(0, 2).map((item) => (
            <NavItem key={item.href} item={item} isCurrent={isActive(pathname, item.href)} />
          ))}
        </ul>

        <Link
          href="/"
          onClick={closeMenu}
          aria-label={`${site.name}, home`}
          className="justify-self-center border border-paper/70 px-1.5 pt-1 pb-0.5 font-display text-[18px] leading-none font-semibold tracking-tight text-paper uppercase transition-colors hover:bg-paper hover:text-ink md:text-[20px]"
        >
          OP
        </Link>

        <ul className="hidden items-center gap-8 justify-self-start pl-10 lg:flex xl:gap-12 xl:pl-14">
          {nav.slice(2).map((item) => (
            <NavItem key={item.href} item={item} isCurrent={isActive(pathname, item.href)} />
          ))}
        </ul>

        <div className="flex items-center gap-3 justify-self-end">
          <ul className="hidden items-center gap-5 md:flex lg:hidden">
            {nav.map((item) => (
              <NavItem key={item.href} item={item} isCurrent={isActive(pathname, item.href)} showIndex={false} />
            ))}
          </ul>
          <Link href={hire.href} onClick={closeMenu} className="btn-accent hidden px-3.5! py-2! xl:inline-flex">
            {hire.label}
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="btn-ghost px-3! py-2! md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpenedOn(isMenuOpen ? null : pathname)}
          >
            <span className="menu-label">
              <span aria-hidden={isMenuOpen}>Menu</span>
              <span aria-hidden={!isMenuOpen}>Close</span>
            </span>
          </button>
        </div>
      </nav>

      <div
        id="site-menu"
        data-open={isMenuOpen ? "" : undefined}
        inert={!isMenuOpen}
        className="site-menu fixed inset-x-0 top-14 z-10 h-[calc(100svh-3.5rem)] overflow-y-auto bg-ink px-4 pt-8 pb-8 sm:px-6 md:hidden"
      >
        <div className="site-menu-inner flex min-h-full flex-col justify-between gap-10">
          <ul className="flex flex-col">
            {nav.map((item, index) => (
              <li key={item.href} className="site-menu-row" style={{ "--i": index } as CSSProperties}>
                <Link href={item.href} onClick={closeMenu} className="display flex items-baseline gap-6 py-4 text-6xl">
                  <span className="site-menu-index label text-accent-text">{item.index}</span>
                  <span className="site-menu-mask">
                    <span className="site-menu-word">{item.label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="site-menu-foot flex flex-col gap-4">
            <Link href={hire.href} onClick={closeMenu} className="btn-accent justify-between" style={{ "--j": 0 } as CSSProperties}>
              {hire.label}
              <Arrow />
            </Link>
            <Link href={contactHref} onClick={closeMenu} className="btn-solid justify-between" style={{ "--j": 1 } as CSSProperties}>
              Let&apos;s talk
              <Arrow />
            </Link>
            <p className="label" style={{ "--j": 2 } as CSSProperties}>
              {site.location.full} · {site.location.coords}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
