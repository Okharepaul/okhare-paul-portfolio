import { HELD_NOTICE, type Project } from "./types";

/**
 * Products and professional work: Obsiryn, AXIG, Pod and Pod's website.
 * Every technical fact is taken from the project's own code or documents
 * (20 Nov 2026). Pod is under a confidentiality hold: engineering only, no
 * features, names or links.
 */

export const obsiryn: Project = {
  slug: "obsiryn",
  title: "Obsiryn",
  subtitle: "An online store, built from the checkout down",
  tagline: "Online store for digital guides: payments, orders and secure delivery",
  tag: "Stripe",
  year: "2026",
  kind: "Own product",
  plate: "tiers",
  figure: "Black, gold and a crystal that is drawn live. Nothing on the page is a picture file.",
  site: { href: "https://obsiryn.store" },
  thumb: "/projects/obsiryn.webp",
  video: "/projects/obsiryn.mp4",
  preview: "/projects/obsiryn-preview.mp4",
  summary:
    "My own product: an online store that sells PDF guides teaching beginners to build MetaTrader 5 Expert Advisors with an AI agent. I designed it, wrote it and run it.",
  story:
    "I wanted a product that teaches what I do, not one that sells promises. The guides take someone with no coding or trading background to a working, backtested bot, using prompts with an AI agent. But the real build is the store. A digital product needs a checkout that cannot be tricked, an order book that never loses a sale, and a download that only the buyer can open. I wrote all three as serverless functions on Cloudflare, with Stripe for payments and Neon Postgres for orders. The brand is faceless and premium, black and gold, and every visual on the site is drawn in code. It is software education, so the site makes no profit claims.",
  does: [
    "Sells the guide in three plans, with a waitlist for the two still to come",
    "Takes card payments through Stripe's hosted checkout",
    "Records every order in Postgres, one row per sale",
    "Unlocks a private download link the moment payment is confirmed",
    "Lets a buyer recover a lost link with their email and order details",
    "Handles refunds and disputes automatically, so a refunded order stops downloading",
    "Draws 22 live canvas scenes, two of them 3D, with no image or video files",
  ],
  solved: [
    "Designed the guides so an AI agent recognises them on upload and onboards the buyer by plan",
    "Kept prices on the server: the browser sends a plan name and the server looks up what it costs",
    "Fulfilled orders only from Stripe's signed webhook, never from the thank-you page, and verified the signature before reading a byte",
    "Made the webhook safe to repeat: the same event twice writes one order, and a paid order never moves backwards",
    "Guarded each download with a random 256-bit token that expires and counts its uses in a single atomic database update",
    "Gave the live site its own database role with the least access it needs",
    "Drew the visuals in code instead of shipping images, which took the site from about 40 MB to about 1.7 MB",
    "Capped canvas resolution and paused every scene that is off screen, so phones stay smooth",
    "Wrote everything as education, with no profit claims",
  ],
  results:
    "Live at obsiryn.store and taking real orders: about 1.7 MB for the whole site, down from roughly 40 MB with pictures, on an infrastructure bill that starts at zero.",
  stack: [
    { group: "Languages", items: ["JavaScript (ES modules)", "HTML5", "CSS3", "SQL"] },
    {
      group: "Front-end",
      items: ["Vite 6", "GSAP", "ScrollTrigger", "SplitText", "Barba.js", "Lenis", "Swiper", "Canvas 2D"],
    },
    {
      group: "Back-end",
      items: ["Cloudflare Pages Functions", "Stripe Checkout", "Stripe webhooks", "Neon serverless Postgres", "Cloudflare KV"],
    },
    {
      group: "Security",
      items: ["HMAC-SHA256 signature checks", "Content Security Policy", "HSTS", "Least-privilege database role", "Expiring download tokens"],
    },
    { group: "Tools", items: ["Wrangler", "pdf-lib", "Git", "GitHub"] },
  ],
  tags: ["e-commerce", "stripe", "postgres", "serverless", "cloudflare", "javascript"],
};

export const axig: Project = {
  slug: "axig",
  title: "AXIG",
  subtitle: "Three years of production web apps",
  tagline: "Responsive web apps, APIs and cloud delivery for a remote team",
  tag: "TypeScript",
  year: "2023–2026",
  kind: "Professional work",
  plate: "architecture",
  figure: "Architecture in outline. The product itself stays with the client.",
  status: "In development",
  notice: {
    title: "Shown with the client's consent",
    text: "This product is still in development. At the client's request, screens and samples of the work stay private until the client approves them for public view. This page covers what can be shared: my role, the architecture and the results.",
  },
  summary: "From January 2023 to January 2026 I built and shipped responsive web apps for AXIG Limited, working remotely.",
  story:
    "I led end-to-end builds in React, Next.js, TypeScript and Node.js, from the components to the APIs behind them. The biggest win was the data layer: I redesigned the RESTful APIs and page load times dropped by 25%. Releases went out through Docker, AWS and CI/CD pipelines, with code reviews and sprint planning in an agile team.",
  does: [
    "Responsive, mobile-first web apps that work on any device",
    "Reusable component libraries in React and TypeScript",
    "RESTful APIs connecting the interface to backend services",
    "Containerised deployments on AWS",
    "CI/CD pipelines with release and rollback steps",
    "Structured logging and monitoring for live apps",
  ],
  solved: [
    "Redesigned API data flow, cutting page load time by 25%",
    "Built shared components so screens stay consistent",
    "Added structured logging to find faults faster",
    "Used peer code review on every change",
  ],
  stack: [
    { group: "Languages", items: ["TypeScript", "JavaScript (ES6+)", "HTML", "CSS"] },
    { group: "Front-end", items: ["React", "Next.js"] },
    { group: "Back-end", items: ["Node.js", "Express", "RESTful APIs"] },
    { group: "Cloud and delivery", items: ["AWS", "Docker", "CI/CD pipelines"] },
    { group: "Tools", items: ["Git", "GitHub", "Code review", "Agile sprints"] },
  ],
  tags: ["react", "nextjs", "typescript", "nodejs", "aws"],
};

export const pod: Project = {
  slug: "pod",
  title: "Pod",
  subtitle: "A mobile app engineered to stay fast, online or off",
  tagline: "Cross-platform mobile app: 69 screens, offline-first, encrypted on the device",
  tag: "React Native",
  year: "2026",
  kind: "Client work",
  plate: "plain",
  figure: "Motion that runs off the main thread, and data that survives a tunnel.",
  site: "soon",
  notice: HELD_NOTICE,
  thumb: "/projects/pod.webp",
  video: "/projects/pod.mp4",
  preview: "/projects/pod-preview.mp4",
  summary:
    "A cross-platform mobile app for iOS and Android, built in React Native and Expo on a Supabase back end: 69 screens across 13 sprints, written in strict TypeScript.",
  story:
    "A mobile app is judged in its worst moment: a cold start on a mid-range phone, a long list scrolled fast, a message sent as the signal drops. So I engineered for those moments first. The app is one TypeScript codebase for both platforms. Screens never talk to the database directly: they ask a repository, and the repository can be the real back end or a mock, which let me build and test every screen before the server existed. Animation runs off the JavaScript thread, lists recycle their rows, pictures arrive at the size they are shown, and anything written offline is queued, encrypted and sent once when the connection returns.",
  does: [
    "One codebase for iOS and Android, with file-based routing and typed routes",
    "A hand-built component library on a single token theme, in light and dark",
    "Animation and gestures that run on the UI thread",
    "Long lists that recycle their rows, so memory stays flat however far you scroll",
    "An offline cache that keeps the app readable with no connection",
    "A send queue that holds writes made offline and delivers each exactly once",
    "Real-time updates and live audio over WebRTC",
    "A back end where every table is locked by row-level security",
  ],
  solved: [
    "Animated only transform and opacity through Reanimated shared values, so no frame waits on layout or on JavaScript",
    "Drew the launch sequence in Skia as a recorded picture per frame, paused whenever the app is in the background to save battery",
    "Used FlashList with typed rows so a recycled cell always matches its content, which keeps fast scrolling free of blank flashes",
    "Resized every upload on the device into a large and a small copy, and asked lists for the small one: less data, faster first paint",
    "Persisted the query cache for 24 hours and paused reads when offline, so a lost signal shows saved data, not errors",
    "Queued offline writes with a client id the server de-duplicates on, so a retry can never post twice",
    "Sealed the saved cache with XChaCha20-Poly1305, with the key in the phone's keychain",
    "Put the database behind functions: the app calls typed procedures and never touches a table, and paging uses keyset cursors, which stay fast at any depth",
    "Held the splash screen until fonts, session and theme were ready, so the first frame is never the wrong one",
    "Built against a repository interface with mock and live implementations, so screens and tests never depend on the network",
  ],
  results:
    "69 screens built over 13 sprints, backed by 30 database migrations and more than 60 test files, with accessibility labels and reduced-motion handling throughout.",
  stack: [
    { group: "Languages", items: ["TypeScript (strict)", "SQL (PL/pgSQL)"] },
    {
      group: "Mobile",
      items: ["React Native 0.88", "Expo SDK 58", "React 19", "Expo Router", "React Compiler"],
    },
    {
      group: "Motion and graphics",
      items: ["Reanimated 4", "React Native Skia", "react-native-svg", "Expo Haptics"],
    },
    {
      group: "Data",
      items: ["TanStack Query v5", "Persisted query cache", "FlashList", "Expo Image", "Zod"],
    },
    {
      group: "Back-end",
      items: ["Supabase", "PostgreSQL", "Row-level security", "Supabase Realtime", "Supabase Storage", "Deno Edge Functions", "LiveKit (WebRTC)"],
    },
    { group: "Security", items: ["XChaCha20-Poly1305", "Expo SecureStore", "Keychain / Keystore"] },
    {
      group: "Testing and delivery",
      items: ["Jest 30", "React Native Testing Library", "ESLint", "Prettier", "EAS Build", "pnpm"],
    },
  ],
  tags: ["react-native", "expo", "typescript", "supabase", "offline-first", "mobile"],
};

export const podWebsite: Project = {
  slug: "pod-website",
  title: "Pod Website",
  subtitle: "A launch site that ships five dependencies",
  tagline: "Static marketing site for a mobile app: prebuilt, secure and fast",
  tag: "Next.js",
  year: "2026",
  kind: "Client work",
  plate: "plain",
  figure: "Five dependencies, every page built ahead of time.",
  site: "soon",
  notice: HELD_NOTICE,
  thumb: "/projects/pod-website.webp",
  hasWideThumb: true,
  video: "/projects/pod-website.mp4",
  preview: "/projects/pod-website-preview.mp4",
  summary:
    "The website that will launch the Pod app: a fully static Next.js site in strict TypeScript, with hand-written canvas graphics and only five runtime dependencies.",
  story:
    "A launch site has one job: load at once and feel like the product. I kept this one deliberately small. Every page is built ahead of time, so the server has nothing to work out when a visitor arrives. The pages are data: each is a typed record, and one renderer turns a record into sections, which means a new page is content, not code. The motion is real, with smooth scrolling, page transitions and a field of dots drawn on a canvas, but it is written by hand in place of heavy libraries, and it steps aside for anyone who asks for less motion.",
  does: [
    "Prebuilds every page, so there is nothing to render on request",
    "Builds pages from typed content records through one block renderer",
    "Slides between pages with the browser's own View Transitions",
    "Draws its dot field on a 2D canvas, with no WebGL",
    "Shows the app's screens inside the page without their styles leaking out",
    "Sends strict security headers on every response",
  ],
  solved: [
    "Used static generation with unknown addresses refused outright, so the site is as fast as a file and has no server logic to attack",
    "Kept the client small: 13 components render on the server and only 12 ship JavaScript",
    "Self-hosted the fonts, so text paints without a request to a third party",
    "Decided the loader's state in a script that runs before first paint, so the first frame is never wrong",
    "Capped canvas resolution, stopped drawing off screen and in hidden tabs, and held physics to a fixed step",
    "Drove smooth scrolling and scroll-linked animation from one clock, so they cannot fall out of step",
    "Locked the Content Security Policy to the site's own origin, with HSTS and frame protection",
    "Mounted the app-screen mock-ups in a shadow root, so two design systems share a page without colliding",
    "Synced design values by reading the design file as a syntax tree with an allow-list, never by running it",
    "Tested the production build, not the dev server, so the security headers are part of every run",
  ],
  results:
    "Five runtime dependencies in total. 32 end-to-end tests on desktop and phone, and 85 unit tests, all run against the production build.",
  stack: [
    { group: "Languages", items: ["TypeScript (strict)", "CSS", "HTML"] },
    { group: "Front-end", items: ["Next.js 16 (App Router)", "React 19", "React Server Components", "View Transitions API"] },
    { group: "Motion and graphics", items: ["GSAP", "ScrollTrigger", "Lenis", "Canvas 2D"] },
    { group: "Performance", items: ["Static generation", "next/font", "next/image (AVIF, WebP)"] },
    { group: "Security", items: ["Content Security Policy", "HSTS", "Permissions-Policy"] },
    { group: "Testing and tools", items: ["Vitest", "Playwright", "ESLint", "sharp", "acorn"] },
  ],
  tags: ["nextjs", "typescript", "static", "gsap", "canvas", "security"],
};
