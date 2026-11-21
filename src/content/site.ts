/**
 * Site-wide facts. Copy comes verbatim from "Okhare Paul — Website Copy, Page by Page".
 * Anything marked TODO(owner) is waiting on a fact or asset only the owner has.
 */

export const site = {
  name: "Okhare Paul",
  legalName: "Okhare Paul Ogbomida",
  url: "https://theokharepaul.site",
  title: "Okhare Paul — Full-Stack Engineer, Salford",
  description:
    "Full-stack engineer in Salford, Manchester. I build web apps, AI systems and brands, from the logo to the database.",
  mark: "Portfolio©2026",
  role: "Full-Stack Engineer",
  tags: ["Software", "AI", "Cloud", "Web"],
  location: {
    city: "Salford, Manchester",
    country: "United Kingdom",
    short: "Salford, Manchester, UK",
    full: "Salford, Manchester, United Kingdom",
    coords: "53.49°N · 2.29°W",
    timeZone: "Europe/London",
  },
  // Split so the address never appears whole in the HTML source (spam bots).
  email: { user: "okharepaul247", domain: "gmail.com" },
  // TODO(owner): confirm before the phone number goes public. Left out for now.
  phone: null as string | null,
  // TODO(owner): send LinkedIn and Upwork URLs. Links without a URL are not rendered.
  socials: [
    { label: "LinkedIn", url: "" },
    { label: "GitHub", url: "https://github.com/Okharepaul" },
    { label: "Upwork", url: "" },
  ],
  credits: "Design & code — Okhare Paul · Big Shoulders Display, Geist · Next.js, GSAP, WebGL",
} as const;

/** Same four stops as the home page's section labels. */
export const nav = [
  { index: "01", label: "About", href: "/#about" },
  { index: "02", label: "Projects", href: "/projects" },
  { index: "03", label: "Lab", href: "/lab" },
  { index: "04", label: "Contact", href: "/#contact" },
] as const;

export const contactHref = "/#contact";

/**
 * The "hire me" call to action. Every button and band on the site reads from
 * here, so the wording and the destination change in one place.
 * The page at `href` is "Build your stack"; its questions live in `content/quote`.
 */
export const hire = {
  href: "/start-a-project",
  label: "Start a project",
  /** The short question that leads into the link in tight spots (hero card). */
  prompt: "A website, store or app to build?",
  heading: "Let me build yours",
  copy: "A website, an e-commerce store or an application: send me the project and I take it from brief to launch.",
  kinds: ["Websites", "E-commerce stores", "Applications"],
} as const;

export const activeSocials = site.socials.filter((social) => social.url.length > 0);
