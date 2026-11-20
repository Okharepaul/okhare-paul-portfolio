# Okhare Paul — Portfolio

The personal site of **Okhare Paul**, a full-stack engineer in Salford, Manchester, who builds web apps, AI systems and brands, from the logo to the database.

It is a motion-led, two-colour site (ink, paper and a single orange) built with Next.js 16 and React 19. It holds twelve case studies, a "Meet the developer" page with a portrait you can light by hand, a project estimator, a lab of live experiments and a printable CV. Apart from the portrait and the project screens, every visual is drawn in code: there are no stock photos and no illustration packs.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · GSAP + ScrollTrigger · Lenis · raw WebGL & Canvas · Zod · Vitest

---

## What's inside

| Page | What it does |
| --- | --- |
| **Home** (`/`) | WebGL dithered hero and an animated wordmark, a pinned journey globe, a horizontal track of selected work, the about and stack sections, and contact. |
| **Projects** (`/projects`) | The full index: a scroll-driven stack of every entry with outline-on-hover titles, and a pinned index. |
| **Case studies** (`/project/[slug]`) | Twelve case studies: overview, features, approach, results and a stack grouped by layer, plus screen recordings where they exist. Projects under client confidentiality show an engineering-only page with a notice. |
| **Meet the developer** (`/meet-the-developer`) | A portrait built from a sequence of lit frames: the light circles the face and follows the pointer, scroll or keyboard. A short story runs beside it. |
| **Start a project** (`/start-a-project`) | A step-by-step estimator that builds a live quote sheet as you answer. |
| **Lab** (`/lab`) | The site's own components shown on their own, with a swarm sandbox you can play with. |
| **CV** (`/cv`) | A résumé page with a print stylesheet for a clean PDF. |
| Privacy, legal notice, sitemap, robots | The usual. The site sets no cookies. |

## Engineering notes

- **Motion system.** A single Lenis instance with a GSAP ticker drives smooth scrolling, including keyboard scrolling. Every animation is gated behind an `html.motion` class, so visitors who ask for reduced motion get a still, complete page.
- **Custom scroll bar.** The browser's bar is replaced by a thin orange thumb on the frame line. It stretches with scroll speed, shows a progress readout and can be dragged or clicked. The browser's own bar is hidden only once the custom one has mounted.
- **Page transitions.** Elements leave, the ground closes, and the next page opens. Links to a section still land there, and keyboard focus follows the jump.
- **Custom cursor.** A dot with a lagging reticle, and a smoked-glass label circle (`backdrop-filter`) for links that carry `data-cursor`. It is off on touch screens and under reduced motion.
- **Drawn imagery.** Dot fields, pixel figures, the dithered hero and the globe (land mask built from `world-atlas` with `d3-geo`) are all generated in code rather than shipped as image files.
- **Typed content.** All copy lives in `src/content/*` as typed TypeScript, so a project or page is edited in one place and checked by the compiler.
- **Contact API.** `POST /api/contact` validates input with Zod, rejects cross-origin posts, caps the body size, rate-limits by client (5 messages per 10 minutes) and sends through Resend. Without keys, the form says so honestly and points to the email link.
- **Accessibility.** Semantic landmarks, skip link, visible focus states, `aria-current` in the nav, alt text, forced-colours fallbacks, and layouts that hold from 320px to wide screens.

## Getting started

Requirements: **Node.js 20+** and npm.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

### Environment

The contact form is optional. To have it deliver messages, copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | API key from [Resend](https://resend.com). |
| `CONTACT_TO_EMAIL` | Where contact messages are delivered. |
| `CONTACT_FROM_EMAIL` | A sender on a domain verified with Resend. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server. |
| `npm run build` / `npm start` | Production build and server. |
| `npm test` | Unit tests (Vitest). |
| `npm run lint` | ESLint. |
| `npm run typecheck` | TypeScript, no emit. |
| `node scripts/build-project-media.mjs` | Rebuilds project thumbnails and recordings in `public/projects` from the originals (needs ffmpeg). |
| `node scripts/build-land-mask.mjs` | Regenerates the globe's land mask. |

## Project structure

```
src/
  app/          routes, layouts, the contact API and the stylesheets
  components/   home, projects, meet, start, lab, cv, shell (header, footer, cursor,
                scroll bar, transitions), art (dot and pixel drawing), ui
  content/      all copy and project data, typed
  lib/          motion, scrolling, geometry, the estimator, contact validation,
                rate limiting, and their tests
public/         the mark, portrait frames, project thumbnails and recordings
scripts/        media and globe build scripts
docs/           the build brief: design decisions and what changed in each round of edits
```

## Notes

- The design takes its layout and motion timings from reference sites, which are named in `docs/00-build-brief.md`. Everything is rebuilt in this repo's own code: no reference code, text, images or shaders were copied.
- Typefaces: Big Shoulders Display, Geist, Geist Mono and Unbounded, all under the SIL Open Font License, loaded through `next/font`.
- Client work appears only with the client's permission. Some case studies are deliberately limited at a client's request.

## License

© 2026 Okhare Paul. All rights reserved. The code is shared for viewing. Please don't reuse the design, copy or imagery without asking.
