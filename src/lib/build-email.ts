/**
 * The email a sent build arrives as, designed like the build sheet on the
 * site: the black band with the mark, who it is from and what they want, the
 * striped list of parts, the orange count, and, for the owner only, the guide
 * figure. The plain-text version (build-request.ts) travels with it.
 */
import { CORE_SECTION, type Build, type BuildPart } from "./build";
import {
  EMAIL_COLOURS as C,
  EMAIL_FONTS as F,
  band,
  button,
  calendarDay,
  cardPair,
  closing,
  emailDocument,
  escapeHtml,
  factsCard,
  label,
  opening,
  personCard,
  pill,
  replyHref,
  ukDay,
  ukStamp,
  writtenBlock,
} from "./email-html";
import { formatGBP, type Quote } from "./quote";

export interface BuildEmailInput {
  intent: "send" | "ask";
  name: string;
  business: string;
  email: string;
  note: string;
  build: Build;
  reference: string;
  /** The day the build was made. */
  issued: Date;
  /** When it was sent. */
  sentAt: Date;
  guide: Quote;
  /** Opens the build on the page, ready to save as a PDF. */
  link: string;
  /** The email's subject, for the reply link. */
  subject: string;
}

const twoDigits = (n: number): string => String(n).padStart(2, "0");

function intro(input: BuildEmailInput): string {
  const { name, business, intent, build, email, subject, link } = input;
  const who = escapeHtml(name);
  const from = business ? `${who} of ${escapeHtml(business)}` : who;
  const kind = escapeHtml(build.type.label.toLowerCase());
  const isAsking = intent === "ask";
  const what = isAsking
    ? `${from} approved a ${kind} build of ${build.parts.length} parts and wants to talk through more features or details first. Their note is below.`
    : `${from} approved a ${kind} build of ${build.parts.length} parts and sent it as it is.`;
  const firstName = name.trim().split(/\s+/)[0] ?? name;
  return opening({
    pill: isAsking ? pill("Approved · has questions", "orange") : pill("Approved · sent as it is"),
    headline: isAsking ? `${who} has questions about a build` : `${who} sent you a build`,
    lead: `${what} Reply and it goes straight to them.`,
    buttons: `${button(replyHref(email, subject), `Reply to ${firstName}`)}${button(link, "Open the build", "outline")}`,
  });
}

function cards({ name, business, email, build, reference, issued, sentAt }: BuildEmailInput): string {
  return cardPair(
    personCard("Built by", name, email, business),
    factsCard("Build details", [
      ["Project", escapeHtml(build.type.label)],
      ["Build no.", escapeHtml(reference)],
      ["Built on", calendarDay(issued)],
      ["Sent", ukStamp(sentAt)],
    ]),
  );
}

function note({ note: text, intent }: BuildEmailInput): string {
  return writtenBlock("Their note", text, `No note. ${intent === "ask" ? "Ask them what they have in mind." : "They sent the build as it is."}`);
}

function glance({ build }: BuildEmailInput): string {
  const rows = build.choices
    .map(
      (choice) =>
        `<tr><td style="width:38%;padding:8px 12px 8px 0;border-top:1px solid ${C.line};font-family:${F.mono};font-size:10px;letter-spacing:0.14em;line-height:1.5;text-transform:uppercase;vertical-align:top;color:${C.faint};">${escapeHtml(choice.label)}</td><td style="padding:8px 0;border-top:1px solid ${C.line};font-size:14px;line-height:1.5;vertical-align:top;color:${choice.picks > 0 ? C.ink : C.faint};">${escapeHtml(choice.value)}</td></tr>`,
    )
    .join("");
  return `<div style="margin:0 0 24px;">
${label("At a glance")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
</div>`;
}

/** Where a part came from, as the sheet's small tag; the core work is filled. */
function partTag(section: string): string {
  const colours = section === CORE_SECTION ? `background:${C.ink};border:1px solid ${C.ink};color:#ffffff;` : `background:${C.sheet};border:1px solid ${C.lineStrong};color:${C.ink};`;
  return `<span style="display:inline-block;padding:3px 8px;border-radius:999px;${colours}font-family:${F.mono};font-size:9px;letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap;">${escapeHtml(section)}</span>`;
}

function partRow(part: BuildPart, index: number): string {
  const shade = index % 2 === 1 ? C.stripe : C.sheet;
  return `<tr style="background:${shade};">
<td style="width:30px;padding:12px 0 12px 14px;font-family:${F.mono};font-size:11px;vertical-align:top;color:${C.orangeText};">${twoDigits(index + 1)}</td>
<td style="padding:11px 10px;vertical-align:top;"><p style="margin:0;font-size:14px;font-weight:600;line-height:1.35;color:${C.ink};">${escapeHtml(part.title)}</p><p style="margin:3px 0 0;font-size:12.5px;line-height:1.5;color:${C.muted};">${escapeHtml(part.covers)}</p></td>
<td style="width:1%;padding:12px 14px 12px 0;text-align:right;vertical-align:top;">${partTag(part.section)}</td>
</tr>`;
}

function parts({ build }: BuildEmailInput): string {
  const head = `<tr style="background:${C.ink};"><td style="padding:10px 0 10px 14px;font-family:${F.mono};font-size:10px;letter-spacing:0.18em;color:#ffffff;">#</td><td style="padding:10px;font-family:${F.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;">The parts</td><td style="padding:10px 14px 10px 0;font-family:${F.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;text-align:right;white-space:nowrap;color:#ffffff;">Part of</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:12px;border-collapse:separate;overflow:hidden;">
${head}
${build.parts.map(partRow).join("\n")}
</table>`;
}

/** The orange block with the count, as the sheet's total. */
function count({ build, intent }: BuildEmailInput): string {
  const state = intent === "ask" ? "Approved · questions" : "Approved & sent";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0;background:${C.orange};border-radius:14px;">
<tr>
<td class="stack" style="padding:18px 20px;vertical-align:middle;"><p style="margin:0;font-family:${F.wide};font-size:12px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;color:${C.ink};">The build</p><p style="margin:6px 0 0;font-family:${F.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${C.ink};">${escapeHtml(build.type.label)}</p></td>
<td class="stack" style="padding:18px 20px;vertical-align:middle;text-align:right;"><p style="margin:0;font-family:${F.display};font-size:58px;font-weight:800;line-height:0.85;color:${C.ink};">${build.parts.length}<span style="font-size:24px;text-transform:uppercase;">&nbsp;parts</span></p><span style="display:inline-block;margin-top:10px;padding:4px 10px;border-radius:999px;background:${C.ink};font-family:${F.mono};font-size:10px;letter-spacing:0.1em;color:${C.orange};">${state}</span></td>
</tr>
</table>`;
}

function runningCosts({ build }: BuildEmailInput): string {
  if (build.running.length === 0) return "";
  const items = build.running
    .map(
      (cost) =>
        `<tr><td style="padding:8px 0;border-top:1px solid ${C.line};font-size:13.5px;line-height:1.5;color:${C.ink};"><strong>${escapeHtml(cost.title)}</strong><span style="color:${C.muted};"> · ${escapeHtml(cost.note)}</span></td></tr>`,
    )
    .join("");
  return `<div style="margin:24px 0 0;">
${label("Running costs · paid by the client, direct")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${items}</table>
</div>`;
}

/** The guide figure: the owner's draft prices over the same answers. Never shown to the client. */
function forYourEyes({ guide }: BuildEmailInput): string {
  const priority = guide.priority
    ? `<p style="margin:6px 0 0;font-size:13px;color:${C.muted};">Includes ${escapeHtml(guide.priority.label.toLowerCase())} (+${guide.priority.percent}%).</p>`
    : "";
  return `<div style="margin:24px 0 0;padding:16px 18px;border:1px dashed ${C.lineStrong};border-radius:12px;">
${label("For your eyes only", C.orangeText)}
<p style="margin:0;font-size:13px;color:${C.muted};">Guide figure from your draft price list</p>
<p style="margin:6px 0 0;font-family:${F.display};font-size:34px;font-weight:800;line-height:1;color:${C.ink};">${escapeHtml(formatGBP(guide.total))}</p>
${priority}
<p style="margin:10px 0 0;font-size:12.5px;color:${C.faint};">The client was not shown a price.</p>
</div>`;
}

/** The designed email for a sent build. */
export function buildEmailHtml(input: BuildEmailInput): string {
  const { name, build, reference, intent, sentAt } = input;
  const what = intent === "ask" ? "has questions about" : "sent you";
  const strip = `From the Build your stack page &nbsp;·&nbsp; ${ukDay(sentAt)}`;
  const body = [
    band({ title: "New build", number: `No. ${reference}`, strip }),
    intro(input),
    cards(input),
    note(input),
    glance(input),
    parts(input),
    count(input),
    runningCosts(input),
    forYourEyes(input),
    closing({ action: button(input.link, "Open the build · save as PDF"), replyTo: input.email, footRight: `${reference} · A brief, not a quote` }),
  ].join("\n");
  return emailDocument({
    title: input.subject,
    preheader: `${name} ${what} a ${build.type.label.toLowerCase()} build of ${build.parts.length} parts.`,
    body,
    footnote: "Sent to you from the Build your stack page on theokharepaul.site. Replies go to the client.",
  });
}
