import type { Project } from "./types";

/**
 * The websites: Gilmore, Datum, Jerrie Bones, Nova Adeyemi and Mary & Paul.
 * Every technical fact is taken from the project's own code or documents
 * (20 Nov 2026); figures are quoted only where the project recorded them.
 *
 * TODO(owner): Gilmore, Datum, Jerrie Bones and Nova Adeyemi have no public
 * address on record. Add `site: { href: "https://…" }` to each once it is
 * known and the "Visit site" buttons appear on their own.
 */

export const gilmore: Project = {
  slug: "gilmore",
  title: "Gilmore",
  subtitle: "A studio website you paint with the cursor",
  tagline: "Animated website for a design and engineering studio",
  tag: "Next.js",
  year: "2026",
  kind: "Studio project",
  plate: "plain",
  figure: "A hero you paint with the cursor, and a globe that needed no map library.",
  thumb: "/projects/gilmore.webp",
  video: "/projects/gilmore.mp4",
  preview: "/projects/gilmore-preview.mp4",
  summary:
    "A website for an independent design and engineering studio, built in Next.js 16 and TypeScript, where the two signature pieces, the hero and the globe, are written by hand on a canvas.",
  story:
    "A studio that sells craft cannot arrive on a template. Gilmore had to prove its point in the first three seconds, so the hero is an interaction and not a picture: move the cursor and a second image bleeds through the first like wet ink, then heals. Further down, a dotted globe shows where the studio works and what time it is there, and you can spin it by hand. I wrote both from scratch on a 2D canvas, with no WebGL and no map library, because the heavy route would have cost more in load time than the effect was worth. Around them sits a quiet system: one scale that adapts to every screen, a loader that waits for the real picture, and motion that steps aside when a visitor asks for less.",
  does: [
    "Reveals a second image under the cursor, in a trail that fades like ink",
    "Spins a dotted globe by hand, with studio cities, local times and arcs between them",
    "Opens with a counting loader that lifts only when the hero picture is ready",
    "Scrolls smoothly, with one lock shared by the menu and the enquiry form",
    "Counts its figures up as they scroll into view",
    "Takes project enquiries through a validated form in a focus-trapped dialog",
    "Scales every measurement from one root size, from 360 pixels to beyond 1920",
  ],
  solved: [
    "Built the reveal on a 2D canvas: the pointer's path is filled in with soft brush stamps and masked against the second image",
    "Tied the fade to real elapsed time, so the trail lasts the same on a 60 Hz laptop and a 120 Hz phone",
    "Read the picture's own position from the page so the canvas layer sits on it to the pixel",
    "Asked for the smallest image that still covers the canvas, and stopped the loop whenever the pointer rests",
    "Baked the world's land into about 2,700 dots at build time, then drew each shade of depth as a single path, so a full turn of the globe costs a handful of draw calls",
    "Redrew the globe only on a drag, a resize or a tick of its clock, never on a timer for its own sake",
    "Held the loader until the largest picture had loaded, with a ceiling so a slow network never traps the visitor",
    "Served pictures as AVIF and WebP at the size they are shown, with the hero fetched first",
    "Made the dialogs properly modal: focus is trapped, Escape closes, and the page behind is inert",
    "Honoured reduced motion everywhere, down to switching the reveal off",
  ],
  stack: [
    { group: "Languages", items: ["TypeScript", "CSS", "HTML"] },
    { group: "Front-end", items: ["Next.js 16 (App Router)", "React 19", "Turbopack", "Server Actions"] },
    { group: "Motion and graphics", items: ["Motion", "Lenis", "Canvas 2D"] },
    { group: "Styling", items: ["Tailwind CSS v4", "Design tokens", "next/font"] },
    { group: "Performance", items: ["next/image (AVIF, WebP)", "Partial prefetching", "Cache Components"] },
    { group: "Tools", items: ["ESLint", "Git", "GitHub"] },
  ],
  tags: ["nextjs", "typescript", "canvas", "motion", "tailwind", "accessibility"],
};

export const datum: Project = {
  slug: "datum",
  title: "Datum",
  subtitle: "One codebase, rebuilt into a different brand",
  tagline: "A studio website rebranded from name to art direction",
  tag: "TypeScript",
  year: "2026",
  kind: "Studio project",
  plate: "plain",
  figure: "Same engine, new identity: ruled, measured and scrubbed by the scroll.",
  thumb: "/projects/datum.webp",
  video: "/projects/datum.mp4",
  preview: "/projects/datum-preview.mp4",
  summary:
    "A complete rebrand carried out in code: an existing studio site turned into Datum, an engineering-led product studio, with a new name, voice, type, colour and motion, following a 31-page brand guide.",
  story:
    "Most rebrands change a logo and a palette. This one had to change how the site behaves. Datum's idea is measurement: set a reference, then build to it. So everything soft in the old site went. Springs became precise, instrument-like movement. The hero's ink trail became a hard-edged inspection lens with a live coordinate readout. The scrollbar became a ruler with a needle. The work section became a pinned stage that the scroll wipes through, one project at a time. I treated it as an engineering job: tokens first, then checks that prove every retired colour and name is gone from the code, then the new pieces, each with a plain fallback for touch, keyboard and reduced motion.",
  does: [
    "Inspects the hero image through a lens that shows the drawing under the render",
    "Replaces the browser's scrollbar with a ruler, a needle and a three-digit readout",
    "Pins the work section and wipes through each project as you scroll",
    "Runs a band of giant type that surges and reverses with scroll speed",
    "Drives its numbers and 40-tick meters straight from scroll position",
    "Brackets whatever the cursor can click with a following reticle",
    "Takes enquiries as numbered work orders",
  ],
  solved: [
    "Moved the whole brand into design tokens, then wrote searches that must come back empty to prove no old value survives",
    "Replaced every spring with two timed curves kept in one motion file, so the site moves like an instrument and no component invents its own timing",
    "Wrote scroll-linked values straight to the page and let React re-render only when the section changes, which keeps the gauge at full frame rate",
    "Flipped the gauge's ink between light and dark by reading the section beneath it",
    "Built the pinned stage from one sticky frame and scroll-linked clip-paths, with the same projects listed plainly for screen readers",
    "Made the animated grid from a fixed number sequence, so the server and the browser draw the identical pattern",
    "Gave the lens a simple toggle for touch, keyboard and reduced-motion visitors, so nobody is locked out of the idea",
    "Drew the placeholder artwork in code and rendered it to files with a script, so it can be rebuilt at any time",
    "Checked every colour pairing for contrast as part of the guide, with bone on graphite at 15.72 to 1",
  ],
  stack: [
    { group: "Languages", items: ["TypeScript", "CSS", "HTML"] },
    { group: "Front-end", items: ["Next.js 16 (App Router)", "React 19", "Turbopack", "Server Actions"] },
    { group: "Motion and graphics", items: ["Motion", "Lenis", "Canvas 2D", "SVG", "CSS clip-path"] },
    { group: "Styling", items: ["Tailwind CSS v4", "Design tokens", "next/font (Geist, Geist Mono, Kinematical)"] },
    { group: "Art pipeline", items: ["Node.js scripts", "Playwright", "SVG to JPEG rendering"] },
    { group: "Tools", items: ["ESLint", "Git", "GitHub"] },
  ],
  tags: ["typescript", "nextjs", "rebrand", "design-tokens", "motion", "accessibility"],
};

export const jerrieBones: Project = {
  slug: "jerrie-bones",
  title: "Jerrie Bones",
  subtitle: "One-page site for a painter and illustrator",
  tagline: "One-page site for a painter and illustrator, with a WebGL hero",
  tag: "WebGL",
  year: "2026",
  kind: "Studio project",
  plate: "plain",
  figure: "Photograph to pencil drawing, in one sweep of a shader.",
  thumb: "/projects/jerrie-bones.webp",
  video: "/projects/jerrie-bones.mp4",
  preview: "/projects/jerrie-bones-preview.mp4",
  summary:
    "A one-page portfolio for a painter, illustrator and draughtsman, where the hero photograph turns into a pencil drawing under your hand. The effect is a shader I wrote in raw WebGL, with no 3D library.",
  story:
    "An artist's site should show the hand at work. The idea came quickly: the artist stands in front of his own name, and when you reach for him, the photograph becomes a drawing. Making it feel drawn was the work. The sweep has a ragged, charcoal edge with a line of gold running through it. The pencil lines shiver slightly, the way hand-drawn animation does. And it only answers when the pointer is on the figure itself, not on the empty box round him. I wrote the shader by hand in GLSL and kept the renderer outside React, so the site ships no 3D library at all. The palette is cream, charcoal and gold, the edges are torn paper, and the gallery pictures ripple like wet ink when you touch them.",
  does: [
    "Turns the hero photograph into a pencil drawing, and back, with a sweep you control",
    "Answers the pointer only on the figure's silhouette",
    "Opens with a pencil line that draws itself while the page loads",
    "Ripples gallery pictures like wet ink on hover",
    "Switches quote and artwork together when you choose a collector",
    "Changes from a wide stage to a tall masthead according to the shape of the screen",
  ],
  solved: [
    "Wrote the sweep as a fragment shader: layered noise gives the front its ragged edge, with a charcoal fringe and a golden core",
    "Re-jittered the drawing six times a second, so the lines boil like a hand-drawn film",
    "Used raw WebGL with one quad and two textures in place of a 3D library, and asked the browser for the low-power graphics chip",
    "Read the cut-out's transparency into a small mask, so hover is tested against the figure and not its rectangle",
    "Made the sweep reversible mid-way, taking time in proportion to how far it had gone",
    "Gave each kind of input its own path: hover on a mouse, an automatic cycle on touch, a labelled button on a keyboard, an instant swap for reduced motion",
    "Fell back to a CSS wipe when WebGL is missing or the graphics context is lost, with the photograph always underneath for the first paint",
    "Paused the render loop off screen and in hidden tabs",
    "Seeded the torn edges, so the server and the browser tear the paper in the same place",
  ],
  results:
    "52 unit tests with coverage held above 80%, and 30 end-to-end runs across desktop and phone. No sideways scroll at any width from 360 to 1920 pixels.",
  stack: [
    { group: "Languages", items: ["TypeScript (strict)", "GLSL", "CSS", "HTML"] },
    { group: "Front-end", items: ["Next.js 16 (App Router)", "React 19", "Turbopack"] },
    { group: "Graphics", items: ["WebGL 1", "Custom fragment shaders", "SVG filters (feTurbulence, feDisplacementMap)"] },
    { group: "Motion", items: ["React Spring", "Lenis"] },
    { group: "Styling", items: ["Tailwind CSS v4", "Design tokens", "next/font (Anton, Onest, Instrument Serif)"] },
    { group: "Testing", items: ["Vitest", "V8 coverage", "Playwright"] },
    { group: "Asset pipeline", items: ["rembg", "Pillow", "sharp", "AVIF and WebP"] },
    { group: "Tools", items: ["ESLint", "Git", "GitHub"] },
  ],
  tags: ["webgl", "glsl", "nextjs", "typescript", "shaders", "portfolio"],
};

export const novaAdeyemi: Project = {
  slug: "nova-adeyemi",
  title: "Nova Adeyemi",
  subtitle: "Concept site for a fictional display pilot",
  tagline: "Concept site for a fictional aerobatic display pilot, with a 3D helmet",
  tag: "Three.js",
  year: "2026",
  kind: "Concept",
  plate: "plain",
  figure: "A helmet modelled in code, and a visor you scroll straight through.",
  thumb: "/projects/nova-adeyemi.webp",
  hasWideThumb: true,
  video: "/projects/nova-adeyemi.mp4",
  preview: "/projects/nova-adeyemi-preview.mp4",
  summary:
    "A design concept: the website of an aerobatic display pilot who does not exist. Nine pages, a 3D helmet built entirely in code, and an animation engine written from scratch.",
  story:
    "I set myself a brief with nowhere to hide: invent a pilot, then build her the site a real one would envy. Everything had to be made. The helmet is not a bought model. I wrote its geometry in code, ray-traced its shadows at build time and compressed it to under 700 KB. The studio lighting is code too. The hero is a portrait whose helmet burns away as you watch, and the cursor paints it back. Scroll on, and the page passes through her visor into the season map, then banks over a horizon into her career. To keep it all light, I wrote the animation engine myself, with one clock and no dependencies, and kept the 3D code out of the first download.",
  does: [
    "Opens on a WebGL portrait whose helmet burns away, and returns under the cursor",
    "Passes through the visor into a dotted world map of a 14-stop tour",
    "Banks over a horizon into a career timeline with moving plates",
    "Lets you turn the full 3D helmet by hand in the Hangar",
    "Offers the next display as a calendar file, and a press kit as a PDF",
    "Runs to nine static pages, from a journal to a store front",
  ],
  solved: [
    "Modelled the helmet in code and compressed it with Draco: 115,476 triangles in a 694 KB file, with shadows ray-traced at build time",
    "Built the studio lights in code and filtered them at run time, so no lighting file is downloaded",
    "Wrote a dependency-free animation engine: one shared clock, springs, tweens, text splitting and scroll triggers",
    "Placed the visor window where the 3D scene projects it, so it lands on her eyes at every screen size",
    "Ran the scroll seams inside the smooth-scroll step itself, which took late frames from 3 in 11 down to none",
    "Rendered the sections on the server and loaded the 3D engine in one small island, so three.js stays out of the first bundle",
    "Graded the picture by device: resolution capped per class, 60 frames a second off desktop, and a still frame for reduced motion or data saver",
    "Prepared the portrait's depth and normal maps on my own machine, so the photograph was never uploaded anywhere",
    "Made zero third-party requests: every font, decoder and script comes from the site's own origin, under a strict content policy",
    "Drew the map from 9,649 land dots on an equal-area projection",
  ],
  results:
    "Lighthouse 100 for accessibility, best practices and SEO on all nine pages, on phone and desktop. Under a throttled mobile connection the home page paints its largest element in 1.94 seconds with no layout shift.",
  stack: [
    { group: "Languages", items: ["TypeScript (strict)", "GLSL", "Python", "CSS", "HTML"] },
    { group: "Front-end", items: ["Next.js 16 (App Router)", "React 19", "Static generation"] },
    {
      group: "3D and graphics",
      items: ["three.js", "Custom GLSL shaders", "MeshPhysicalMaterial", "glTF", "Draco compression", "WebGL"],
    },
    { group: "Motion", items: ["Custom animation engine", "Lenis"] },
    { group: "Styling", items: ["CSS with design tokens", "next/font (Oswald, Space Grotesk)"] },
    { group: "Testing", items: ["Vitest", "jsdom", "V8 coverage", "Playwright"] },
    {
      group: "Asset pipeline",
      items: ["Node.js", "draco3d", "Custom BVH ray tracer", "Pillow", "NumPy", "SciPy", "Shapely", "ONNX Runtime"],
    },
    { group: "Tools", items: ["ESLint", "Git", "GitHub"] },
  ],
  tags: ["threejs", "webgl", "glsl", "nextjs", "typescript", "concept"],
};

export const maryAndPaul: Project = {
  slug: "mary-and-paul",
  title: "Mary & Paul",
  subtitle: "A cinematic wedding website",
  tagline: "A cinematic wedding website with RSVP, guestbook and a WebGL gallery",
  tag: "Next.js",
  year: "2026",
  kind: "Personal project",
  plate: "plain",
  figure: "A curtain lifts. After that, the scroll tells the story.",
  site: { href: "https://maryandpaul.vercel.app" },
  thumb: "/projects/mary-and-paul.webp",
  video: "/projects/mary-and-paul.mp4",
  preview: "/projects/mary-and-paul-preview.mp4",
  summary:
    "My own wedding website: a full-stack Next.js app with a scroll-told story, a WebGL photo wall, RSVP and a guestbook on Supabase, and a private admin ledger for the day itself.",
  story:
    "This is the one project where I was the client, and the hardest to please. It had to feel like the opening of a film and still do a real job: tell guests where to be, take their replies, and keep their messages. So it is two things at once. The front is cinema. A burgundy curtain lifts on a hero that is already composed underneath, the story unfolds as you scroll, and the gallery is a wall of photographs you drag through, drawn in WebGL. The back is a proper application: validated forms, a database that the public key can barely touch, and an admin page where replies are counted and guestbook notes are approved before anyone sees them.",
  does: [
    "Lifts a curtain on the hero, which is already in place beneath it",
    "Counts down live to the ceremony",
    "Tells the couple's story on a timeline driven by the scroll",
    "Opens a drag-to-explore wall of photographs, drawn in WebGL",
    "Takes RSVPs and guestbook notes through validated forms",
    "Shows only the guestbook notes that have been approved",
    "Gives the couple a private ledger to review replies and export them",
    "Switches to a night palette, with its own photograph, before the first paint",
  ],
  solved: [
    "Composed the hero under the loader from the first paint, so the reveal uncovers a finished page and nothing jumps",
    "Wrote the gallery in hand-written WebGL beneath real, focusable buttons, with plain images as the fallback",
    "Kept every database write on the server: forms are validated with Zod inside server actions, and new notes are always saved as unapproved",
    "Locked the database with row-level security, so the public key can read approved notes and nothing more",
    "Signed the admin session with HMAC-SHA256 in an httpOnly cookie, and compared passwords in constant time",
    "Guarded the CSV export against spreadsheet formula injection",
    "Stripped location data from every photograph before upload, then served them from a CDN at the right size",
    "Kept all timing in one motion file, so every animation on the site speaks the same language",
    "Regenerated the home page every 30 seconds, and at once when a note is approved",
    "Raised the reference palette's grey until it passed contrast rules, and wrote a script that re-measures it",
  ],
  results:
    "Live for guests on Vercel. Layout shift recorded at 0.0013, text contrast at 9.73 to 1, and every layout checked from 360 to 1920 pixels.",
  stack: [
    { group: "Languages", items: ["TypeScript", "SQL", "GLSL", "CSS", "HTML"] },
    { group: "Front-end", items: ["Next.js 15 (App Router)", "React 19", "Server Actions", "Incremental static regeneration"] },
    { group: "Motion and graphics", items: ["GSAP", "ScrollTrigger", "SplitText", "Lenis", "Hand-written WebGL"] },
    { group: "Forms and validation", items: ["React Hook Form", "Zod"] },
    { group: "Back-end", items: ["Supabase", "PostgreSQL", "Row-level security", "HMAC-signed sessions"] },
    { group: "Styling", items: ["Tailwind CSS v4", "CSS Modules", "Design tokens", "next/font"] },
    { group: "Media", items: ["ImageKit CDN", "sharp", "Responsive srcset"] },
    { group: "Testing and delivery", items: ["Playwright", "ESLint", "Vercel", "Git", "GitHub"] },
  ],
  tags: ["nextjs", "typescript", "supabase", "gsap", "webgl", "full-stack"],
};
