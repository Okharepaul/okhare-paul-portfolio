/**
 * The words around "Build your stack" (Start a project, edit round 13,
 * 21 Nov 2026). The page used to price every answer; the owner asked for the
 * prices to come off, because a figure up front can turn a client away before
 * a conversation starts. The visitor now puts their project together part by
 * part, approves it, and sends it to the owner as a brief. The price list in
 * this folder stays: it gives the owner a guide figure in the email, never on
 * the page.
 */

/**
 * What the box beside the questions cycles through: work that is not one of
 * the tiles, or sits between them. It invites the question; it promises
 * nothing, so the line around it says the owner will answer straight.
 */
export const notListed = [
  "A browser extension",
  "A booking system for a clinic",
  "A move off WordPress or Wix",
  "A dashboard for your numbers",
  "A fix for a site someone else built",
  "An API for your other software",
  "A redesign of something you already run",
  "Something nobody has built yet",
] as const;

/** What happens after a build is sent, in order. The reply time is the one the old estimate's "sent" message promised. */
export const nextSteps = [
  { title: "You send your build", detail: "It reaches me as it is on this page, with your note." },
  { title: "I reply within two working days", detail: "With questions, if I have any, and times for a call." },
  { title: "A short call, then it is in writing", detail: "Price, dates and scope, confirmed before any work starts." },
] as const;

/** The terms on a build, in the owner's voice. The running-cost terms (`runningCostTerms`) follow them. */
export const buildNotes = [
  "This is your brief, not a quote. Price and dates are confirmed in writing after a short call about the detail.",
  "Anything added after work starts is agreed before it is built.",
] as const;

/** What is said while the build is put together. Each is something the page really does. */
export const buildingLines = [
  "Gathering your choices",
  "Writing what each part covers",
  "Setting the running costs apart",
  "Laying out your build",
] as const;
