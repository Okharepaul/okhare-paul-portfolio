/**
 * The arithmetic behind the "Start a project" estimator: which questions a
 * project is asked, and what its answers add up to. Pure functions over the
 * price list in `content/quote`; nothing here touches the page.
 */
import {
  paymentTerms,
  projectTypes,
  runningCosts,
  sharedSteps,
  type Group,
  type Option,
  type ProjectType,
  type ProjectTypeId,
  type RunningCostId,
  type Step,
} from "@/content/quote";

/** What the visitor has chosen so far: the kind of project, and the option ids picked in each group. */
export interface Answers {
  type: ProjectTypeId | null;
  choices: Readonly<Record<string, readonly string[]>>;
}

export const EMPTY_ANSWERS: Answers = { type: null, choices: {} };

/** The group that holds the first question's answer. It lives in `Answers.type`, not in `choices`. */
export const TYPE_GROUP_ID = "type";

/** The first question, the same for everyone. */
export const TYPE_STEP: Step = {
  id: "type",
  label: "Build",
  title: "What are we building?",
  lead: "Pick the closest. Every question after this one depends on it.",
  groups: [
    {
      id: TYPE_GROUP_ID,
      kind: "single",
      legend: "Project",
      options: projectTypes.map((type) => ({ id: type.id, label: type.label, detail: type.detail })),
    },
  ],
};

export function getType(id: ProjectTypeId | null): ProjectType | null {
  return projectTypes.find((type) => type.id === id) ?? null;
}

/** Every question this project is asked, in order. Before a kind is chosen there is only the first. */
export function stepsFor(typeId: ProjectTypeId | null): Step[] {
  const type = getType(typeId);
  if (!type) return [TYPE_STEP];
  return [TYPE_STEP, ...type.steps, ...type.shared.map((id) => sharedSteps[id])];
}

/** The option ids chosen in a group. */
export function selectedIds(answers: Answers, groupId: string): readonly string[] {
  if (groupId === TYPE_GROUP_ID) return answers.type ? [answers.type] : [];
  return answers.choices[groupId] ?? [];
}

/** True once every one-answer question on the step has its answer. Pick-any questions never hold a step back. */
export function isStepComplete(step: Step, answers: Answers): boolean {
  return step.groups.every((group) => group.kind === "multi" || selectedIds(answers, group.id).length === 1);
}

/**
 * The answers after one option is picked. A one-answer group swaps to the new
 * option; a pick-any group adds it, or drops it if it was already there.
 * Changing the kind of project starts the rest again, since every later
 * question belongs to the kind.
 */
export function choose(answers: Answers, group: Group, optionId: string): Answers {
  if (!group.options.some((option) => option.id === optionId)) return answers;
  if (group.id === TYPE_GROUP_ID) {
    return answers.type === optionId ? answers : { type: optionId as ProjectTypeId, choices: {} };
  }
  const current = selectedIds(answers, group.id);
  const next =
    group.kind === "single" ? [optionId] : current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId];
  return { ...answers, choices: { ...answers.choices, [group.id]: next } };
}

/** Prices that grow with the project are kept to round fives, as on a hand-written quote. */
function scaled(price: number, factor: number): number {
  return Math.round((price * factor) / 5) * 5;
}

/** The size multiplier of the smallest version of this kind of project; 1 when it comes in one size. */
function smallestFactor(type: ProjectType): number {
  const factors = type.steps
    .flatMap((step) => step.groups)
    .flatMap((group) => group.options)
    .flatMap((option) => (option.factor === undefined ? [] : [option.factor]));
  return factors.length > 0 ? Math.min(...factors) : 1;
}

/** What this kind of project's core work comes to at a given size, before any extras. */
export function coreAt(type: ProjectType, factor: number): number {
  return type.base.reduce((sum, charge) => sum + (charge.scales ? scaled(charge.price, factor) : charge.price), 0);
}

/** The least this kind of project can come to: its core work at its smallest size. */
export function startingFrom(type: ProjectType): number {
  return coreAt(type, smallestFactor(type));
}

export interface QuoteLine {
  id: string;
  title: string;
  covers: string;
  why: string;
  price: number;
}

export interface Quote {
  type: ProjectType;
  lines: QuoteLine[];
  subtotal: number;
  /** The surcharge for a rushed deadline, when one was asked for. */
  priority: { label: string; percent: number; amount: number } | null;
  total: number;
  upfront: number;
  completion: number;
  /** Costs outside the quote, paid by the client direct to the provider. */
  running: { id: RunningCostId; title: string; note: string }[];
  /** The answers, for the record: one row per question. */
  summary: { label: string; value: string }[];
}

/** Every option the visitor has picked, across the questions their project is asked. */
function pickedOptions(answers: Answers): { group: Group; option: Option }[] {
  return stepsFor(answers.type)
    .filter((step) => step.id !== TYPE_STEP.id)
    .flatMap((step) => step.groups)
    .flatMap((group) => {
      const ids = selectedIds(answers, group.id);
      return group.options.filter((option) => ids.includes(option.id)).map((option) => ({ group, option }));
    });
}

/**
 * The estimate for a set of answers, or null before a kind of project is
 * chosen. It can be built at any point: questions not yet answered simply add
 * nothing, which is what lets the page show a running figure. Until a size is
 * chosen the project is priced at its smallest, so the figure starts where
 * the first question said it would and only ever grows with the answers.
 */
export function buildQuote(answers: Answers): Quote | null {
  const type = getType(answers.type);
  if (!type) return null;

  const picked = pickedOptions(answers);
  const factor = picked.find(({ option }) => option.factor !== undefined)?.option.factor ?? smallestFactor(type);

  const baseLines: QuoteLine[] = type.base.map((charge) => ({
    id: charge.id,
    title: charge.title,
    covers: charge.covers,
    why: charge.why,
    price: charge.scales ? scaled(charge.price, factor) : charge.price,
  }));
  const optionLines: QuoteLine[] = picked.flatMap(({ option }) =>
    option.charge ? [{ id: option.id, title: option.charge.title, covers: option.charge.covers, why: option.charge.why, price: option.charge.price }] : [],
  );
  const lines = [...baseLines, ...optionLines];
  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);

  const rushed = picked.find(({ option }) => (option.percent ?? 0) > 0)?.option;
  const priority = rushed?.percent
    ? { label: "Priority delivery", percent: rushed.percent, amount: Math.round((subtotal * rushed.percent) / 100) }
    : null;
  const total = subtotal + (priority?.amount ?? 0);
  // Worked in pence, so the two parts are exact and always add back up to the total.
  const upfrontPence = Math.round(total * paymentTerms.upfront.percent);
  const upfront = upfrontPence / 100;
  const completion = (Math.round(total * 100) - upfrontPence) / 100;

  const wanted = new Set<RunningCostId>([...type.running, ...picked.flatMap(({ option }) => option.running ?? [])]);
  const running = (Object.keys(runningCosts) as RunningCostId[]).filter((id) => wanted.has(id)).map((id) => ({ id, ...runningCosts[id] }));

  const summary = stepsFor(type.id)
    .filter((step) => step.id !== TYPE_STEP.id)
    .flatMap((step) => step.groups)
    .map((group) => {
      const labels = picked.filter((pick) => pick.group.id === group.id).map((pick) => pick.option.label);
      return { label: group.legend, value: labels.length > 0 ? labels.join(", ") : "None" };
    });

  return { type, lines, subtotal, priority, total, upfront, completion, running, summary };
}

const POUNDS = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

/** "£1,250.00". */
export function formatGBP(amount: number): string {
  return POUNDS.format(amount);
}

const WHOLE_POUNDS = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

/** "£1,250": for hints beside a choice, where pence would be noise. */
export function formatPounds(amount: number): string {
  return WHOLE_POUNDS.format(amount);
}

/**
 * What a choice does to the estimate, in a few characters, or nothing if it
 * leaves the figure alone. A choice of size shows what the core work comes to
 * at that size, which needs the kind of project it belongs to.
 */
export function priceHint(option: Option, type?: ProjectType | null): string | null {
  if (option.factor !== undefined && type) return `Core build ${formatPounds(coreAt(type, option.factor))}`;
  if (option.charge) return `+ ${formatPounds(option.charge.price)}`;
  if (option.percent) return `+ ${option.percent}%`;
  return null;
}

/**
 * A reference for an estimate, in the pattern of the owner's invoices:
 * "OP-EST-2611-0473" for one made in November 2026. `seed` supplies the last
 * four digits (any number; only its last four digits are used).
 */
export function quoteNumber(date: Date, seed: number): string {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const serial = String(Math.abs(Math.trunc(seed)) % 10000).padStart(4, "0");
  return `OP-EST-${year}${month}-${serial}`;
}

/** "19 November 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

/** "19 Dec 2026": for places too narrow for the month in full. */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

/**
 * The estimate as plain text, short enough to send in a message: the answers,
 * one line per charge, then the totals. `isBrief` leaves the charges out, for
 * places with less room; the answers and the totals still say what was asked for.
 */
export function quoteAsText(quote: Quote, reference: string, isBrief = false): string {
  const lines = quote.lines.map((line, i) => `${String(i + 1).padStart(2, "0")} ${line.title}: ${formatGBP(line.price)}`);
  const answers = quote.summary.map((row) => `${row.label}: ${row.value}`);
  return [
    `Estimate ${reference} · ${quote.type.label}`,
    "",
    ...answers,
    "",
    ...(isBrief ? [] : [...lines, ""]),
    `Subtotal: ${formatGBP(quote.subtotal)}`,
    ...(quote.priority ? [`${quote.priority.label} (+${quote.priority.percent}%): ${formatGBP(quote.priority.amount)}`] : []),
    `Estimated total: ${formatGBP(quote.total)}`,
    ...(quote.running.length > 0 ? ["", `Not included, paid by the client direct: ${quote.running.map((cost) => cost.title).join(", ")}`] : []),
  ].join("\n");
}

/** Who an estimate is for, as typed by the visitor. Either may be empty. */
export interface QuoteClient {
  name: string;
  business: string;
}

export interface QuoteMessageOptions {
  /** The longest message the receiving end accepts, in characters. */
  max: number;
  client?: QuoteClient;
  /** Anything the visitor added in their own words. */
  note?: string;
  /** Leave the individual charges out from the start, e.g. for an email link, which has far less room. */
  isBrief?: boolean;
}

/**
 * The message that carries an estimate to the owner: who it is from, their
 * note, then the estimate. It always fits `max`, and what gives way is chosen
 * on purpose: first the individual charges (the answers and totals stay),
 * then the end of the note. The totals are never cut.
 */
export function quoteMessage(quote: Quote, reference: string, { max, client, note = "", isBrief = false }: QuoteMessageOptions): string {
  const from = [client?.name.trim(), client?.business.trim()].filter(Boolean).join(", ");
  const fromLine = from ? `From ${from}` : "";
  const reserved = fromLine ? fromLine.length + 2 : 0;
  const full = quoteAsText(quote, reference, isBrief);
  const body = full.length + reserved <= max ? full : quoteAsText(quote, reference, true);

  const room = max - body.length - reserved - 2;
  const trimmed = note.trim();
  const shownNote = trimmed.length <= room ? trimmed : room > 1 ? `${trimmed.slice(0, room - 1)}…` : "";
  return [fromLine, shownNote, body].filter(Boolean).join("\n\n");
}
