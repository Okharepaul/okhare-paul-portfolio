import Link from "next/link";
import { Arrow } from "./primitives";

const MEET_HREF = "/meet-the-developer";

type MeetLinkProps = {
  /**
   * "card": the name and a line, for the side of a section.
   * "chip": a button, for rows of other buttons.
   */
  variant?: "card" | "chip";
  /** The small line under the name on the card. */
  line?: string;
  className?: string;
};

/**
 * The way to "Meet the developer". Words only: the face is kept for the page
 * itself. It is drawn in the reverse of the page's colours, so it stands apart
 * without moving; on hover an orange fill sweeps across and the arrow passes
 * through its corner.
 */
export function MeetLink({ variant = "card", line = "The engineer behind the work", className = "" }: MeetLinkProps) {
  const arrow = (
    <span aria-hidden="true" className="meet-arrow">
      <Arrow direction="up-right" className="meet-arrow-out" />
      <Arrow direction="up-right" className="meet-arrow-in" />
    </span>
  );

  if (variant === "chip") {
    return (
      <Link href={MEET_HREF} data-magnetic className={`meet-link meet-chip ${className}`}>
        <span aria-hidden="true" className="meet-mark" />
        Meet the developer
        {arrow}
      </Link>
    );
  }

  return (
    <Link href={MEET_HREF} data-cursor="Meet" className={`meet-link meet-card ${className}`}>
      <span className="min-w-0 flex-1">
        <span className="meet-card-label">
          <span aria-hidden="true" className="meet-mark" />
          Meet the developer
        </span>
        <span className="display meet-card-name">Okhare Paul</span>
        <span className="meet-card-line">{line}</span>
      </span>
      {arrow}
    </Link>
  );
}
