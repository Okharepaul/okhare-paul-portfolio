import { ADDS_A_LINE, PICK_ANY, addOn, careStep, type ProjectType } from "./shared";

/** Repeat work handed to a system that does it. All DRAFT. */
export const automation: ProjectType = {
  id: "automation",
  code: "AI",
  label: "AI automation",
  detail: "Repeat work handed to a system that does it.",
  base: [
    {
      id: "discovery",
      title: "Process mapping",
      covers: "A walk through how the work is done today, the time it takes, and a written choice of what to automate first.",
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
        {
          id: "ai-volume",
          kind: "single",
          legend: "Volume",
          options: [
            { id: "ai-volume-low", label: "Hundreds a month", detail: "Emails, orders or files, at a human pace." },
            addOn("ai-volume-high", "Thousands a month", "Built for heavy, steady load.", {
              title: "High-volume hardening",
              covers: "Queues, batching, rate limits and cost caps, so heavy volumes run reliably and the AI bill stays predictable.",
              why: "You told me it will handle thousands of items. At that scale every failure and every penny repeats.",
              price: 250,
            }),
          ],
        },
      ],
    },
    {
      id: "features",
      label: "Features",
      title: "What should it work with?",
      lead: ADDS_A_LINE,
      groups: [
        {
          id: "ai-reads",
          kind: "multi",
          legend: "What it reads",
          hint: PICK_ANY,
          options: [
            addOn(
              "ai-tools",
              "Your existing tools",
              "Email, spreadsheets, CRM, calendar.",
              {
                title: "Tool connections",
                covers: "Tested connections to the tools you already use, such as email, spreadsheets, a CRM or a calendar.",
                why: "You asked for it to work inside the tools you have, not beside them.",
                price: 200,
              },
              ["tools"],
            ),
            addOn("ai-inbox", "Your inbox", "Mail sorted, routed and replies drafted.", {
              title: "Inbox triage",
              covers: "Incoming email read, labelled and routed to the right person, with replies drafted for the routine ones.",
              why: "You asked for it to take the first pass at the inbox.",
              price: 250,
            }),
            addOn("ai-documents", "Documents", "PDFs, invoices and forms turned into data.", {
              title: "Document reading",
              covers: "PDFs, invoices and forms read and turned into clean, checked data.",
              why: "You asked for it to work from documents people send you.",
              price: 300,
            }),
            addOn("ai-voice", "Calls & voice notes", "Transcribed and summarised.", {
              title: "Calls & voice notes",
              covers: "Calls, meetings and voice notes transcribed, summarised and filed against the right customer or job.",
              why: "You asked for spoken work to end up written down, without anyone typing it.",
              price: 300,
            }),
            addOn("ai-research", "The web", "Facts gathered from sites and public sources.", {
              title: "Web research",
              covers: "Information gathered from websites and public sources, checked against each other and summarised with links.",
              why: "You asked for it to do the looking up.",
              price: 200,
            }),
            addOn("ai-knowledge", "Your own knowledge", "Answers drawn from your files and policies.", {
              title: "Knowledge base",
              covers: "Your files and policies indexed so the system answers from them and shows its source.",
              why: "You asked for answers grounded in your own material.",
              price: 350,
            }),
          ],
        },
        {
          id: "ai-does",
          kind: "multi",
          legend: "What it does",
          hint: PICK_ANY,
          options: [
            addOn("ai-drafting", "Drafts content", "Posts, descriptions or replies in your voice.", {
              title: "Content drafting",
              covers: "Posts, product descriptions, proposals or replies drafted in your voice from a written style guide.",
              why: "You asked for first drafts to write themselves.",
              price: 250,
            }),
            addOn(
              "ai-reports",
              "Sends reports",
              "Weekly or monthly summaries, emailed.",
              {
                title: "Scheduled reports",
                covers: "Weekly or monthly summaries built from your data, explained in plain words and emailed to who needs them.",
                why: "You asked to stop building the same report by hand.",
                price: 200,
              },
              ["messaging"],
            ),
            addOn(
              "ai-schedule",
              "Runs on a schedule",
              "On time, and tells you when it cannot.",
              {
                title: "Schedules & alerts",
                covers: "The workflows started on a timetable instead of by hand, and an alert to you when a run fails or needs a decision.",
                why: "You asked for it to run without being started by hand. Scheduled reports include their own timing.",
                price: 100,
              },
              ["messaging"],
            ),
            addOn("ai-agent", "Acts across your tools", "Plans and carries out several steps.", {
              title: "Multi-step agent",
              covers: "An agent that plans and carries out a series of steps across your tools, within limits you set, with every step logged.",
              why: "You asked for it to finish whole jobs, not single steps. The limits are designed as carefully as the steps.",
              price: 600,
            }),
          ],
        },
        {
          id: "ai-control",
          kind: "multi",
          legend: "Control",
          hint: PICK_ANY,
          options: [
            addOn("ai-approval", "A person approves", "It drafts; someone signs off.", {
              title: "Approval step",
              covers: "A review queue where a person approves, edits or rejects before anything is sent or changed.",
              why: "You asked to keep a person in charge of the decisions that matter.",
              price: 200,
            }),
            addOn("ai-dashboard", "Dashboard & logs", "What ran, what it did, what it saved.", {
              title: "Dashboard & logs",
              covers: "A dashboard of what ran, what it did and how long it saved, with a searchable log.",
              why: "You asked to see what the system is doing.",
              price: 300,
            }),
            addOn("ai-privacy", "Data protection", "Personal data masked; rules enforced.", {
              title: "Data protection & guardrails",
              covers: "Personal data masked before it reaches the model, outputs checked against your rules, and a written record of processing for UK GDPR.",
              why: "You asked for customer data to be handled properly when AI is involved.",
              price: 250,
            }),
            addOn("ai-evals", "Accuracy checks", "Your real cases rerun after every change.", {
              title: "Accuracy checks",
              covers: "The launch test cases kept as a permanent suite, grown from your real work and rerun after every change, so accuracy is measured rather than assumed.",
              why: "You asked to know it stays right after launch, as it changes.",
              price: 200,
            }),
          ],
        },
      ],
    },
    careStep("ai", {
      title: "Hosting & monitoring setup",
      covers: "Accounts opened in your name, the workflows deployed, and an alert to you if a run stops or slows.",
    }),
  ],
  shared: ["timeline"],
  running: ["ai", "hosting"],
};
