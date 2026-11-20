import { cv } from "./cv";
import { about, education, journey, journeyNote, path, results, services, stack } from "./home";
import { site } from "./site";

/**
 * "Meet the developer". The copy doc has no page of this name, so nothing here
 * is new fact: every sentence about the owner is lifted, unchanged, from copy
 * that is already on the site (the About text, the path, the CV page). What
 * was written for this page is only the furniture: chapter titles, labels and
 * the hint under the portrait. Those are marked "composed" so the owner can
 * reword them freely.
 */

/** The About text is one paragraph on the home page; here each sentence opens a chapter. */
const sentences = (text: string): string[] => text.split(/(?<=\.)\s+/);
const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);
const [trained, drone, masters, dissertation] = sentences(about.lead);
const [axig, , studio] = sentences(about.body);
const [, briefToLaunch] = sentences(path[0].description);

const [home, university, , salford] = journey;
const [founder, developer, researcher] = path;
const [, msc, beng] = education;
const design = services[3];
const designTools = stack[4].tools;

const awards = results.find((result) => result.line.startsWith("awards"));
const pageLoads = results.find((result) => result.line.includes("page loads"));
const swarm = results.find((result) => result.line.includes("drone swarms"));

export interface MeetFact {
  label: string;
  value: string;
}

export interface MeetChapter {
  id: string;
  /** Composed: the side of the owner this chapter shows. */
  title: string;
  /** Where and when, from the journey and the path. */
  kicker: string;
  /** Verbatim sentences from the About text and the path. */
  body: string;
  facts: readonly MeetFact[];
  link?: { href: string; label: string };
}

export const meet = {
  /** Composed. */
  label: "Meet the developer",
  description:
    "Okhare Paul, full-stack engineer and designer in Salford: an electrical engineer who built a delivery drone, researched drone swarms and now runs his own studio.",
  role: site.role,
  tags: site.tags,
  place: site.location.short,
  coords: site.location.coords,
  portrait: {
    alt: "Black and white studio portrait of Okhare Paul in a dark roll-neck, facing the camera.",
    /** Composed. */
    caption: "Portrait",
    /** Composed: the hints under the portrait, for a mouse and for a finger. */
    hintPointer: "Move across the portrait to steer the light",
    hintTouch: "Drag across to steer the light",
    /** Composed: read to a screen reader on the control that moves the light. */
    control: "Direction of the light on the portrait",
    controlHelp: "Left and right arrow keys move the light round. Home and End put it directly behind.",
  },
  /** The whole road in one line (the home page's journey note), before the chapters begin. */
  prologue: { text: journeyNote, kicker: `${home.place} → ${salford.place}` },
  /** Composed. */
  chaptersLabel: "In a different light",
} as const;

export const chapters: readonly MeetChapter[] = [
  {
    id: "engineer",
    title: "The engineer",
    kicker: `${university.place} · ${university.years}`,
    body: `${trained} ${drone}`,
    facts: [
      { label: "Degree", value: beng.credential },
      { label: "At", value: beng.institution },
      { label: "Final project", value: capitalise(beng.topic.replace(/^Final project: /, "")) },
    ],
    link: { href: "/project/delivery-drone", label: "See the drone" },
  },
  {
    id: "researcher",
    title: "The researcher",
    kicker: `${researcher.org} · ${researcher.dates}`,
    body: `${masters} ${dissertation}`,
    facts: [
      { label: "Degree", value: msc.credential },
      { label: "Awards", value: awards ? awards.line.replace(/^awards for the dissertation: /, "").replace(/\.$/, "") : "" },
      { label: "Result", value: swarm ? `${swarm.figure} ${swarm.line}` : "" },
    ],
    link: { href: "/project/swarm-routing", label: "Read the research" },
  },
  {
    id: "developer",
    title: "The developer",
    kicker: `${developer.org} · ${developer.dates}`,
    body: axig,
    facts: [
      { label: "Role", value: developer.title },
      { label: "Result", value: pageLoads ? `${pageLoads.figure} ${pageLoads.line}` : "" },
    ],
    link: { href: "/project/axig", label: "See the AXIG work" },
  },
  {
    id: "founder",
    title: "The founder",
    kicker: `${salford.place} · ${founder.dates}`,
    body: `${studio} ${briefToLaunch}`,
    facts: [
      { label: "Role", value: founder.title },
      { label: "Studio", value: founder.org },
    ],
    link: { href: "/projects", label: "See the projects" },
  },
  {
    id: "designer",
    title: "The designer",
    kicker: design.title,
    body: design.copy,
    facts: [{ label: "Tools", value: designTools.join(" · ") }],
  },
];

/** "How I work": the three strengths from the CV page, unchanged. The heading is composed. */
export const strengths = { heading: "How I work", items: cv.strengths } as const;

/** The interests from the CV page, unchanged. The heading is composed. */
export const interests = { heading: "Off the clock", items: cv.interests } as const;

/** Composed heading; the rows are the home page's profile box. */
export const onPaper = { heading: "On paper", rows: about.profile } as const;
