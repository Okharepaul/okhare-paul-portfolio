import { ADDS_A_LINE, PAYMENTS, PICK_ANY, addOn, type ProjectType } from "./shared";

/** A dashboard, a portal, a booking system, a product. All DRAFT except where marked: the invoice's phases, weighted for software with more logic than a store. */
export const webapp: ProjectType = {
  id: "webapp",
  code: "APP",
  label: "Web application",
  detail: "A dashboard, a portal, a booking system, a product.",
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
      covers: "Wireframes and high-fidelity designs for every key screen, including empty, loading and error states.",
      why: "You see and approve every screen before it is built.",
      price: 500,
      scales: true,
    },
    {
      id: "frontend",
      title: "Frontend development",
      covers: "Every screen built responsively in React and Next.js, with forms, tables and states handled, and usable by keyboard and screen reader.",
      why: "This is the application people use.",
      price: 950,
      scales: true,
    },
    {
      id: "backend",
      title: "Backend & database",
      covers: "The data model, the API behind every screen, validation, security rules and daily backups.",
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
        {
          id: "app-audience",
          kind: "single",
          legend: "Who uses it",
          options: [
            { id: "app-internal", label: "My own team", detail: "A tool for people you know." },
            addOn("app-public", "Customers or the public", "People you have never met.", {
              title: "Public-facing hardening",
              covers: "Rate limits, abuse and bot protection, load testing, and sign-up and help flows for people who have never seen it before.",
              why: "You asked to open it to the public, who will use it in ways a team never would.",
              price: 300,
            }),
            addOn("app-saas", "Many businesses, each their own", "A product you sell to companies.", {
              title: "Multi-tenant setup",
              covers: "A separate workspace for each customer business, with its data kept apart, its own users and settings, and its own branding.",
              why: "You asked to sell it to many businesses. Keeping their data apart is designed in from the first table.",
              price: 600,
            }),
          ],
        },
      ],
    },
    {
      id: "features",
      label: "Features",
      title: "Which systems go in it?",
      lead: ADDS_A_LINE,
      groups: [
        {
          id: "app-access",
          kind: "multi",
          legend: "Access",
          hint: PICK_ANY,
          options: [
            addOn("app-accounts", "Accounts & roles", "Sign-up, login and who may do what.", {
              title: "Accounts & roles",
              covers: "Sign-up, login, password reset and roles that decide who may see and do what.",
              why: "You asked for people to sign in, and for some of them to have more access than others.",
              price: 250,
            }),
            addOn("app-sso", "Google or Microsoft sign-in", "Single sign-on with work accounts.", {
              title: "Single sign-on",
              covers: "Sign-in with Google, Microsoft or your company's identity provider, with accounts created on first sign-in.",
              why: "You asked for people to use the work accounts they already have.",
              price: 200,
            }),
            addOn("app-2fa", "Two-factor authentication", "A code app or passkey on top of a password.", {
              title: "Two-factor authentication",
              covers: "A second step at sign-in by authenticator app or passkey, with recovery codes.",
              why: "You asked for accounts to be hard to break into.",
              price: 125,
            }),
            addOn("app-teams", "Teams & invitations", "Invite colleagues, manage seats.", {
              title: "Teams & invitations",
              covers: "Invitations by email, seats to manage, roles inside each team, and ownership that can be handed on.",
              why: "You asked for people to work together inside it.",
              price: 200,
            }),
            addOn("app-audit", "Audit log", "Who changed what, and when.", {
              title: "Audit log",
              covers: "A record of who changed what and when, searchable and exportable.",
              why: "You asked to be able to trace every change, which auditors and clients often ask for.",
              price: 150,
            }),
          ],
        },
        {
          id: "app-work",
          kind: "multi",
          legend: "The work",
          hint: PICK_ANY,
          options: [
            addOn("app-search", "Search & filters", "Find any record; save the view.", {
              title: "Search & filters",
              covers: "Search across records, with filters, sorting and saved views on every table.",
              why: "You asked for people to find things in a lot of data.",
              price: 150,
            }),
            addOn("app-workflow", "Approvals & workflows", "Stages, sign-offs and due dates.", {
              title: "Approvals & workflows",
              covers: "Records that move through stages, with assignments, approvals, due dates and reminders.",
              why: "You asked for the application to carry work from one person to the next.",
              price: 300,
            }),
            addOn(
              "app-calendar",
              "Bookings & scheduling",
              "Slots, availability and reminders.",
              {
                title: "Bookings & scheduling",
                covers: "Availability, bookable slots, clashes prevented, reminders, and sync with Google or Outlook calendars.",
                why: "You asked for the application to manage time.",
                price: 300,
              },
              ["tools"],
            ),
            addOn("app-files", "File uploads", "Documents and images, stored safely.", {
              title: "File uploads",
              covers: "Uploads for documents and images, checked, stored and served securely.",
              why: "You asked for users to attach files.",
              price: 150,
            }),
            addOn("app-import", "Import & export", "CSV and Excel in and out.", {
              title: "Import & export",
              covers: "CSV and Excel import with checks and a preview before anything is saved, and export of any table.",
              why: "You asked to move data in and out in bulk.",
              price: 150,
            }),
            addOn("app-pdf", "PDF documents", "Invoices, reports or certificates.", {
              title: "PDF documents",
              covers: "Invoices, reports or certificates generated as branded PDFs, to download or send.",
              why: "You asked for the application to produce documents.",
              price: 150,
            }),
            addOn("app-live", "Live updates or chat", "Changes appear without a refresh.", {
              title: "Live updates",
              covers: "Changes that appear for everyone without a refresh, or a chat between users.",
              why: "You asked for it to work in real time.",
              price: 300,
            }),
            addOn(
              "app-ai",
              "An AI assistant inside",
              "Answers and drafts from your own data.",
              {
                title: "AI assistant",
                covers: "An assistant inside the application that answers and drafts from your own data, with limits on what it may do.",
                why: "You asked for AI in the product, wired to real data.",
                price: 400,
              },
              ["ai"],
            ),
          ],
        },
        {
          id: "app-business",
          kind: "multi",
          legend: "Business",
          hint: PICK_ANY,
          options: [
            // INVOICE line 06.
            addOn("app-payments", "Payments", "One-off payments at checkout.", { ...PAYMENTS, why: "You asked to take money inside the application." }, ["payments"]),
            addOn(
              "app-billing",
              "Subscription billing",
              "Plans, trials and a billing portal.",
              {
                title: "Subscription billing",
                covers: "Plans, free trials, upgrades and downgrades, invoices and a self-service billing portal, through Stripe.",
                why: "You asked to charge for it monthly or yearly.",
                price: 350,
              },
              ["payments"],
            ),
            // INVOICE line 07.
            addOn("app-admin", "Admin dashboard", "See and manage everything in one place.", {
              title: "Admin dashboard",
              covers: "A back office to see and manage users, records and settings in one place.",
              why: "You asked to run it yourself, day to day.",
              price: 350,
            }),
            addOn("app-reports", "Reports & charts", "Your numbers, drawn clearly, with export.", {
              title: "Reports & charts",
              covers: "Charts and tables of your own numbers, with filters and export.",
              why: "You asked to see what is happening inside the application.",
              price: 250,
            }),
            addOn(
              "app-notify",
              "Emails & notifications",
              "Sent when something needs attention.",
              {
                title: "Emails & notifications",
                covers: "Branded emails and in-app notifications sent when something needs a person's attention, with each person's own settings.",
                why: "You asked for the application to tell people when to act.",
                price: 125,
              },
              ["messaging"],
            ),
            addOn(
              "app-integration",
              "Connect another system",
              "Your CRM, accounts or calendar.",
              {
                title: "System integration",
                covers: "A tested connection to one outside system, such as your CRM, accounts or calendar.",
                why: "You asked for it to share data with a tool you already use.",
                price: 200,
              },
              ["tools"],
            ),
            addOn("app-api", "A public API", "Let other systems connect to yours.", {
              title: "Public API",
              covers: "A documented API with keys and limits, so customers and other systems can connect to yours.",
              why: "You asked for others to build on it.",
              price: 400,
            }),
            addOn("app-pwa", "Install on phones", "Home-screen icon, offline screens, push.", {
              title: "Installable app",
              covers: "Installs to a phone's home screen, opens without a browser bar, keeps key screens offline and can send push notifications.",
              why: "You asked for it to feel like an app on a phone, without the cost of a store app.",
              price: 200,
            }),
          ],
        },
      ],
    },
  ],
  shared: ["look", "launch", "timeline"],
  running: ["domain", "hosting"],
};
