/**
 * "Build your stack" on the Start a project page: the shapes every price list uses, the
 * charges more than one kind of project shares, the questions most of them
 * end on, and what the quote says about money it does not include. All money
 * is in pounds sterling. Each kind of project has its own file beside this one.
 *
 * WHERE THE FIGURES COME FROM
 * The owner's first itemised invoice (OP-2611-0473, an e-commerce web
 * application, 13 Nov 2026) is the only price list he has issued. Every figure
 * marked `INVOICE` is taken from it unchanged. Every other figure is DRAFT:
 * scaled from those by the build session to cover the services the invoice did
 * not, and waiting for the owner to confirm or replace.
 *
 * TODO(owner): confirm every DRAFT figure before the site goes live. They are
 * all in this folder; nothing else needs to change.
 */

export type ProjectTypeId = "website" | "store" | "mobile" | "webapp" | "automation" | "chatbot" | "brand";

/** A cost that is not in the quote: the client pays it, direct to whoever provides it. */
export type RunningCostId = "domain" | "hosting" | "payments" | "stores" | "ai" | "messaging" | "apis" | "tools" | "licences";

/** One piece of work with a price. */
export interface Charge {
  title: string;
  /** What the client gets for it. */
  covers: string;
  /** Why it is on the quote at all. */
  why: string;
  price: number;
  /** True when the price grows with the size of the project. */
  scales?: boolean;
}

export interface Option {
  id: string;
  label: string;
  detail: string;
  /** The line this choice adds to the quote. */
  charge?: Charge;
  /** A size: multiplies every charge that `scales`. */
  factor?: number;
  /** A deadline: a percentage added to the whole build. */
  percent?: number;
  /** Running costs this choice brings with it. */
  running?: readonly RunningCostId[];
}

export interface Group {
  /** Unique within a kind of project: the answers are kept by it. */
  id: string;
  /** "single": one answer, and it is needed to continue. "multi": any number, including none. */
  kind: "single" | "multi";
  /** Unique within a kind of project: it labels the answer on the quote. */
  legend: string;
  hint?: string;
  options: readonly Option[];
}

export interface Step {
  id: string;
  /** Short name for the progress bar. */
  label: string;
  /** The question, set very large. */
  title: string;
  lead: string;
  groups: readonly Group[];
}

export interface ProjectType {
  id: ProjectTypeId;
  /** Three or four letters, like the service codes on the home page. */
  code: string;
  label: string;
  detail: string;
  /** The work every project of this kind needs. */
  base: readonly (Charge & { id: string })[];
  /** The questions only this kind of project is asked. */
  steps: readonly Step[];
  /** Which of the shared steps apply, in order, after its own. */
  shared: readonly SharedStepId[];
  running: readonly RunningCostId[];
}

export type SharedStepId = "look" | "launch" | "timeline";

/** An answer that adds one line to the quote, and perhaps a running cost. */
export function addOn(id: string, label: string, detail: string, charge: Charge, running?: readonly RunningCostId[]): Option {
  return running ? { id, label, detail, charge, running } : { id, label, detail, charge };
}

/** The hint on every pick-any question. */
export const PICK_ANY = "Choose any, or none.";

/** The lead on every step of add-ons. */
export const ADDS_A_LINE = "Each one you pick joins your build. Skip what you do not need.";

/* ------------------------------------------------------------------ shared charges */

/** INVOICE line 02. */
export const BRAND_KIT: Charge = {
  title: "Logo & brand kit",
  covers: "A logo, a colour palette, typography and a favicon, delivered as files you own.",
  why: "You do not have a brand yet, and everything else on the build takes its look from this.",
  price: 250,
};

/** INVOICE line 10. */
export const LAUNCH_SUPPORT: Charge = {
  title: "Launch support & handover",
  covers: "30 days of fixes after launch, plus a training session so you can run it yourself.",
  why: "New software meets real users in its first month. This keeps me on hand while it does.",
  price: 250,
};

/** INVOICE line 07, as issued for the store. */
export const ADMIN_DASHBOARD: Charge = {
  title: "Admin dashboard",
  covers: "Manage products, stock, orders and customers in one place.",
  why: "You asked to run the store yourself, day to day.",
  price: 350,
};

/** INVOICE line 06. */
export const PAYMENTS: Charge = {
  title: "Payment integration",
  covers: "Stripe or PayPal secure checkout, receipts and order confirmations.",
  why: "A store has to take money safely. Card details never touch your own server.",
  price: 300,
};

/** The brand question, the same wherever there are screens to dress. */
export const BRAND_GROUP: Group = {
  id: "brand",
  kind: "single",
  legend: "Your brand",
  options: [
    { id: "brand-have", label: "I have a logo and brand", detail: "I work from your logo, colours and fonts." },
    addOn("brand-refresh", "Tidy up what I have", "Clean logo files and a tighter palette.", {
      title: "Brand refresh",
      covers: "Your logo redrawn as clean vector files, with the colour palette and typography tightened for screens.",
      why: "You have a brand, but not the files or rules a build needs to use it well.",
      price: 150,
    }),
    { id: "brand-need", label: "I need a logo and brand", detail: "Designed first, then used across the build.", charge: BRAND_KIT },
  ],
};

/** Design work around the screens, for anything with a screen. `id` names the group and prefixes its options. */
export function designExtras(id: string, darkModePrice: number, prototypeOn: string): Group {
  return {
    id,
    kind: "multi",
    legend: "Design extras",
    hint: PICK_ANY,
    options: [
      addOn(`${id}-illustration`, "Custom illustration & icons", "Drawn for you, not bought from a pack.", {
        title: "Custom illustration & icons",
        covers: "A set of illustrations and a matching icon set drawn in your brand, delivered as files you own.",
        why: "You asked for imagery nobody else has.",
        price: 250,
      }),
      addOn(
        `${id}-imagery`,
        "Image sourcing & art direction",
        "Photos chosen, cropped and graded to match.",
        {
          title: "Image sourcing & art direction",
          covers: "Stock or supplied photography chosen, cropped and colour-matched, with a shot list if you are booking a photographer.",
          why: "You asked for the imagery to be handled, so it looks like one brand and not a collage.",
          price: 150,
        },
        ["licences"],
      ),
      addOn(`${id}-dark`, "Light and dark themes", "Follows the device setting, or a switch.", {
        title: "Light & dark themes",
        covers: "Every screen designed and built in a light and a dark theme, following the device setting, with contrast checked in both.",
        why: "You asked for a dark mode, which is a second design, not an inverted one.",
        price: darkModePrice,
      }),
      addOn(`${id}-prototype`, "Clickable prototype", `Try the key journeys on ${prototypeOn} first.`, {
        title: "Clickable prototype",
        covers: `A clickable prototype of the key journeys to try on ${prototypeOn} and share, before any of it is built.`,
        why: "You asked to feel it before paying for it to be built. Changes here cost minutes, not days.",
        price: 200,
      }),
      addOn(`${id}-testing`, "Usability testing", "Five real people try it; I fix what trips them.", {
        title: "Usability testing",
        covers: "Five people from your audience try the designs, or the prototype if there is one, while I watch; what tripped them up is fixed and written up.",
        why: "You asked for proof that people can use it. Five testers find most of the problems.",
        price: 300,
      }),
    ],
  };
}

/** For services with no screens of their own: the hand-over and the months after. */
export function careStep(prefix: string, setup: { title: string; covers: string }): Step {
  return {
    id: "launch",
    label: "Launch",
    title: "What happens at launch?",
    lead: "Pick what you want me to take care of. Leave out anything you have covered.",
    groups: [
      {
        id: `${prefix}-golive`,
        kind: "multi",
        legend: "Going live",
        hint: PICK_ANY,
        options: [
          addOn(
            `${prefix}-hosting`,
            "Hosting & monitoring setup",
            "Deployed in your name, with alerts if it stops.",
            {
              ...setup,
              why: "You asked me to run it somewhere reliable. The accounts stay yours; what the providers charge is listed under running costs.",
              price: 150,
            },
            ["hosting"],
          ),
          addOn(`${prefix}-support`, "Launch support & handover", "30 days of fixes, plus a training session.", LAUNCH_SUPPORT),
          addOn(`${prefix}-training`, "Team training & runbook", "Your people trained; a written guide for when it needs a hand.", {
            title: "Team training & runbook",
            covers: "A training session for the people who work alongside it, and a written runbook: what it does, what to check, and what to do when it goes wrong.",
            why: "You asked for your team to own it, not to phone me every time it pauses.",
            price: 200,
          }),
        ],
      },
      {
        id: `${prefix}-care`,
        kind: "multi",
        legend: "Aftercare",
        hint: PICK_ANY,
        options: [
          addOn(`${prefix}-aftercare`, "3 months of aftercare", "Tuning, fixes and updates as your tools change.", {
            title: "3 months of aftercare",
            covers: "Three months of tuning instructions, fixing edge cases and updating connections as your tools change, with a monthly report.",
            why: "AI systems drift as the work they see changes. This keeps it accurate after launch.",
            price: 350,
          }),
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ shared steps */

export const sharedSteps: Record<SharedStepId, Step> = {
  look: {
    id: "look",
    label: "Look",
    title: "How should it look?",
    lead: "The brand it wears, how much it moves, and the design work around it.",
    groups: [
      BRAND_GROUP,
      {
        id: "finish",
        kind: "single",
        legend: "The finish",
        options: [
          { id: "finish-clean", label: "Clean and fast", detail: "Clear layout, quick to load, light touches of motion." },
          addOn("finish-motion", "Signature motion", "Page transitions, scroll and hover animation, like this site.", {
            title: "Signature motion",
            covers: "Custom page transitions, scroll-driven animation and hover states, tuned on phones and with reduced motion respected.",
            why: "You asked for a build that moves the way this site does. That is designed and engineered, not switched on.",
            price: 350,
          }),
          addOn("finish-immersive", "Immersive 3D", "A WebGL centrepiece, like this site's hero.", {
            title: "Immersive 3D",
            covers: "A 3D or WebGL centrepiece built in code, plus signature motion throughout, with a still fallback for older phones and reduced motion.",
            why: "You asked for the kind of experience people remember. It is drawn and tuned frame by frame.",
            price: 900,
          }),
        ],
      },
      designExtras("look", 150, "your phone"),
    ],
  },
  launch: {
    id: "launch",
    label: "Launch",
    title: "What happens at launch?",
    lead: "Pick what you want me to take care of. Leave out anything you have covered.",
    groups: [
      {
        id: "golive",
        kind: "multi",
        legend: "Going live",
        hint: PICK_ANY,
        options: [
          addOn(
            "launch-setup",
            "Domain, hosting & SSL setup",
            "Opened in your name, connected and tested. You pay the providers direct.",
            // The invoice's line 09 (£200) also paid for the first 12 months; this is the setup alone.
            {
              title: "Domain, hosting & SSL setup",
              covers: "Accounts opened in your name, then the domain, hosting, SSL certificate and database set up, connected and tested.",
              why: "You asked me to put it online. The accounts stay yours; what the providers charge is listed under running costs.",
              price: 100,
            },
            // Asking for a domain and hosting means there is a domain and hosting to pay for, whatever the project.
            ["domain", "hosting"],
          ),
          addOn(
            "launch-email",
            "Business email",
            "Addresses on your own domain that land in inboxes.",
            {
              title: "Business email",
              covers: "Email addresses on your domain set up with Google Workspace or Microsoft 365, with the records that keep your mail out of spam.",
              why: "You asked to write from your own domain, not a free address.",
              price: 75,
            },
            ["tools"],
          ),
          addOn("launch-migrate", "Move from an old site", "Content moved, old links redirected.", {
            title: "Migration & redirects",
            covers: "Content and data moved across from your old site, and every old address redirected so links and search rankings survive.",
            why: "You are replacing a site that already has visitors and rankings. Losing them is the costly part of a relaunch.",
            price: 200,
          }),
        ],
      },
      {
        id: "content",
        kind: "multi",
        legend: "Words & content",
        hint: PICK_ANY,
        options: [
          addOn("launch-copy", "Words for the pages", "Copy written or edited from your notes.", {
            title: "Copywriting",
            covers: "Headlines and page copy written from your notes, or your own draft edited for the web and for search.",
            why: "You asked for help with the words, so the build does not wait on them.",
            price: 200,
          }),
          addOn("launch-entry", "Content loading", "Pages, products or records loaded for you.", {
            title: "Content loading",
            covers: "Your pages, products or records entered, formatted and checked, so it launches full rather than empty.",
            why: "You asked me to fill it, so launch does not wait on a week of data entry.",
            price: 150,
          }),
          addOn("launch-legal", "Legal pages", "Privacy, terms and cookies, drafted for you.", {
            title: "Legal pages",
            covers: "A privacy policy, terms and a cookie notice drafted for your business from tested templates. A solicitor's read is still advised.",
            why: "UK law expects them on any site that collects data, and visitors look for them before they pay.",
            price: 100,
          }),
        ],
      },
      {
        id: "care",
        kind: "multi",
        legend: "Visibility & care",
        hint: PICK_ANY,
        options: [
          addOn("launch-seo", "Search setup", "Keywords, Search Console and Google Business.", {
            title: "Search setup",
            covers: "Keyword research for your key pages, structured data, Google Search Console and a Google Business Profile, set up and submitted.",
            why: "You asked to be found. The basics are in every build; this is the work that gets you ranked.",
            price: 200,
          }),
          addOn("launch-a11y", "Accessibility audit", "Checked to WCAG 2.2 AA, with a statement.", {
            title: "Accessibility audit",
            covers: "Checked against WCAG 2.2 AA with tools and by hand, with a screen reader and a keyboard; issues fixed and a statement published.",
            why: "You asked for proof it works for everyone. Accessible markup is in every build; the audit is the evidence.",
            price: 150,
          }),
          addOn("launch-support", "Launch support & handover", "30 days of fixes, plus a training session.", LAUNCH_SUPPORT),
          addOn("launch-care", "3 months of aftercare", "Updates, backups, monitoring and small changes.", {
            title: "3 months of aftercare",
            covers: "Updates, backups, uptime monitoring and small content changes for the three months after launch, with a monthly report.",
            why: "You asked for it to be looked after once it is live, so it stays fast, secure and current.",
            price: 300,
          }),
        ],
      },
    ],
  },
  timeline: {
    id: "timeline",
    label: "Timeline",
    title: "When do you need it?",
    lead: "Dates are agreed at a short call. This only says how hard to push, and how it arrives.",
    groups: [
      {
        id: "timeline",
        kind: "single",
        legend: "Pace",
        options: [
          { id: "time-flexible", label: "No fixed date", detail: "Fitted around other work.", percent: 0 },
          { id: "time-standard", label: "A steady schedule", detail: "Milestones agreed at kickoff and kept.", percent: 0 },
          { id: "time-priority", label: "As soon as possible", detail: "Moved ahead of other work, with longer days on it.", percent: 20 },
        ],
      },
      {
        id: "delivery",
        kind: "single",
        legend: "Delivery",
        options: [
          { id: "delivery-once", label: "All at once", detail: "One launch, with everything in it." },
          addOn("delivery-phased", "In phases", "The essentials first, the rest in planned releases.", {
            title: "Phased delivery",
            covers: "A first version with the essentials delivered early, then the rest in planned stages, each checked and handed over.",
            why: "You asked to start using it sooner. Each extra stage is its own round of checks and hand-over.",
            price: 150,
          }),
        ],
      },
    ],
  },
};

/* ------------------------------------------------------------------ what the quote says about money it does not include */

/** In the order they are listed on the quote. */
export const runningCosts: Record<RunningCostId, { title: string; note: string }> = {
  domain: { title: "Domain name", note: "Bought in your name and renewed every year." },
  hosting: {
    title: "Hosting & database",
    note: "Built on free plans wherever your project fits them. If visitors, orders or data outgrow a free plan, the upgrade is yours.",
  },
  payments: { title: "Payment processing", note: "Stripe or PayPal keep their own fee on each sale." },
  stores: {
    title: "App store accounts",
    note: "Apple's developer membership renews every year and Google Play charges once. On digital sales inside the app, the stores keep a commission.",
  },
  ai: { title: "AI model usage", note: "The model provider bills by use, a little for every answer or run." },
  messaging: { title: "Email, SMS & push", note: "Free allowances first. Volume beyond them is billed by the sending service." },
  apis: { title: "Maps & metered services", note: "Maps, location and similar services start free. Heavy use past their allowance is billed by the provider." },
  tools: { title: "Tools you use", note: "Business email, a CRM, a calendar or accounts software: those subscriptions stay yours." },
  licences: { title: "Fonts, stock & printing", note: "A paid font or image licence, or a print run, if you choose one." },
};

/**
 * How the quote explains running costs. The owner's position, in his words
 * from the brief (19 Nov 2026) and the terms on invoice OP-2611-0473: free
 * plans he can manage; anything past them, and anything that renews, is paid
 * by the client, for transparency.
 */
export const runningCostTerms = {
  heading: "Yours to own",
  label: "Not in this figure",
  lead: "My price is for the work. What a provider charges is between you and the provider.",
  points: [
    "I build on free plans wherever your project fits them, and say so when it does not.",
    "Anything that renews or bills by use is paid by you, direct to the provider, at their price. I add nothing to it.",
    "Every account is opened in your name. I set it up, connect it and make sure it works; you hold the keys.",
  ],
  /** Why it is done this way, in the owner's own terms: transparency and good standing with the client. */
  reason: "It keeps things straight between us. You see every cost at its real price, and nothing your business runs on is tied to me.",
} as const;

/** INVOICE: 60% on acceptance, 40% at launch. */
export const paymentTerms = {
  upfront: { percent: 60, label: "On acceptance" },
  completion: { percent: 40, label: "On completion, at launch" },
} as const;
