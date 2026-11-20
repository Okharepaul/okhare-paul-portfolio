import type { ProjectSite } from "@/content/projects";
import { Arrow } from "@/components/ui/primitives";

type SiteLinkProps = {
  site: ProjectSite;
  /** The project's name, read out after the button's words. */
  title: string;
  /** The button class a live link takes; "Coming soon" always takes the quiet one. */
  variant?: "btn-solid" | "btn-ghost" | "btn-accent";
  className?: string;
};

/**
 * The way out to the finished thing: a link that opens the live site in a new
 * tab, or, for work that is not public yet, a button-shaped note that says so.
 */
export function SiteLink({ site, title, variant = "btn-ghost", className = "" }: SiteLinkProps) {
  if (site === "soon") {
    return (
      <span className={`btn-ghost site-soon ${className}`}>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
        Coming soon
        <span className="sr-only">: {title} is not public yet</span>
      </span>
    );
  }
  return (
    <a href={site.href} target="_blank" rel="noopener noreferrer" data-magnetic className={`group/site ${variant} ${className}`}>
      Visit site
      <span className="sr-only">: {title} (opens in a new tab)</span>
      <Arrow direction="up-right" className="size-3! transition-transform duration-300 group-hover/site:translate-x-0.5 group-hover/site:-translate-y-0.5" />
    </a>
  );
}
