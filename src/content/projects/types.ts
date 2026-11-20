export type PlateVariant = "swarm" | "board" | "tiers" | "architecture" | "plain";

/** What kind of work it was, shown beside the year. */
export type ProjectKind =
  | "Research"
  | "Client work"
  | "Own product"
  | "Professional work"
  | "Personal project"
  | "Studio project"
  | "Concept";

export type StackGroup = { group: string; items: readonly string[] };

/** Where the finished thing can be seen: its address, or "soon" for work that is not public yet. */
export type ProjectSite = { href: `https://${string}` } | "soon";

/** A note the page must carry, such as what cannot be shown and why. */
export type ProjectNotice = { title: string; text: string };

export type Project = {
  slug: string;
  title: string;
  /** Short line used on the home page and as the case-study subtitle. */
  subtitle: string;
  /** Index-row line on /projects. */
  tagline: string;
  /** The "Focus" of the case study: a technology or a language. */
  tag: string;
  year: string;
  kind: ProjectKind;
  plate: PlateVariant;
  /** The line under the picture. Left out where there is nothing to say (and no picture to come). */
  figure?: string;
  site?: ProjectSite;
  /** Overrides the status the page would work out from `site`. */
  status?: string;
  notice?: ProjectNotice;
  /** Thumbnail in /public: the home page card, the index row, and the still behind the recording. */
  thumb?: string;
  /** True when the thumbnail is 16:9, not the usual 16:10, so frames that show it whole can match its shape. */
  hasWideThumb?: boolean;
  /** Screen recording in /public, played on the case study where the picture would be. */
  video?: string;
  /** Short, small clip of the same recording: hover previews in the index, and phones. */
  preview?: string;
  summary?: string;
  story?: string;
  does?: readonly string[];
  solved?: readonly string[];
  results?: string;
  stack?: readonly StackGroup[];
  stackNote?: string;
  tags?: readonly string[];
};

/**
 * What the pages of work under a confidentiality hold say in place of a link.
 * One wording, so the two Pod pages cannot drift apart.
 */
export const HELD_NOTICE: ProjectNotice = {
  title: "Under wraps, by agreement",
  text: "This product is still in development and has not launched. At the client's request, what it does, who it is for and the link to it stay private until the client approves a public release. What can be shared is the engineering: the decisions, the stack and the reasons behind them. The rest arrives on launch day.",
};
