/**
 * The "Start a project" estimator: what can be built, the questions asked
 * about each, and what every answer costs. All money is in pounds sterling.
 *
 * WHERE THE FIGURES COME FROM
 * The owner's first itemised invoice (OP-2611-0473, an e-commerce web
 * application, 13 Nov 2026) is the only price list he has issued. Every figure
 * marked `INVOICE` below is taken from it unchanged. Every figure marked
 * `DRAFT` was scaled from those by the build session to cover the services
 * the invoice did not, and is waiting for the owner to confirm or replace.
 *
 * TODO(owner): confirm every DRAFT figure before the site goes live. They are
 * all in this one file; nothing else needs to change.
 *
 * This file is longer than the project's usual ceiling on purpose: it is the
 * whole price list, and keeping it in one place is what lets the owner check
 * and change every figure without hunting through modules.
 */

export type ProjectTypeId = "website" | "store" | "webapp" | "automation" | "chatbot" | "brand";

/** A cost that is not in the quote: the client pays it, direct to whoever provides it. */
export type RunningCostId = "domain" | "hosting" | "payments" | "ai" | "messaging" | "tools" | "licences";

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
  id: string;
  /** "single": one answer, and it is needed to continue. "multi": any number, including none. */
  kind: "single" | "multi";
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
  /** Which of the shared steps apply, in order. */
  shared: readonly SharedStepId[];
  running: readonly RunningCostId[];
}

export type SharedStepId = "look" | "launch" | "timeline";

/* ------------------------------------------------------------------ shared charges */

/** INVOICE line 02. */
const BRAND_KIT: Charge = {
  title: "Logo & brand kit",
  covers: "A logo, a colour palette, typography and a favicon, delivered as files you own.",
  why: "You do not have a brand yet, and everything else on the build takes its look from this.",
  price: 250,
};

/** INVOICE line 10. */
const LAUNCH_SUPPORT: Charge = {
  title: "Launch support & handover",
  covers: "30 days of fixes after launch, plus a training session so you can run it yourself.",
  why: "New software meets real visitors in its first month. This keeps me on hand while it does.",
  price: 250,
};

/* ------------------------------------------------------------------ shared steps */

export const sharedSteps: Record<SharedStepId, Step> = {
  look: {
    id: "look",
    label: "Look",
    title: "How should it look?",
    lead: "The brand it wears, and how much it moves.",
    groups: [
      {
        id: "brand",
        kind: "single",
        legend: "Your brand",
        options: [
          { id: "brand-have", label: "I have a logo and brand", detail: "I work from your logo, colours and fonts." },
          { id: "brand-need", label: "I need a logo and brand", detail: "Designed first, then used across the build.", charge: BRAND_KIT },
        ],
      },
      {
        id: "finish",
        kind: "single",
        legend: "The finish",
        options: [
          { id: "finish-clean", label: "Clean and fast", detail: "Clear layout, quick to load, light touches of motion." },
          {
            id: "finish-motion",
            label: "Signature motion",
            detail: "Page transitions, scroll and hover animation, like this site.",
            // DRAFT
            charge: {
              title: "Signature motion",
              covers: "Custom page transitions, scroll-driven animation and hover states, tuned on phones and with reduced motion respected.",
              why: "You asked for a build that moves the way this site does. That is designed and engineered, not switched on.",
              price: 350,
            },
          },
        ],
      },
    ],
  },
  launch: {
    id: "launch",
    label: "Launch",
    title: "What happens at launch?",
    lead: "Pick what you want me to take care of. Leave out anything you have covered.",
    groups: [
      {
        id: "launch",
        kind: "multi",
        legend: "Add to the build",
        hint: "Choose any, or none.",
        options: [
          {
            id: "launch-setup",
            label: "Domain, hosting & SSL setup",
            detail: "Opened in your name, connected and tested. You pay the providers direct.",
            // DRAFT. The invoice's line 09 (£200) also paid for the first 12 months; this is the setup alone.
            charge: {
              title: "Domain, hosting & SSL setup",
              covers: "Accounts opened in your name, then the domain, hosting, SSL certificate and database set up, connected and tested.",
              why: "You asked me to put it online. The accounts stay yours; what the providers charge is listed under running costs.",
              price: 100,
            },
            // Asking for a domain and hosting means there is a domain and hosting to pay for, whatever the project.
            running: ["domain", "hosting"],
          },
          { id: "launch-support", label: "Launch support & handover", detail: "30 days of fixes, plus a training session.", charge: LAUNCH_SUPPORT },
          {
            id: "launch-copy",
            label: "Words for the pages",
            detail: "Copy written or edited from your notes.",
            // DRAFT
            charge: {
              title: "Copywriting",
              covers: "Headlines and page copy written from your notes, or your own draft edited for the web.",
              why: "You asked for help with the words, so the build does not wait on them.",
              price: 200,
            },
          },
        ],
      },
    ],
  },
  timeline: {
    id: "timeline",
    label: "Timeline",
    title: "When do you need it?",
    lead: "Dates are agreed at a short call. This only says how hard to push.",
    groups: [
      {
        id: "timeline",
        kind: "single",
        legend: "Pace",
        options: [
          { id: "time-flexible", label: "No fixed date", detail: "Fitted around other work.", percent: 0 },
          { id: "time-standard", label: "A steady schedule", detail: "Milestones agreed at kickoff and kept.", percent: 0 },
          // DRAFT percentage.
          { id: "time-priority", label: "As soon as possible", detail: "Moved ahead of other work, with longer days on it.", percent: 20 },
        ],
      },
    ],
  },
};

/* ------------------------------------------------------------------ what can be built */

export const projectTypes: readonly ProjectType[] = [
  {
    id: "website",
    code: "WEB",
    label: "Website",
    detail: "A marketing site, a portfolio or landing pages.",
    // All DRAFT: the invoice was for a store, so these are its phases scaled down for a brochure site.
    base: [
      {
        id: "discovery",
        title: "Discovery & project scope",
        covers: "A call to pin down the goal, then a sitemap and the content each page needs.",
        why: "It fixes what is being built before any design starts, so the price below holds.",
        price: 100,
      },
      {
        id: "design",
        title: "UI/UX design",
        covers: "Wireframes, then finished designs for every page, on desktop and phone.",
        why: "You see and approve the whole site before it is built.",
        price: 300,
        scales: true,
      },
      {
        id: "build",
        title: "Website development",
        covers: "Every page built responsively in Next.js, fast on any phone, with accessible markup.",
        why: "This is the site itself.",
        price: 500,
        scales: true,
      },
      {
        id: "golive",
        title: "Testing, SEO & go-live",
        covers: "Testing across browsers and phones, SEO basics, speed tuning and deployment.",
        why: "A site that is slow, broken on one phone or invisible to search has not launched.",
        price: 150,
      },
    ],
    steps: [
      {
        id: "scope",
        label: "Scope",
        title: "How big is the site?",
        lead: "Count the distinct pages a visitor can land on.",
        groups: [
          {
            id: "size",
            kind: "single",
            legend: "Pages",
            options: [
              { id: "size-one", label: "One page", detail: "A single scrolling page.", factor: 0.6 },
              { id: "size-small", label: "Up to 5 pages", detail: "Home, about, services, contact.", factor: 1 },
              { id: "size-medium", label: "6 to 12 pages", detail: "Room for case studies or a team.", factor: 1.6 },
              { id: "size-large", label: "More than 12", detail: "A full company site.", factor: 2.2 },
            ],
          },
        ],
      },
      {
        id: "features",
        label: "Features",
        title: "What should it do?",
        lead: "Each one adds a line to the estimate. Skip what you do not need.",
        groups: [
          {
            id: "features",
            kind: "multi",
            legend: "Features",
            hint: "Choose any, or none.",
            // All DRAFT.
            options: [
              {
                id: "web-cms",
                label: "Edit it yourself",
                detail: "A content manager for pages, posts and images.",
                charge: {
                  title: "Content management",
                  covers: "A simple editor for your pages, posts and images, with a blog if you want one.",
                  why: "You asked to change the content yourself, without a developer.",
                  price: 250,
                },
              },
              {
                id: "web-forms",
                label: "Enquiry forms",
                detail: "Messages delivered to your inbox, spam filtered.",
                charge: {
                  title: "Enquiry forms",
                  covers: "Contact and enquiry forms with validation, spam protection and delivery to your inbox.",
                  why: "You asked for visitors to reach you from the site.",
                  price: 75,
                },
                running: ["messaging"],
              },
              {
                id: "web-booking",
                label: "Bookings",
                detail: "Visitors pick a time; you get a calendar entry.",
                charge: {
                  title: "Booking",
                  covers: "A booking flow tied to your calendar, with confirmations and reminders.",
                  why: "You asked for visitors to book without phoning.",
                  price: 200,
                },
                running: ["tools"],
              },
              {
                id: "web-gallery",
                label: "Gallery or portfolio",
                detail: "Filterable work, with a page for each piece.",
                charge: {
                  title: "Gallery",
                  covers: "A filterable gallery with a page for each piece, images sized for every screen.",
                  why: "You asked to show work, which needs more than a page of pictures.",
                  price: 100,
                },
              },
              {
                id: "web-languages",
                label: "More than one language",
                detail: "A language switch and translated routes.",
                charge: {
                  title: "Multi-language",
                  covers: "A language switch, translated routes and the SEO tags search engines need for each language.",
                  why: "You asked for the site in more than one language.",
                  price: 200,
                },
              },
              {
                id: "web-analytics",
                label: "Analytics & consent",
                detail: "Visitor numbers, with a proper cookie choice.",
                charge: {
                  title: "Analytics & consent",
                  covers: "Privacy-respecting analytics and a consent banner that meets UK rules.",
                  why: "You asked to see how the site is used.",
                  price: 75,
                },
              },
            ],
          },
        ],
      },
    ],
    shared: ["look", "launch", "timeline"],
    running: ["domain", "hosting"],
  },
  {
    id: "store",
    code: "SHOP",
    label: "E-commerce store",
    detail: "Browse, order, pay and track deliveries.",
    // All INVOICE: lines 01, 03, 04, 05, 06 and 08.
    base: [
      {
        id: "discovery",
        title: "Discovery & project scope",
        covers: "Requirements workshop, sitemap and user flows.",
        why: "It fixes what is being built before any design starts, so the price below holds.",
        price: 150,
      },
      {
        id: "design",
        title: "UI/UX design",
        covers: "Wireframes and high-fidelity designs for every key page.",
        why: "You see and approve the whole store before it is built.",
        price: 425,
        scales: true,
      },
      {
        id: "frontend",
        title: "Frontend development",
        covers: "Responsive storefront, product catalogue, search, filters, cart and checkout.",
        why: "This is the store your customers see and use.",
        price: 875,
        scales: true,
      },
      {
        id: "backend",
        title: "Backend & database",
        covers: "Products, orders, customer accounts, login, order tracking and emails.",
        why: "It is what remembers every product, customer and order behind the storefront.",
        price: 725,
        scales: true,
      },
      {
        id: "payments",
        title: "Payment integration",
        covers: "Stripe or PayPal secure checkout, receipts and order confirmations.",
        why: "A store has to take money safely. Card details never touch your own server.",
        price: 300,
      },
      {
        id: "golive",
        title: "Testing, SEO & go-live",
        covers: "Quality testing, SEO basics, speed optimisation and deployment.",
        why: "Checkout is tested end to end before a real customer tries it.",
        price: 200,
      },
    ],
    steps: [
      {
        id: "scope",
        label: "Scope",
        title: "How much are you selling?",
        lead: "The size of the catalogue decides how much search, filtering and import work there is.",
        groups: [
          {
            id: "size",
            kind: "single",
            legend: "Catalogue",
            // The first size is the invoice as issued; the larger two are DRAFT.
            options: [
              { id: "size-small", label: "Up to 50 products", detail: "A focused range.", factor: 1 },
              { id: "size-medium", label: "50 to 500", detail: "Categories, filters and bulk import.", factor: 1.15 },
              { id: "size-large", label: "More than 500", detail: "Heavy search and stock handling.", factor: 1.35 },
            ],
          },
        ],
      },
      {
        id: "features",
        label: "Features",
        title: "What else should the store do?",
        lead: "Each one adds a line to the estimate. Skip what you do not need.",
        groups: [
          {
            id: "features",
            kind: "multi",
            legend: "Features",
            hint: "Choose any, or none.",
            options: [
              {
                id: "shop-admin",
                label: "Admin dashboard",
                detail: "Products, stock, orders and customers in one place.",
                // INVOICE line 07.
                charge: {
                  title: "Admin dashboard",
                  covers: "Manage products, stock, orders and customers in one place.",
                  why: "You asked to run the store yourself, day to day.",
                  price: 350,
                },
              },
              // The rest are DRAFT.
              {
                id: "shop-discounts",
                label: "Discount codes",
                detail: "Codes, sales and gift cards.",
                charge: {
                  title: "Discounts & gift cards",
                  covers: "Discount codes, timed sales and gift cards, with the rules enforced at checkout.",
                  why: "You asked to run promotions.",
                  price: 125,
                },
              },
              {
                id: "shop-reviews",
                label: "Product reviews",
                detail: "Ratings from verified buyers.",
                charge: {
                  title: "Product reviews",
                  covers: "Ratings and reviews from verified buyers, with moderation.",
                  why: "You asked for customers to leave reviews.",
                  price: 100,
                },
              },
              {
                id: "shop-delivery",
                label: "Delivery rates & tracking",
                detail: "Rates by region, tracking sent to the buyer.",
                charge: {
                  title: "Delivery rates & tracking",
                  covers: "Delivery prices by region and weight, and tracking updates sent to the buyer.",
                  why: "You asked for delivery to be priced and followed inside the store.",
                  price: 150,
                },
                running: ["messaging"],
              },
              {
                id: "shop-currency",
                label: "More than one currency",
                detail: "Prices shown and charged in the buyer's currency.",
                charge: {
                  title: "Multi-currency",
                  covers: "Prices shown and charged in the buyer's currency, with rates kept current.",
                  why: "You asked to sell across borders.",
                  price: 150,
                },
              },
              {
                id: "shop-subscriptions",
                label: "Subscriptions",
                detail: "Repeat orders billed on a schedule.",
                charge: {
                  title: "Subscriptions",
                  covers: "Repeat orders billed on a schedule, with pause, skip and cancel for the customer.",
                  why: "You asked to sell on subscription.",
                  price: 250,
                },
              },
            ],
          },
        ],
      },
    ],
    shared: ["look", "launch", "timeline"],
    running: ["domain", "hosting", "payments", "messaging"],
  },
  {
    id: "webapp",
    code: "APP",
    label: "Web application",
    detail: "A dashboard, a portal, a booking system, a product.",
    // All DRAFT: the invoice's phases, weighted for software with more logic than a store.
    base: [
      {
        id: "discovery",
        title: "Discovery & project scope",
        covers: "Requirements workshop, user roles, user flows and a written scope.",
        why: "It fixes what is being built before any design starts, so the price below holds.",
        price: 200,
      },
      {
        id: "design",
        title: "UI/UX design",
        covers: "Wireframes and high-fidelity designs for every key screen.",
        why: "You see and approve every screen before it is built.",
        price: 500,
        scales: true,
      },
      {
        id: "frontend",
        title: "Frontend development",
        covers: "Every screen built responsively in React and Next.js, with forms, tables and states handled.",
        why: "This is the application people use.",
        price: 950,
        scales: true,
      },
      {
        id: "backend",
        title: "Backend & database",
        covers: "The data model, the API behind every screen, validation and security rules.",
        why: "It is what stores the work your users do and keeps one user's data from another's.",
        price: 850,
        scales: true,
      },
      {
        id: "golive",
        title: "Testing & go-live",
        covers: "Automated and manual testing, speed tuning and deployment with a way to roll back.",
        why: "Software your business runs on is tested before your business runs on it.",
        price: 250,
      },
    ],
    steps: [
      {
        id: "scope",
        label: "Scope",
        title: "How big is the application?",
        lead: "Count the distinct screens: a list, a form and a detail view are three.",
        groups: [
          {
            id: "size",
            kind: "single",
            legend: "Screens",
            options: [
              { id: "size-small", label: "Up to 5 screens", detail: "One job done well.", factor: 0.7 },
              { id: "size-medium", label: "6 to 12 screens", detail: "A few connected jobs.", factor: 1 },
              { id: "size-large", label: "13 to 25 screens", detail: "A full product.", factor: 1.5 },
              { id: "size-xl", label: "More than 25", detail: "Several products in one.", factor: 2.1 },
            ],
          },
        ],
      },
      {
        id: "features",
        label: "Features",
        title: "Which systems go in it?",
        lead: "Each one adds a line to the estimate. Skip what you do not need.",
        groups: [
          {
            id: "features",
            kind: "multi",
            legend: "Systems",
            hint: "Choose any, or none.",
            options: [
              // DRAFT
              {
                id: "app-accounts",
                label: "Accounts & roles",
                detail: "Sign-up, login and who may do what.",
                charge: {
                  title: "Accounts & roles",
                  covers: "Sign-up, login, password reset and roles that decide who may see and do what.",
                  why: "You asked for people to sign in, and for some of them to have more access than others.",
                  price: 250,
                },
              },
              // INVOICE line 06.
              {
                id: "app-payments",
                label: "Payments",
                detail: "One-off payments or subscriptions.",
                charge: {
                  title: "Payment integration",
                  covers: "Stripe or PayPal secure checkout, receipts and confirmations.",
                  why: "You asked to take money inside the application.",
                  price: 300,
                },
                running: ["payments"],
              },
              // INVOICE line 07.
              {
                id: "app-admin",
                label: "Admin dashboard",
                detail: "See and manage everything in one place.",
                charge: {
                  title: "Admin dashboard",
                  covers: "A back office to see and manage users, records and settings in one place.",
                  why: "You asked to run it yourself, day to day.",
                  price: 350,
                },
              },
              // The rest are DRAFT.
              {
                id: "app-reports",
                label: "Reports & charts",
                detail: "Your numbers, drawn clearly, with export.",
                charge: {
                  title: "Reports & charts",
                  covers: "Charts and tables of your own numbers, with filters and export.",
                  why: "You asked to see what is happening inside the application.",
                  price: 250,
                },
              },
              {
                id: "app-files",
                label: "File uploads",
                detail: "Documents and images, stored safely.",
                charge: {
                  title: "File uploads",
                  covers: "Uploads for documents and images, checked, stored and served securely.",
                  why: "You asked for users to attach files.",
                  price: 150,
                },
              },
              {
                id: "app-notify",
                label: "Emails & notifications",
                detail: "Sent when something needs attention.",
                charge: {
                  title: "Emails & notifications",
                  covers: "Emails and in-app notifications sent when something needs a person's attention.",
                  why: "You asked for the application to tell people when to act.",
                  price: 125,
                },
                running: ["messaging"],
              },
              {
                id: "app-live",
                label: "Live updates or chat",
                detail: "Changes appear without a refresh.",
                charge: {
                  title: "Live updates",
                  covers: "Changes that appear for everyone without a refresh, or a chat between users.",
                  why: "You asked for it to work in real time.",
                  price: 300,
                },
              },
              {
                id: "app-integration",
                label: "Connect another system",
                detail: "Your CRM, accounts or calendar.",
                charge: {
                  title: "System integration",
                  covers: "A tested connection to one outside system, such as your CRM, accounts or calendar.",
                  why: "You asked for it to share data with a tool you already use.",
                  price: 200,
                },
                running: ["tools"],
              },
              {
                id: "app-ai",
                label: "An AI assistant inside",
                detail: "Answers and drafts from your own data.",
                charge: {
                  title: "AI assistant",
                  covers: "An assistant inside the application that answers and drafts from your own data, with limits on what it may do.",
                  why: "You asked for AI in the product, wired to real data.",
                  price: 400,
                },
                running: ["ai"],
              },
            ],
          },
        ],
      },
    ],
    shared: ["look", "launch", "timeline"],
    running: ["domain", "hosting"],
  },
  {
    id: "automation",
    code: "AI",
    label: "AI automation",
    detail: "Repeat work handed to a system that does it.",
    // All DRAFT.
    base: [
      {
        id: "discovery",
        title: "Process mapping",
        covers: "A walk through how the work is done today, and a written choice of what to automate first.",
        why: "Automating the wrong step saves nothing. This finds the step worth the money.",
        price: 200,
      },
      {
        id: "design",
        title: "Workflow design",
        covers: "Each workflow drawn step by step: what triggers it, what it reads, what it decides and what it writes.",
        why: "You approve what the system will do before it is allowed to do it.",
        price: 300,
        scales: true,
      },
      {
        id: "build",
        title: "Automation build",
        covers: "The workflows built, with error handling, retries and a record of every run.",
        why: "This is the system that does the work.",
        price: 550,
        scales: true,
      },
      {
        id: "golive",
        title: "Testing & evaluation",
        covers: "Runs against real examples of your work, measured, then switched on in stages.",
        why: "An automation is trusted with real work only after it has been checked against real work.",
        price: 200,
      },
    ],
    steps: [
      {
        id: "scope",
        label: "Scope",
        title: "How much should it take over?",
        lead: "One workflow is one job from start to finish, such as turning an email into a filed order.",
        groups: [
          {
            id: "size",
            kind: "single",
            legend: "Workflows",
            options: [
              { id: "size-small", label: "One workflow", detail: "The job that eats the most time.", factor: 1 },
              { id: "size-medium", label: "2 to 3 workflows", detail: "A linked set of jobs.", factor: 1.8 },
              { id: "size-large", label: "4 or more", detail: "A department's routine.", factor: 2.8 },
            ],
          },
        ],
      },
      {
        id: "features",
        label: "Features",
        title: "What should it work with?",
        lead: "Each one adds a line to the estimate. Skip what you do not need.",
        groups: [
          {
            id: "features",
            kind: "multi",
            legend: "Systems",
            hint: "Choose any, or none.",
            options: [
              {
                id: "ai-tools",
                label: "Your existing tools",
                detail: "Email, spreadsheets, CRM, calendar.",
                charge: {
                  title: "Tool connections",
                  covers: "Tested connections to the tools you already use, such as email, spreadsheets, a CRM or a calendar.",
                  why: "You asked for it to work inside the tools you have, not beside them.",
                  price: 200,
                },
                running: ["tools"],
              },
              {
                id: "ai-documents",
                label: "Reading documents",
                detail: "PDFs, invoices and forms turned into data.",
                charge: {
                  title: "Document reading",
                  covers: "PDFs, invoices and forms read and turned into clean, checked data.",
                  why: "You asked for it to work from documents people send you.",
                  price: 300,
                },
              },
              {
                id: "ai-knowledge",
                label: "Your own knowledge",
                detail: "Answers drawn from your files and policies.",
                charge: {
                  title: "Knowledge base",
                  covers: "Your files and policies indexed so the system answers from them and shows its source.",
                  why: "You asked for answers grounded in your own material.",
                  price: 350,
                },
              },
              {
                id: "ai-approval",
                label: "A person approves",
                detail: "It drafts; someone signs off.",
                charge: {
                  title: "Approval step",
                  covers: "A review queue where a person approves, edits or rejects before anything is sent or changed.",
                  why: "You asked to keep a person in charge of the decisions that matter.",
                  price: 200,
                },
              },
              {
                id: "ai-dashboard",
                label: "Dashboard & logs",
                detail: "What ran, what it did, what it saved.",
                charge: {
                  title: "Dashboard & logs",
                  covers: "A dashboard of what ran, what it did and how long it saved, with a searchable log.",
                  why: "You asked to see what the system is doing.",
                  price: 300,
                },
              },
              {
                id: "ai-schedule",
                label: "Schedules & alerts",
                detail: "Runs on time and tells you when it cannot.",
                charge: {
                  title: "Schedules & alerts",
                  covers: "Timed runs, and an alert to you when a run fails or needs a decision.",
                  why: "You asked for it to run without being started by hand.",
                  price: 100,
                },
                running: ["messaging"],
              },
            ],
          },
        ],
      },
    ],
    shared: ["launch", "timeline"],
    running: ["ai", "hosting"],
  },
  {
    id: "chatbot",
    code: "BOT",
    label: "Chatbot",
    detail: "An assistant that answers for you, day and night.",
    // All DRAFT.
    base: [
      {
        id: "discovery",
        title: "Discovery & project scope",
        covers: "The questions it must answer, the ones it must never answer, and the tone it speaks in.",
        why: "It fixes what the assistant is for before it says a word to a customer.",
        price: 150,
      },
      {
        id: "design",
        title: "Conversation design",
        covers: "The assistant's instructions, its fallbacks and what it does when it does not know.",
        why: "A good assistant is written, not left to chance.",
        price: 250,
        scales: true,
      },
      {
        id: "build",
        title: "Chatbot build",
        covers: "The assistant built and placed on your website as a chat window matched to your brand.",
        why: "This is the assistant itself, and the window your visitors talk to.",
        price: 500,
        scales: true,
      },
      {
        id: "golive",
        title: "Testing & evaluation",
        covers: "Tested against real questions, awkward ones included, before it goes in front of customers.",
        why: "Wrong answers given in your name cost more than this line.",
        price: 150,
      },
    ],
    steps: [
      {
        id: "scope",
        label: "Scope",
        title: "What should it be able to do?",
        lead: "Start with the simplest one that solves the problem.",
        groups: [
          {
            id: "size",
            kind: "single",
            legend: "Ability",
            options: [
              { id: "size-small", label: "Answer common questions", detail: "Hours, prices, how things work.", factor: 0.8 },
              { id: "size-medium", label: "Answer from your documents", detail: "Policies, manuals, a product range.", factor: 1.2 },
              { id: "size-large", label: "Take actions", detail: "Bookings, order lookups, quotes.", factor: 1.7 },
            ],
          },
        ],
      },
      {
        id: "features",
        label: "Features",
        title: "Where and how should it work?",
        lead: "Each one adds a line to the estimate. Skip what you do not need.",
        groups: [
          {
            id: "features",
            kind: "multi",
            legend: "Features",
            hint: "Choose any, or none.",
            options: [
              {
                id: "bot-channels",
                label: "WhatsApp or Messenger",
                detail: "The same assistant where your customers already are.",
                charge: {
                  title: "Messaging channel",
                  covers: "The same assistant connected to WhatsApp or Messenger, approved and tested.",
                  why: "You asked for it to answer outside your website.",
                  price: 250,
                },
                running: ["messaging"],
              },
              {
                id: "bot-handoff",
                label: "Hand over to a person",
                detail: "It knows when to stop and who to call.",
                charge: {
                  title: "Hand-over to a person",
                  covers: "A clean hand-over to a member of your team, with the conversation so far.",
                  why: "You asked for people to reach a person when they need one.",
                  price: 150,
                },
              },
              {
                id: "bot-leads",
                label: "Capture leads",
                detail: "Names and needs sent to your inbox or CRM.",
                charge: {
                  title: "Lead capture",
                  covers: "Contact details and what the person needs, sent to your inbox or CRM.",
                  why: "You asked for conversations to turn into enquiries.",
                  price: 125,
                },
                running: ["tools"],
              },
              {
                id: "bot-languages",
                label: "More than one language",
                detail: "Replies in the language it is asked in.",
                charge: {
                  title: "Multi-language",
                  covers: "Replies in the language the question is asked in, checked in each one.",
                  why: "You asked for it to serve customers in more than one language.",
                  price: 150,
                },
              },
              {
                id: "bot-dashboard",
                label: "Conversation dashboard",
                detail: "What people ask, and where it struggled.",
                charge: {
                  title: "Conversation dashboard",
                  covers: "A dashboard of what people ask, what it answered and where it struggled.",
                  why: "You asked to see what your customers are saying.",
                  price: 250,
                },
              },
            ],
          },
        ],
      },
    ],
    shared: ["launch", "timeline"],
    running: ["ai", "hosting"],
  },
  {
    id: "brand",
    code: "DSGN",
    label: "Brand & design",
    detail: "A logo, a brand and the screens that carry it.",
    // INVOICE line 02.
    base: [{ id: "brand-kit", ...BRAND_KIT, why: "This is the brand itself: what people recognise you by." }],
    steps: [
      {
        id: "scope",
        label: "Scope",
        title: "How far should the design go?",
        lead: "The brand kit is always included. Add the screens it will live on, if you want them designed too.",
        groups: [
          {
            id: "size",
            kind: "single",
            legend: "Design",
            options: [
              { id: "size-kit", label: "The brand kit alone", detail: "Logo, colours, type and favicon." },
              {
                id: "size-site",
                label: "Plus a website design",
                detail: "Up to 5 pages, ready for any developer.",
                // DRAFT
                charge: {
                  title: "Website design",
                  covers: "Wireframes and finished designs for up to 5 pages, on desktop and phone, handed over as files.",
                  why: "You asked for the website designed in the new brand.",
                  price: 300,
                },
              },
              {
                id: "size-app",
                label: "Plus an app or store design",
                detail: "Every key screen, ready for any developer.",
                // INVOICE line 03.
                charge: {
                  title: "UI/UX design",
                  covers: "Wireframes and high-fidelity designs for every key screen, handed over as files.",
                  why: "You asked for the product designed in the new brand.",
                  price: 425,
                },
              },
            ],
          },
        ],
      },
      {
        id: "features",
        label: "Extras",
        title: "Anything to go with it?",
        lead: "Each one adds a line to the estimate. Skip what you do not need.",
        groups: [
          {
            id: "features",
            kind: "multi",
            legend: "Extras",
            hint: "Choose any, or none.",
            // All DRAFT.
            options: [
              {
                id: "brand-guide",
                label: "Brand guidelines",
                detail: "A short PDF on how to use it all.",
                charge: {
                  title: "Brand guidelines",
                  covers: "A short PDF showing how the logo, colours and type are used, and how they are not.",
                  why: "You asked for rules other people can follow.",
                  price: 150,
                },
              },
              {
                id: "brand-social",
                label: "Social media kit",
                detail: "Profile images and post templates.",
                charge: {
                  title: "Social media kit",
                  covers: "Profile and cover images, and editable post templates in the new brand.",
                  why: "You asked for the brand to be ready to post.",
                  price: 100,
                },
              },
              {
                id: "brand-print",
                label: "Stationery",
                detail: "Business card, letterhead, email signature.",
                charge: {
                  title: "Stationery",
                  covers: "A business card, a letterhead and an email signature, print-ready.",
                  why: "You asked for the brand on paper.",
                  price: 100,
                },
                running: ["licences"],
              },
            ],
          },
        ],
      },
    ],
    shared: ["timeline"],
    running: ["licences"],
  },
];

/* ------------------------------------------------------------------ what the quote says about money it does not include */

export const runningCosts: Record<RunningCostId, { title: string; note: string }> = {
  domain: { title: "Domain name", note: "Bought in your name and renewed every year." },
  hosting: {
    title: "Hosting & database",
    note: "Built on free plans wherever your project fits them. If visitors, orders or data outgrow a free plan, the upgrade is yours.",
  },
  payments: { title: "Payment processing", note: "Stripe or PayPal keep their own fee on each sale." },
  ai: { title: "AI model usage", note: "The model provider bills by use, a little for every answer or run." },
  messaging: { title: "Email, SMS & WhatsApp", note: "Free allowances first. Volume beyond them is billed by the sending service." },
  tools: { title: "Tools you connect", note: "Subscriptions to your own CRM, calendar or accounts software stay yours." },
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

/** DRAFT: how long an estimate holds. */
export const VALID_FOR_DAYS = 30;

export const quoteNotes = [
  "This is an estimate from your answers, not a fixed quote. The figure is confirmed in writing after a short call about the detail.",
  "Changes to the scope after work starts are priced and agreed before they are built.",
] as const;
