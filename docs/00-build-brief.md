# Okhare Paul — Personal Portfolio Website: Build Brief (living doc)

Kept in the project so the build session's decisions sit next to the code.
Source of truth for copy: "Okhare Paul — Website Copy, Page by Page" (17 Nov 2026).

## Status
- First build (17 Nov 2026): reference structure with an original design layer (swarm hero, flight chart, orange band).
- **Rebuild (17 Nov 2026):** Paul asked for the reference (christendijoux.com) matched exactly in design,
  structure, animation and loader, with his own content, as the base to edit from.
- **Edit round 1 (17 Nov 2026):** Paul's first corrections on top of the rebuild. See "Edit round 1" below.
- **Edit round 2 (17 Nov 2026):** the "hire me" button. **Edit round 3 (19 Nov 2026):** project thumbnails
  and screen recordings. **Edit round 4 (19 Nov 2026):** dot hover, the project reel, the home five.
  **Edit round 5 (19 Nov 2026):** the page transition and the project stack, after vanholtz.co.
  **Edit round 6 (19 Nov 2026):** the 3D arrival (first screen only). **Edit round 7 (19 Nov 2026):** Start a
  project, the estimator. **Edit round 8 (19 Nov 2026, current):** Meet the developer, the lit portrait.
  Each has its own section below.

## Run it
- `npm run dev` — dev server (preview entry `okhare-paul`, port 3500).
- `npm run build` then `npx next start -p 3510 -H 0.0.0.0` — production (preview entry `okhare-paul-prod`).
- `npm test` · `npm run lint` · `npm run typecheck`.
- `node scripts/build-land-mask.mjs` — regenerates the globe's land mask (only if the globe data needs changing).
- `node scripts/build-project-media.mjs` — rebuilds the project thumbnails and recordings in `public/projects`
  from the originals (needs ffmpeg). See "Edit round 3".

## How it was matched
Measured from the live reference: layout recipes, type sizes, spacing, timings and easings. Everything is rebuilt in
this repo's own code. No reference code, text, images or shaders were copied; every image here is drawn in code.

### Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · GSAP (ScrollTrigger, CustomEase) · Lenis · raw WebGL.

### Type
Big Shoulders Display (display, variable weight), Geist (body), Geist Mono (labels), all SIL OFL, as on the reference.
Unbounded 900 is used only for the wide hero wordmark (the reference uses a wordmark image there).

### Colour
Two-colour system like the reference: an ink ground and a paper foreground, everything else an opacity of paper.
- Dark: ink #171717, paper #DEDEDE. Light: swapped. The DK | LT switch sits where the reference has its FR | EN switch.
- Orange #F25623 is the single accent. Since edit round 1 it is used more freely: see "Edit round 1".
- #4D4D4D is in the palette but currently unused; hairlines are paper at 12% / 28%.

### Motion (reference timings)
- Loader: boot log + counter 000 → 86 (0.9s), waits for fonts, → 100 (0.5s); contents fly up; panel clips away upwards (1.1s).
- Letters: rise from a mask, 1.15s `expo.out`, 0.022s stagger; hero letters start when the loader lifts.
- Proximity weight: letter weight follows the pointer (hero 250–800, footer name 120–900).
- Hero items: 3D arrival since edit round 6. Blocks: fade up 40px, 0.9s `power4.out` on scroll; on a page's first screen they take the 3D arrival.
- Scroll-lit lead paragraph (0.38 → 1 opacity per word), counters with leading zeros.
- Marquee band driven by scroll velocity (speed, skew, direction).
- Pinned journey globe and pinned horizontal projects track (large screens).
- Page transitions: replaced in edit round 5 (elements leave, the ground closes, the next page opens).
- Custom cursor: dot + lagging reticle, `data-cursor` labels, `data-magnetic` buttons.
- Reduced motion: all of the above switch off and content simply shows.

## Where it still differs from the reference
- **Not built:** the star-hunt easter egg and mini-game, the Konami "negative mode", the chatbot ("Ask Okhare" is
  planned), the cookie banner (this site sets no cookies), the mobile pixel "Read more" expander, and the search and
  language filter on the project index.
- **Content-driven differences:** the hero's second line cycles through four words (the reference has three fixed
  lines); the contact form keeps the extra fields from the copy doc (what you need, budget, timeline); project
  figures are procedural drawings until real screens are supplied.
- **Lab copy** was updated to describe what is on the site now (DitherHero, Journey globe, Cursor, Kinetic type), so
  it no longer matches the copy doc's SwarmField / TraceCursor / RouteLines entries. The swarm lives on in the Lab
  sandbox and the Swarm Routing case study.
- New sentences not in the copy doc: the hero strip line, the journey note, the "Let's talk" contact sub-heading.

## Edit round 1 (17 Nov 2026)
What Paul asked for, and how each was done.
- **Nav spacing:** the number and the label sit 12px apart. (The old gap never applied: the link carried two
  `display` classes.)
- **More orange:** the hero's cycling line is outlined in orange; "See projects" is the orange button (`.btn-accent`);
  "Paul" is orange in the header, the hero info bar, the hero wordmark and the footer name. Also orange: nav and
  section numbers, registration crosses, the marquee stars, result numbers, list numbers, text selection, the Lab
  button, hover states on project cards and the "next project" band.
  - `--accent` is the brand orange for fills and large type. `--accent-text` is for small orange text: the brand
    orange on dark, a deeper #B03A12 on the light theme, because #F25623 on #DEDEDE is only 2.6:1.
- **Globe:** turns on its own, can be dragged (mouse or finger, with momentum), and swings back to follow the route
  whenever scroll moves the traveller. Land around Nigeria and the British Isles, plus a scatter of other dots, is
  orange. The route now starts in **Benin City, Edo** (where Paul is from); the BEng in Ado-Ekiti stays in the copy.
- **Service pictures:** Paul's four images, backgrounds removed (`public/services/*.webp`). The two line-art ones
  (AI head, cloud globe) are stored as a shape only and painted in the foreground colour, so they suit both themes.
  Paul listed the 4th image twice (web and brands); the unused 3rd image (orange figure) was used for brands.
  Paul confirmed the orange figure for brands (17 Nov 2026).
  **Owner still to confirm he holds the rights to these four images before launch.**
- **Dot reveal:** each service picture resolves out of the hero's 9px dots as it scrolls into view (`DotImage`).
- **Selected projects:** figures rest as coarse pixels and resolve on hover/focus, breaking up again on leave
  (`PixelFigure mode="hover"`); on touch screens they resolve while on screen.
- **Dots across the site:** `DotField` puts drifting clusters and scatters of the hero's dots behind the About
  heading, each service picture, Skills, Experience, Results, the Projects intro, the Lab band, Contact and the head
  of every inner page.
- **Experience:** every role lists the skills applied. **Education:** six MSc modules with what each covered.
  The skill lists were written from Paul's dictation and the copy doc; **owner to strike anything that does not apply.**
  "PySkate" in the dictation was taken to mean scikit-learn.
- **Projects (12, Paul's order):** Swarm Routing, Obsiryn, AXIG, Pod, Gilmore, Datum, Jerrie Bones, Nova Adeyemi,
  Mary & Paul, Delivery Drone, Mini Bank, E-commerce App. Home page shows Pod, Nova Adeyemi, Jerrie Bones, Gilmore,
  Obsiryn, and Datum (added 19 Nov 2026 at Paul's request; the footer's project links follow the same list).
  Beeshop and Trading Systems were dropped from the list; Lumora is now Gilmore.
  - Thumbnails: put the file in `public/projects/` and set `thumb` on the entry in `src/content/projects.ts`.
  - The new entries carry one honest line each. Gilmore, Datum and Jerrie Bones are labelled "Studio project" until
    Paul says which are client work.
- **Favicon:** the mark alone, no box: black when the browser is in light mode, light gray in dark mode.
- **Meet the developer:** an orange button under the About text, leading to `/meet-the-developer` (a holding
  page then; built in edit round 8).

## Edit round 2 (17 Nov 2026): the "hire me" button
Paul asked for a button that takes visitors to a "let me build your website / store / app" page, placed at
strategic points first; the page itself comes later. Wording and link live in `hire` in `src/content/site.ts`
(label "Start a project", `/start-a-project`, a holding page that is not indexed and points to the contact form).
Placements:
- Header, right of the nav (screens 1280px and wider) and at the top of the mobile menu.
- Hero card: a line under the two buttons ("A website, store or app to build? Start a project").
- A full-width band (`HireBand`: "Let me build yours") straight after the four services on the home page, under
  the list on the project index, and at the end of every case study before "Next project".
- Contact section, under the intro text. Footer, under the site description.
The label, the band heading and its sentence are new copy, not from the copy doc: owner to edit freely.

## Edit round 3 (19 Nov 2026): project thumbnails and screen recordings
Paul asked for the thumbnails and videos made in his other project chats to be collected, attached to the home
page cards, played on each project page where the picture was, and shown on every row of the full list.
- **Originals:** copied (not moved) from each project's `showcase` folder into
  `Downloads\Project Thumbnails and Videos\<Project>` — Datum, Gilmore, Jerrie Bones, Mary & Paul, Nova Adeyemi,
  Obsiryn, Pod App, Pod Website. 45 files, every size and version that existed.
- **Web copies:** `scripts/build-project-media.mjs` writes three files per project into `public/projects`:
  `<slug>.webp` (thumbnail, 1600px), `<slug>.mp4` (whole recording, 1080p) and `<slug>-preview.mp4` (540p, starts
  after the recorded site's loading screen). 28 MB in all. Where a project had two recordings, the newer
  20-second one (with the cursor) was used. Nova Adeyemi has two thumbnails; the plain portrait is used, the
  helmet "burn" version is in Downloads.
- **Home page cards:** each of the six shows its thumbnail, pixelated at rest and sharp on hover, as before.
- **Project page:** the recording plays in place of the picture: silent, looping, only while on screen, with a
  Play / Pause button and a progress line. It waits to be played when the visitor has reduced motion on. The
  frame is never wider than lets the whole 16:9 recording fit on screen. Phones get the lighter 540p copy.
- **Full list (/projects):** every row has a picture column. With a mouse the clip plays over the thumbnail while
  the row is hovered or focused; on touch screens it plays for five seconds when the row reaches the middle of
  the screen (it starts unasked, so it must stop by itself). One clip runs at a time, nothing downloads until
  it plays, and it stays still with reduced motion or data saving on. Projects with no media yet keep their
  code-drawn plate. Below 1280px the Focus column is hidden, below 1024px the Year column too.
- **Pod is now two entries:** Paul supplied separate media for the app and the website, so "Pod Website" was
  added after "Pod" (13 projects). **Owner to confirm, or say to fold it back into one Pod entry.**
- **Still no media:** Swarm Routing (live demo instead), AXIG (diagrams), Delivery Drone, Mini Bank,
  E-commerce App.
- To add or replace media: put the files in a folder under the originals folder, add a line to `MEDIA` in the
  script, run it, and set `thumb`, `video`, `preview` on the entry in `src/content/projects.ts`.

## Edit round 4 (19 Nov 2026): dot hover, the project reel, the home five
Paul's corrections after seeing round 3. Where this section and round 3 disagree, this one is current.
- **Cursor:** on the light theme the ring round the cursor is the brand orange (2px, not blended; when it grows
  to show a word it fills orange). The dark theme is unchanged.
- **Home page projects:** exactly five, in Paul's order: Pod Website, Nova Adeyemi, Gilmore, Jerrie Bones,
  Mary & Paul. (Pod the app, Obsiryn and Datum left the home page; they are still in the full list.)
- **Hover effect (`DotThumb`):** the coarse pixel blocks are gone. At rest each thumbnail is a halftone on the
  site's 9px dot lattice, in the foreground colour with a few orange dots; the dots draw whichever of the
  picture's tones is rarer, so pale and dark designs both stay mostly open ground. On hover or keyboard focus a
  wave crosses the picture from where the pointer came in: each dot swells into a square of the picture's
  colour, then gives way to the picture. Leaving runs it backwards (0.9s each way). On touch screens it resolves
  while the card is on screen. Pictures are fetched only as they come near the screen.
- **Full list:** E-commerce App removed (12 projects). The education section still mentions the module.
- **Swarm Routing thumbnail:** a still of the live demo on its own project page, taken in the browser
  (`public/projects/swarm-routing.webp`; a PNG copy is in the Downloads folder under "Swarm Routing"). It has no
  recording; the project page still shows the live demo.
- **The project reel (`ProjectReel`):** the rows with a small picture beside the name are replaced. Each project
  is now a large framed picture and its words, in three arrangements taken in turn (picture left, picture right,
  picture centred). As an entry scrolls in, the picture is uncovered from one side and resolves out of dots; it
  drifts slightly against the page; a giant outlined number drifts behind. The title reaches over the edge of
  the picture and stays readable on any picture and either theme (it is drawn in "difference"). Hover or focus
  plays the clip, tints the frame orange and nudges the arrow. On phones the entries stack, the pictures still
  resolve from dots, and the five-second clip rule from round 3 still applies. With reduced motion nothing
  moves and everything is simply shown. Projects with no picture (AXIG, Delivery Drone, Mini Bank) show their
  code-drawn plate in the same frame.
- **Pod stays as two entries** (Paul put "Pod Code Base website" first on the home page).

## Edit round 5 (19 Nov 2026): page transition and project stack, after vanholtz.co
Paul sent vanholtz.co and asked for its page transition exactly, and for the full project list to come out the
way that site's hero titles do, in type that suits this site, with thumbnails on hover only. The reference was
studied for its motion (angles, timings, easing curves, order of events), read from its live styles and measured
in the browser; everything here is this site's own code, text and pictures. Where this section and round 4
disagree about the full list, this one is current.
- **Page transition (`PageTransition`, replaces the rising panel):** on a link to another page, what is on screen
  leaves first, each kind of thing in its own way: pictures settle back to 90% and fade (1s, ease 0.23, 1, 0.32,
  1), headings slide 50px left and fade, lines of text swing shut on their left edge (35 degrees) and fade. The
  ground colour closes over the page in the last half second, the page changes at one second, and the ground
  opens again in half a second while the new page's own entrances play. The header stays where it is throughout.
  A case study's picture has a cover that shrinks away to the top as the page arrives (0.7s after 0.3s) and comes
  back down as it leaves. Reduced motion: links simply navigate.
- **Project stack (`ProjectStack`, replaces the reel from round 4):** the twelve titles as one tall list seen in
  perspective (`perspective: 100vw`, 400vw on phones). Each title is a plane hinged on its right edge and swung 45
  degrees away, right-aligned, with its number and year and an orange slash beside it. Type: Unbounded 900, the
  wide face already used for the hero wordmark, at 9.6vw (7.4vw from 768 to 1320px, 13vw on small phones).
  - Arriving: the whole stage drops in from above (2s) while each title swings open from 100 to 45 degrees,
    bottom title first, top title last (starts spread from 0.2s to 0.9s).
  - Hover or keyboard focus: the title turns to 35 degrees and empties to an outline.
  - Choosing one: it turns face-on as an outline; a quarter second later the others swing shut to 114 degrees and
    fade, bottom first; at 1.25s the chosen title shrinks to 70% and fades; the stage lifts a quarter of the
    screen; the case study arrives at 2s. Measured against the reference, the two logs agree to within a frame.
  - Leaving by any other link: the same cascade in half the time, inside the standard one-second exit.
- **Thumbnails on hover only (`StackPreview`):** nothing shows until a title is hovered or focused. Then its
  picture swings in beside the list, hinged on its left edge to mirror the titles and level with the title that
  called it; it resolves out of the site's dots, and its clip starts once it has. The page's own heading steps
  back while a picture is showing. Large screens only; on phones the list has no pictures.
- **Page head:** the big "Index" title, label and counters now sit in a column pinned beside the stack (above it
  on small screens), so the stack is the first thing on the page.
- `scripts`, media files and the home page are unchanged.

## Edit round 6 (19 Nov 2026): the 3D arrival
Paul liked round 5 and asked for the arriving page to match it: elements should "come up into the screen" from
depth, the way the stack's titles are tilted and swing. The first version applied it to scrolling as well; Paul
corrected that the same day: **3D on arrival only, scrolling exactly as it was before.** What follows is the
corrected state.
- **The pose (`src/lib/entrance.ts`):** an arriving element starts unseen, 140px back in the screen and tilted
  away on one edge. Wide things (a line, a row, a heading) lie back 72 degrees on their bottom edge and stand up.
  Tall or boxy things (pictures, cards) are doors: hinged on the side nearer the edge of the screen, swung 68
  degrees away. Each rises in 1.5s (ease 0.22, 1, 0.36, 1), one after another (0.07s apart, less when many).
- **What gets it (`Motion.tsx`, `arriveAndReveal`):** only what is on the first screen as a page arrives: the
  marked blocks there, every other picture and line of text there (found automatically), the hero's items, and
  first-screen headings, which tip up while their letters rise. After a change of page it waits a third of a
  second, until the ground has opened, so it is seen.
- **Scrolling is as it was before this round:** below the first screen, marked blocks (`.reveal`,
  `data-reveal`) fade up 40px in 0.9s (`power4.out`) as they come into view, headings only have their letters
  rise, and everything else is simply there. Nothing tilts on scroll.
- **Left out on purpose** (`data-enter="none"`): the hero (its items have the same arrival, timed to the loader),
  the journey globe, the marquee band and the project stack, which run their own motion.
- Reduced motion: nothing is tilted or hidden. Print: everything is shown flat.
- Safeguards: the page is kept unseen for the few frames before the poses are set, so a hard reload never shows
  it flat first; a click away mid-arrival finishes the arrival on the spot before the exit starts; and if any of
  the wiring fails, everything is simply shown. Anything inside a Suspense boundary needs `data-enter="none"`
  (the CV's print button has it), because React claims it later than the rest of the page.

## Edit round 7 (19 Nov 2026): Start a project, the estimator
The holding page at `/start-a-project` is now a guided estimate. Asked for by the owner: step by step, first
"what are we building?", then the questions that kind of project needs, ending in an itemised estimate in pounds
that looks like the site, says what each line covers and why it is charged, and sets the running costs apart.

- **Flow (`components/start/QuoteWizard.tsx`):** one question per screen. Six kinds of project (website,
  e-commerce store, web application, AI automation, chatbot, brand & design); each has its own size and feature
  questions, then the shared ones (look, launch, timeline). A receipt beside the questions gains a line with
  every answer and the total counts up. The last answer plays a four-line "building" beat, then the estimate.
- **Motion:** a question's words stand up from their bottom edge and its tiles swing in like doors from the side
  being headed towards (the page-arrival pose, reused); the old question leaves the other way. Tiles lean
  towards the pointer and flood with the foreground colour from the point pressed. Receipt rows slide in and a
  changed price flashes orange. The estimate is uncovered from the top like paper from a printer. Reduced
  motion: none of it; the building beat is skipped.
- **The estimate (`QuoteSheet.tsx`):** the site's inverted band with the logo and "Estimate" + number
  (`OP-EST-YYMM-NNNN`), who it is for (typed by the visitor, optional), every line with "covers" and "why",
  subtotal, priority surcharge, total in the orange block, the 60/40 payment split, the visitor's answers, notes
  and sign-off. "Save as PDF" prints only the sheet, on white. "Send it to Paul" posts the estimate as text to
  the existing contact endpoint; while that is not connected it says so and offers the same text as an email.
- **"Yours to own" (the running-costs panel):** the owner's rule, stated on every estimate inside a dashed orange
  border: the price is for the work; domains, hosting beyond a free plan, payment fees, AI usage and anything
  else that renews or bills by use are paid by the client direct to the provider, in the client's name, with
  nothing added. Which costs are listed depends on the answers.
- **Where the prices come from (`content/quote.ts`):** the owner's invoice OP-2611-0473 is the only price list he
  has issued. Figures marked `INVOICE` are taken from it unchanged (the store's core lines, brand kit £250,
  admin dashboard £350, launch support £250, the 60/40 split). Everything marked `DRAFT` was scaled from those
  by the build session and **needs the owner's confirmation**: all website, web application, automation and
  chatbot figures, the size multipliers, the feature add-ons, signature motion £350, copywriting £200, the £100
  set-up fee, priority +20% and the 30-day validity. The store answers that match the invoice reproduce its
  total less the domain line (£3,525), which a test pins.
- **Not used from the invoice:** the client's name, the referrer's name and the bank details. None of them is on
  the site or in the code.
- **Engine (`lib/quote.ts`, tested):** pure functions. Until a size is chosen a project is priced at its
  smallest, so the running figure starts at the tile's "From" price and only grows. Scaled prices round to £5.
- Phones: the question list collapses to the progress bar, tiles become a list, the action bar is pinned with the
  running figure above the buttons, and each line of the estimate becomes a slip (number and price, then the
  work across the full width). Checked at 1440, 375 and 320 wide, both themes; print checked by applying the
  print rules on screen, not through a real print dialog.

## Edit round 8 (19 Nov 2026): Meet the developer, the lit portrait
The holding page at `/meet-the-developer` is now the real page. Asked for by the owner: the portrait from his
"Hero image replacement sources" chat as the centre of attraction, the "video" of the light going round playing
on load, a hint that the pointer steers the light, the best motion on the site, in the site's own look.

- **Where the portrait comes from:** the owner's own artifact "Light control portrait" (claude.ai, 19 Nov 2026):
  61 photographs of one sitting, 696 x 864, the light 6 degrees further round in each (-180 behind, 0 in front,
  +180 behind again). They are in `public/portrait/f00.webp` to `f60.webp` (converted from the artifact's JPEGs,
  1.7 MB in all). **The chat itself could not be opened** (it needs a claude.ai sign-in in the browser pane), so
  the original video file was not used: the opening "video" is these same frames played in order. **The owner
  confirmed the same day that the frames are the right source.**
- **The interaction (`components/meet/LightPortrait.tsx`, maths in `lib/portrait.ts`, tested):** as in the
  owner's prototype. The pointer's place across the portrait sets the light between -150 and +150 degrees
  (edges behind, centre in front); it follows a hand at rate 5.5 and falls back at 1.6; neighbouring frames are
  cross-faded on a canvas. Added here: on load the light goes once round (6.4s); left alone it falls back behind
  the sitter and then circles slowly (20s a turn, lingering in front); a finger drags it (the page still scrolls
  up and down over the picture); the left and right arrow keys move it and Home/End put it behind (the picture
  is a slider for assistive technology, and holds still while it has keyboard focus); the frame leans a little
  towards the pointer. Phones load every second frame (31) and visitors who ask for less data every third; the
  cross-fade covers the gaps.
- **What shows where the light is:** a small orange lamp on a dashed ring under the bust (it passes behind the
  picture when the light is behind), and a readout above the picture ("Front left -048").
- **One lamp lights everything:** the name is set either side of the portrait, OKHARE tucked over its left edge
  and inverted where it crosses it, PAUL in orange. Each letter is filled as far as the lamp reaches it and is
  an outline otherwise, so with the light behind the sitter the name is an outline like the silhouette.
- **The story (wide screens, motion allowed):** the portrait is pinned. As the page scrolls it slides from the
  middle to the left, the name parts and leaves, and five chapters pass on the right: the engineer, the
  researcher, the developer, the founder, the designer. Each holds the light at its own angle (-108, -66, -30,
  0, +54), so the light comes round the face as the story is read; it glides between chapters. The prologue
  before them (-138) is nearly a silhouette. The picture can still be steered by hand at any point.
- **Phones and tablets:** portrait first (it plays and can be dragged), then the name, then the chapters, each
  with a small still of the portrait lit at its angle. Nothing is pinned.
- **Reduced motion:** the portrait stands lit from the front, pinned on the left on wide screens with the name
  in the right column; it still answers the pointer and the keys, without easing. Nothing plays on its own.
- **Below the story:** "How I work" (the CV's three strengths), "Off the clock" (the CV's interests), "On paper"
  (the CV's profile line, the profile box, the resume buttons), then the hire band.
- **Copy (`content/meet.ts`):** the copy doc has no page of this name. Every sentence about the owner is taken
  unchanged from copy already on the site (About, the path, the CV page). Composed for this page, for the owner
  to reword: the chapter titles, "In a different light", "How I work", "Off the clock", "On paper", the hints
  under the portrait and the page description. The interests were already on the CV page; they are the only
  off-duty facts on the site and nothing was added to them.
- The page is now indexed and in the sitemap; the header's "About" is marked current on it.
- In the markup the heading comes before the portrait, so a keyboard or screen reader meets it first; the
  stylesheet puts the portrait first on phones and lifts the words above the pinned portrait on wide screens.
- **Checked (production build, Chrome):** 1440, 1024, 768, 375 and 320 wide, both themes, no sideways scroll; a
  first visit (with the loader) and arriving by the About button; the scroll hand-off and each chapter's light;
  pointer, touch-style and keyboard steering; reduced motion (simulated); console clean. Lighthouse on a phone
  profile: accessibility 97, best practices 100, SEO 100 (the misses are the header's theme switch and words
  that are dim until scrolled to, both site-wide). 158 tests, typecheck and lint pass; a code review found
  nothing critical and its findings were fixed. **Not checked:** a real phone, Safari or Firefox, a real
  screen reader, and loading speed (Lighthouse performance was not run).

### Round 8, owner's corrections (19 Nov 2026, same day)
Paul liked the page and changed two things. This is the current state and replaces what is said above where they differ.
- **The light at rest:** after the opening pass the light no longer circles and no longer falls back to the
  silhouette. The opening pass brings it from behind, round the left to the front, a little past it (+30) and
  back to rest in front (5.6s). From then on it stays in front and only drifts a little to the left and a little
  to the right (up to 9 degrees: a slow swing with a smaller, quicker one on top), "to make it look like the
  picture is actually alive"; the frame turns a touch with it. Letting go of the portrait returns it to the
  front. Held at a chapter's angle it drifts half as much. Reduced motion: no drift.
- **The ring and lamp:** shown for the opening pass only. They fade as the light settles and are not shown
  again (not while steering, not in the chapters); Paul found them unprofessional as a permanent feature. The
  readout above the picture stays.

### Round 8, second corrections (19 Nov 2026, same day)
Paul changed the light again. **This is the current state** and replaces the first corrections and the original
description where they differ.
- **The name is not lit.** OKHARE and PAUL are solid, in the page's colour and the accent, whatever the light
  does. (OKHARE is still tucked over the picture's edge and inverted where it crosses it; letters still thicken
  near the pointer, as on the home page.) The per-letter lighting was removed from the code.
- **At the top of the page the light circles the portrait continuously** (`LightPortrait`, 9s a turn, lingering
  in front and hurrying round the back), starting from behind as the picture opens. The ring and lamp show for
  the first turn only, then go for good.
- **Once the page is scrolled** (more than 24px) the circling stops and the portrait is simply lit from the
  front: "how it should look like in the end". It keeps a small drift (half of the 9 degrees) so it is not frozen.
- **While the page is moving the light is thrown aside by the scroll** (`scrollSwing` in `lib/portrait.ts`, driven
  from `MeetScene`): right when scrolling down, left when scrolling up, further the faster the scroll (up to
  150 degrees), and back to the front as the page comes to rest. This applies on phones too, while the portrait
  is on screen.
- **Gone with this:** the chapters no longer hold the light at their own angles, so their "Light -108" notes,
  the "keep scrolling" line and the small lit stills on phones were removed. The portrait's caption still names
  the chapter being read, and its number still lights up.
- Reduced motion: unchanged (lit from the front, nothing moves on its own).

### Round 8, third correction (19 Nov 2026): the light must move smoothly
Paul saw the light "tick", worst where it comes from the left to the middle of the face. Cause, measured on
the frames: they are 6 degrees apart on paper but not to the eye. Frames 3 to 8 and 52 to 57 are all but
identical, and frame 8 to 9 changes about twenty times as much; the lighting also turns a corner at frames 8,
15, 30, 45 and 52. Stepping through them evenly stalled, then lurched. Fixed in `lib/portrait.ts` (tested):
- **Even pace to the eye:** the measured change between each pair of frames is built in (`FRAME_CHANGE`), and
  everything that moves the light (circling, steering, the scroll swing, returning to rest) now moves along that
  measure (`travelAtFrame` / `frameAtTravel`), so the picture changes by the same amount every moment.
- **Rounded corners:** the picture drawn is an average over a short stretch either side of the light's place
  (`softBlend`, five samples), so it no longer changes direction abruptly at those frames.
- **No jolts:** the circling comes up to speed over 1.8s whenever it starts; one turn is now about 10s.
- Measured on the frames, before and after: fastest moment 2.4x the average pace down to 1.1x; slowest 0.09x up
  to about 0.8x; sharpest change of direction five times smaller. In Chrome at 60 frames a second, 90% of frames
  are within 0.74x to 1.22x of the average pace.
- If the frames are ever replaced, re-measure `FRAME_CHANGE` (mean absolute difference between neighbours).

## Still open from the first build
- **Meet the developer:** confirm the composed titles and whether "Off the clock" (the CV's interests) stays.
- **Estimator prices:** confirm or replace every `DRAFT` figure in `src/content/quote.ts` before launch.
- Contact form needs `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` (see `.env.example`); until then it
  says it is not connected and offers the email link.
- "Download résumé" opens the print dialog until the final CV PDF is supplied.
- Phone number off; LinkedIn and Upwork hidden until URLs are supplied; GitHub points to github.com/Okharepaul (confirm).
- Case studies 04–12 show the index line and a "being written" note (eight of them now have a recording).
- Privacy policy retention period (12 months) and the hosting provider on the legal notice need confirming.
- Before launch: decide how far the design should move from the reference, since it is another developer's portfolio.

## Working rules (unchanged)
- No invented clients, figures or testimonials. No job applications, personal life or trading returns. Prices
  appear only in the Start a project estimator (round 7, at the owner's request); what a named client paid never does.
- Reduced motion, keyboard focus, mobile down to 320px and Lighthouse 90+ are the floor.

## Edit round 9 (20 Nov 2026): corrections across the site

- **Meet the developer.** The portrait has no box: the frame's border, its corner marks and the dark panel behind the picture are gone, so only the photograph arrives. "Off the clock" now reads: building trading algorithms for the forex market; designing AI algorithms for modern-day problems; researching engineering designs (also on the CV page, which shares the list).
- **Smooth scrolling.** One Lenis instance, softer (`SCROLL_LERP` 0.075, wheel 0.9), in-page links glide, and the keyboard glides too (arrows, Page Up/Down, space, Home, End) instead of jumping. Off under reduced motion. Constants in `src/lib/scroll.ts`.
- **Visit site / Coming soon.** `site` on a project: `{ href }` gives a "Visit site" button (home cards, case-study header and a strip above the hire band); `"soon"` gives a dashed "Coming soon" note. Live: Obsiryn (obsiryn.store), Mary & Paul (maryandpaul.vercel.app). Coming soon: Pod, Pod Website. **Gilmore, Datum, Jerrie Bones and Nova Adeyemi have no public address on record, so they show no button until the owner sends one.**
- **Confidentiality notices.** `notice` on a project prints a boxed note in the case-study header. AXIG: in development, samples private until the client approves. Pod and Pod Website share one wording (`HELD_NOTICE`): product, audience and link withheld; engineering only.
- **Index.** A hovered title is filled with the page colour and outlined (`paint-order: stroke fill`), so only the outside edge of each letter is drawn. The "Index" block and the stack share one grid cell, so the pinned block leaves with the end of the list and no longer rides into "Let me build yours".
- **Case studies.** All 12 are written in full, from each project's own code and documents; figures are quoted only where the project recorded them. Content split into `src/content/projects/{types,products,sites,research}.ts`. Focus is always a technology (Pod: React Native; Datum: TypeScript; Mary & Paul: Next.js; Delivery Drone: Arduino). Mini Bank is 2024. Captions no longer describe the recording; Delivery Drone and Mini Bank have none.

### Still open after round 9
- Public addresses for Gilmore, Datum, Jerrie Bones, Nova Adeyemi.
- **Delivery Drone:** no report or parts list exists on this machine. The story names the kinds of part (frame, motors, speed controllers, flight controller, Arduino, gimbal, battery) but no model. Owner to send the parts list and any figures.
- **Swarm Routing stack** lists only what the notebook imports and runs. No LLM library is in the code, so none is listed; k-means appears as the label-assignment step inside spectral clustering. The results line (30% / 25% / 15%, 2 to 50 drones) is the dissertation's wording; the saved notebook runs cover 2, 3 and 5 drones.
- **Mini Bank** is described from its source: there is no transaction history in the code, so the page does not claim one.
- Pod's recording and thumbnail are still shown. If the hold covers pictures too, remove `thumb`, `video` and `preview` from both Pod entries.

## Edit round 10 (20 Nov 2026): Meet the developer everywhere, the site's own scroll bar

- **Meet the developer link** (`src/components/ui/MeetLink.tsx`, styles in `src/app/meet-link.css`). Owner's call (20 Nov): no picture, nothing that moves on its own, nothing that spells it out; simple and quiet. Words only, as before (card: "Meet the developer", "Okhare Paul", one line; chip: "Meet the developer"), drawn in the reverse of the page's colours (ash on the dark theme, black on the light one) with one small orange square. On hover an orange fill sweeps in from the left, the square turns to a diamond and the arrow leaves through its corner as the next one follows it in. The face is met on the Meet page. Same style on every Meet link, including Home → About. The "Visit site" button in each case study's closing strip is now an outline button, so the Meet button is the one that stands out there.
- **Where it appears.** Every case study: a card at the top beside the header ("Who built …", above any notice) and a chip in the closing strip beside Visit site. Home: a card in the Selected projects intro panel, the existing button in About, and a chip in the footer. Projects index: a card under the Index block. Lab: a chip in the page head. CV: a chip in the toolbar (hidden in print). The footer chip puts it on every page.
- **Scroll bar** (`src/components/shell/ScrollBar.tsx`, `src/app/scrollbar.css`, maths in `src/lib/scrollbar.ts` with tests). The browser's bar is hidden (only while the site's bar is mounted, so without script the ordinary one stays) and replaced by a 3 px orange thumb riding the right-hand line of the frame. It stretches with scroll speed and eases back; while the page moves or the pointer is over it, a scale of ticks draws in (orange for the distance covered) with a "042%" readout beside the thumb. On arrival a light sweeps down the line and the thumb draws in. Mouse: the thumb fattens on hover, drags, and a click on the line glides there. Touch: a gauge only. Reduced motion: no stretch, no animation. High contrast: thumb in the system highlight colour. It is `aria-hidden`; scrolling by keyboard, wheel and touch is unchanged.
- **Cursor word circle** ("View", "Meet", "Pause"…), owner's request 20 Nov: smoked glass in both themes instead of a solid disc (solid orange in the light theme vanished over orange hovers). Blurs what is behind it (`backdrop-filter: blur(4px) saturate(1.5)`), clearest at the rim and a little denser behind the word, with a bright rim and a sheen; the word is pale. In the light theme the plain hover ring is now black instead of orange, for the same reason. Styles in `globals.css` under "Custom cursor".
