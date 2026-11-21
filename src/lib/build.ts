/**
 * "Build your stack": what a visitor has put together on the Start a project
 * page, as a list of parts with no prices on it. Also the compact code that
 * carries a build in a link, so the owner can open exactly what was sent, and
 * the plain text a build travels in. Pure functions; nothing here touches the page.
 */
import { projectTypes, type ProjectType, type ProjectTypeId } from "@/content/quote";
import { TYPE_STEP, getType, isStepComplete, runningFor, selectedIds, stepsFor, type Answers, type RunningCost } from "./quote";

/** The section every kind of project's own work is filed under. */
export const CORE_SECTION = "Core";

/** One part of a build: a piece of work, or a decision about one, and what it covers. */
export interface BuildPart {
  id: string;
  title: string;
  covers: string;
  /** Where it came from: "Core" for the work every build of the kind needs, else the question's short name. */
  section: string;
}

/** One question and its answer, for the record. */
export interface BuildChoice {
  label: string;
  value: string;
  picks: number;
}

export interface Build {
  type: ProjectType;
  /** The core work first, then every pick in the order the questions were asked. */
  parts: BuildPart[];
  choices: BuildChoice[];
  /** Costs outside the work, paid by the client direct to the provider. */
  running: RunningCost[];
}

/** Who a build is from, as typed by the visitor. Either may be empty. */
export interface BuildClient {
  name: string;
  business: string;
}

/**
 * The build for a set of answers, or null before a kind of project is chosen.
 * It can be made at any point: questions not yet answered add nothing, which
 * is what lets the box beside the questions fill as the visitor goes.
 */
export function buildStack(answers: Answers): Build | null {
  const type = getType(answers.type);
  if (!type) return null;

  const asked = stepsFor(type.id).filter((step) => step.id !== TYPE_STEP.id);
  const picks = asked.flatMap((step) =>
    step.groups.flatMap((group) => {
      const ids = selectedIds(answers, group.id);
      return group.options.filter((option) => ids.includes(option.id)).map((option) => ({ step, group, option }));
    }),
  );

  const core: BuildPart[] = type.base.map((charge) => ({ id: charge.id, title: charge.title, covers: charge.covers, section: CORE_SECTION }));
  // A pick that is a piece of work reads as that work; a pick that is a decision reads as the question and its answer.
  const chosen: BuildPart[] = picks.map(({ step, group, option }) =>
    option.charge
      ? { id: option.id, title: option.charge.title, covers: option.charge.covers, section: step.label }
      : { id: option.id, title: `${group.legend}: ${option.label}`, covers: option.detail, section: step.label },
  );

  const choices = asked
    .flatMap((step) => step.groups)
    .map((group) => {
      const labels = picks.filter((pick) => pick.group.id === group.id).map((pick) => pick.option.label);
      return { label: group.legend, value: labels.length > 0 ? labels.join(", ") : "None", picks: labels.length };
    });

  return { type, parts: [...core, ...chosen], choices, running: runningFor(type, picks.map(({ option }) => option)) };
}

/** True once every question the project is asked has what it needs to continue. */
export function isBuildComplete(answers: Answers): boolean {
  return answers.type !== null && stepsFor(answers.type).every((step) => isStepComplete(step, answers));
}

/**
 * A reference for a build, in the pattern of the owner's invoices:
 * "OP-BLD-2611-0473" for one made in November 2026. `seed` supplies the last
 * four digits (any number; only its last four digits are used).
 */
export function buildNumber(date: Date, seed: number): string {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const serial = String(Math.abs(Math.trunc(seed)) % 10000).padStart(4, "0");
  return `OP-BLD-${year}${month}-${serial}`;
}

const REFERENCE_PREFIX = "OP-BLD-";
const SERIAL_PATTERN = /^\d{4}-\d{4}$/;
const DAY_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;
const OPTION_PATTERN = /^[a-z0-9-]{1,60}$/;
const CODE_PATTERN = /^[a-z0-9.-]+$/;
const CODE_VERSION = "b1";
/** Far more than the biggest build needs; a guard against a hand-made link, not a limit anyone meets. */
export const BUILD_CODE_MAX = 1500;
const MAX_PICKS = 120;

/* ------------------------------------------------------------------ the build in a link */

/** A build as it was sent: the answers, its reference and the day it was made. */
export interface BuildRecord {
  answers: Answers;
  reference: string;
  issued: Date;
}

/** "20261121". */
const dayOf = (date: Date): string =>
  `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;

const isProjectType = (id: string): id is ProjectTypeId => projectTypes.some((type) => type.id === id);

/**
 * The answers for a kind of project from the option ids picked, or null if
 * any id is not one of its options, or a one-answer question has two.
 */
export function answersFromIds(typeId: ProjectTypeId, ids: readonly string[]): Answers | null {
  const groups = stepsFor(typeId)
    .filter((step) => step.id !== TYPE_STEP.id)
    .flatMap((step) => step.groups);
  const known = new Set(groups.flatMap((group) => group.options.map((option) => option.id)));
  if (ids.some((id) => !known.has(id))) return null;

  const choices = Object.fromEntries(
    groups.map((group) => [group.id, group.options.filter((option) => ids.includes(option.id)).map((option) => option.id)] as const),
  );
  const isValid = groups.every((group) => group.kind === "multi" || choices[group.id].length <= 1);
  return isValid ? { type: typeId, choices } : null;
}

/**
 * A build as a short code that is already safe in an address: the version,
 * the kind of project, the reference's serial, the day, then the option ids
 * picked, joined by dots ("b1.website.2611-0473.20261121.size-small.web-cms").
 * Option ids are plain words, so the code needs no encoding and stays short.
 */
export function encodeBuild({ answers, reference, issued }: BuildRecord): string {
  if (!answers.type) throw new Error("A build needs a kind of project before it can be encoded.");
  const ids = stepsFor(answers.type)
    .filter((step) => step.id !== TYPE_STEP.id)
    .flatMap((step) => step.groups)
    .flatMap((group) => selectedIds(answers, group.id));
  return [CODE_VERSION, answers.type, reference.slice(REFERENCE_PREFIX.length), dayOf(issued), ...ids].join(".");
}

/** The build a code carries, or null for anything that is not a code this page made. */
export function decodeBuild(code: string): BuildRecord | null {
  if (code.length === 0 || code.length > BUILD_CODE_MAX || !CODE_PATTERN.test(code)) return null;
  const [version, typeId, serial, day, ...ids] = code.split(".");
  if (version !== CODE_VERSION || !isProjectType(typeId ?? "") || !SERIAL_PATTERN.test(serial ?? "")) return null;
  if (ids.length > MAX_PICKS || ids.some((id) => !OPTION_PATTERN.test(id))) return null;

  const [, year, month, date] = DAY_PATTERN.exec(day ?? "") ?? [];
  const issued = new Date(Number(year), Number(month) - 1, Number(date));
  // A day that does not exist (31 February) rolls over to another, and is turned away.
  if (!year || dayOf(issued) !== day) return null;

  const answers = answersFromIds(typeId as ProjectTypeId, ids);
  return answers ? { answers, reference: `${REFERENCE_PREFIX}${serial}`, issued } : null;
}

/** The address that opens a build on the page, ready to save as a PDF. */
export function buildLink(origin: string, code: string): string {
  return `${origin}/start-a-project#build=${code}`;
}

/** The code in a page address's fragment ("#build=…"), or null. */
export function codeFromHash(hash: string): string | null {
  const match = /^#build=([a-z0-9.-]+)$/.exec(hash);
  return match ? match[1] : null;
}

/* ------------------------------------------------------------------ the build as text */

/** "From Ada, Example Studio", or nothing when neither was given. */
export function fromLine(client: BuildClient): string {
  const from = [client.name.trim(), client.business.trim()].filter(Boolean).join(", ");
  return from ? `From ${from}` : "";
}

/** The whole build as plain text, in the order of the sheet: the answers, every part and what it covers, then the running costs. */
export function buildAsText(build: Build, reference: string): string {
  const parts = build.parts.flatMap((part, i) => [`${String(i + 1).padStart(2, "0")} ${part.title} [${part.section}]`, `   ${part.covers}`]);
  return [
    `Build ${reference} · ${build.type.label}`,
    build.type.detail,
    "",
    "AT A GLANCE",
    ...build.choices.map((choice) => `${choice.label}: ${choice.value}`),
    "",
    `THE PARTS (${build.parts.length})`,
    ...parts,
    ...(build.running.length > 0
      ? ["", "RUNNING COSTS, PAID BY THE CLIENT DIRECT", ...build.running.map((cost) => `${cost.title}: ${cost.note}`)]
      : []),
  ].join("\n");
}

export interface BuildBriefOptions {
  /** The longest message the receiving end accepts, in characters. */
  max: number;
  client: BuildClient;
  note?: string;
  /** The address that opens the full build. It is never cut. */
  link: string;
}

/**
 * A build short enough for an email link: who it is from, their note, the
 * answers, and the address of the full build. When room is short the answers
 * give way first (the link carries them), then the end of the note.
 */
export function buildBrief(build: Build, reference: string, { max, client, note = "", link }: BuildBriefOptions): string {
  const from = fromLine(client);
  const head = `Build ${reference} · ${build.type.label} · ${build.parts.length} parts`;
  const answered = build.choices.filter((choice) => choice.picks > 0).map((choice) => `${choice.label}: ${choice.picks > 1 ? `${choice.picks} chosen` : choice.value}`);
  const tail = `Open the full build: ${link}`;
  const bodies = [[head, ...answered, "", tail].join("\n"), [head, "", tail].join("\n")];
  const reserved = from ? from.length + 2 : 0;
  const body = bodies.find((text) => text.length + reserved <= max) ?? bodies[bodies.length - 1];

  const room = max - body.length - reserved - 2;
  const trimmed = note.trim();
  const shownNote = trimmed.length <= room ? trimmed : room > 1 ? `${trimmed.slice(0, room - 1)}…` : "";
  return [from, shownNote, body].filter(Boolean).join("\n\n");
}

