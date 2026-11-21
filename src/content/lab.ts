/**
 * Lab copy. Each entry describes a component that is actually on the site,
 * and "How" says what the code in this repo does. The list was updated when
 * the site was rebuilt to the reference design, so it differs from the copy
 * doc where a planned component (SwarmField as the hero, TraceCursor,
 * RouteLines) was replaced. Verdicts are written after launch.
 */

export type LabDemo = "dither" | "journey" | "clock" | "counter" | "cursor" | "type" | "theme" | "none";

export type LabComponent = {
  id: string;
  file: string;
  name: string;
  what: string;
  why: string;
  how: string;
  tags: readonly string[];
  demo: LabDemo;
  status: "Live" | "Planned";
};

export const labIntro = {
  heading: "Lab",
  copy: "This page takes the site apart, piece by piece. Each component gets a live demo, why it exists, how it works and an honest verdict. Experiments come after: ideas I haven't put in front of a client yet.",
  verdictPending: "Written after launch, once this part has been lived with.",
} as const;

export const labComponents: readonly LabComponent[] = [
  {
    id: "C—01",
    file: "components/hero/DitherHero.tsx",
    name: "DitherHero",
    what: "The dithered sphere behind the hero. It breathes, swells under the pointer and dissolves as you scroll.",
    why: "An identity made of two colours and one algorithm, with no image to download.",
    how: "Raw WebGL with no 3D library: a single full-screen triangle. A sphere whose surface is displaced by 3D noise is ray-marched, lit from its normal, then reduced to two colours with 8×8 ordered dithering. It pauses when off-screen and draws one still frame with reduced motion.",
    tags: ["WebGL", "GLSL", "Ray marching", "Bayer 8×8"],
    demo: "dither",
    status: "Live",
  },
  {
    id: "C—02",
    file: "components/home/Journey.tsx",
    name: "Journey",
    what: "A pinned scroll section: the route from Benin City to Salford on a dot globe, with a kilometre counter. The globe turns on its own and can be dragged round.",
    why: "My path told as a route, the thing I'm known for.",
    how: "A dot globe on a 2D canvas, built from a 5 KB land mask and projected orthographically. The route is a great-circle arc; scroll progress, pinned with GSAP ScrollTrigger on large screens, moves the traveller and turns the globe. The distance is computed from the coordinates.",
    tags: ["Canvas 2D", "GSAP ScrollTrigger", "Geodesy"],
    demo: "journey",
    status: "Live",
  },
  {
    id: "C—03",
    file: "components/shell/LiveClock.tsx",
    name: "LiveClock",
    what: "The UK clock in the hero's info bar.",
    why: "Tells visitors where I am and when I'll reply.",
    how: "Intl.DateTimeFormat fixed to Europe/London, so it moves between GMT and BST on its own. One timer, aligned to the start of each minute, updates the digits; the colon carries the seconds. Nothing runs in between.",
    tags: ["Intl API", "Timers"],
    demo: "clock",
    status: "Live",
  },
  {
    id: "C—04",
    file: "components/shell/Loader.tsx",
    name: "LoadCounter",
    what: "000 to 100 as the site loads, beside a small boot log, then the panel wipes away.",
    why: "Turns waiting into a moment.",
    how: "A GSAP timeline counts to 86 and waits there until the typefaces have loaded, then finishes at 100. The contents fly up, the panel clips away upwards and the hero's letters start. It plays once per visit and is skipped with reduced motion.",
    tags: ["GSAP", "Preloading", "clip-path"],
    demo: "counter",
    status: "Live",
  },
  {
    id: "C—05",
    file: "components/shell/Cursor.tsx",
    name: "Cursor",
    what: "A dot and a lagging reticle in place of the pointer, with labels and magnetic buttons.",
    why: "Makes navigation feel tactile and gives hints like \"View\" without adding words to the page.",
    how: "Two elements follow the pointer at different speeds with gsap.quickTo. Any element opts in with data-cursor=\"Text\" or data-magnetic. Touch devices and reduced-motion visitors keep the system cursor.",
    tags: ["GSAP quickTo", "Data attributes"],
    demo: "cursor",
    status: "Live",
  },
  {
    id: "C—06",
    file: "components/ui/primitives.tsx · components/shell/Motion.tsx",
    name: "Kinetic type",
    what: "Headings arrive letter by letter, and their weight thickens as the pointer gets closer.",
    why: "Gives the typography depth without images: the text itself is the interactive element.",
    how: "Each heading is split into words and masked letters on the server, and GSAP raises the letters into place. For the weight, the distance from the pointer drives each letter's variable-font weight axis; the loop stops as soon as nothing is moving. The full text stays available to screen readers.",
    tags: ["GSAP", "Variable fonts", "requestAnimationFrame"],
    demo: "type",
    status: "Live",
  },
  {
    id: "C—07",
    file: "components/shell/ThemeToggle.tsx",
    name: "NightShift",
    what: "Light and dark themes with a single switch.",
    why: "Comfort, and it shows craft.",
    how: "The site has two colours, an ink and a paper; the switch swaps them. The View Transitions API opens the new theme as a circle from where you clicked. The choice is saved in your browser and applied before first paint.",
    tags: ["View Transitions API", "CSS"],
    demo: "theme",
    status: "Live",
  },
  {
    id: "C—08",
    file: "Not built yet",
    name: "Ask Okhare",
    what: "A small assistant that answers questions from my CV and projects.",
    why: "Recruiters get answers without reading everything.",
    how: "Planned for the next stage of the build.",
    tags: ["TypeScript", "LLM API"],
    demo: "none",
    status: "Planned",
  },
];

export type LabExperiment = {
  id: string;
  name: string;
  status: "Ongoing" | "Stable" | "Archived";
  what: string;
  tags: readonly string[];
  /** What the figure is waiting for, when there is nothing to show yet. */
  awaiting?: string;
};

export const labExperiments: readonly LabExperiment[] = [
  {
    id: "E—01",
    name: "Swarm sandbox",
    status: "Ongoing",
    what: "The full dissertation demo: add drones, block a point, watch the swarm re-route.",
    tags: ["WebGL", "Reinforcement learning"],
  },
];
