/**
 * The pieces every designed email from the site is made of, in the site's
 * own look: the black band with the mark, the light sheet, mono labels and
 * the one orange. Email is not the web: no stylesheet files, no SVG, no
 * scripts, and Gmail ignores web fonts. So the layout is tables with inline
 * styles, the mark is an image carried inside the email, and every font
 * names the site's face first (Apple Mail shows it) and a close standard
 * face after it (everything else shows that). Every value put into the
 * markup goes through `escapeHtml` first.
 */
import { EMAIL_LOGO } from "./email-logo";

/** The site's palette, for a light sheet: as the build sheet prints. */
export const EMAIL_COLOURS = {
  ink: "#171717",
  page: "#dedede",
  sheet: "#ffffff",
  stripe: "#f4f4f3",
  note: "#f6f5f3",
  line: "#d6d6d6",
  lineStrong: "#9a9a9a",
  muted: "#4d4d4d",
  faint: "#6b6b6b",
  orange: "#f25623",
  /** The deeper orange the site uses for small text on light gray (4.5:1). */
  orangeText: "#b03a12",
  bandText: "#dedede",
  bandMuted: "#a3a3a3",
  bandLine: "#3a3a3a",
} as const;

export const EMAIL_FONTS = {
  display: "'Big Shoulders','Big Shoulders Display','Arial Narrow','Helvetica Neue',Arial,sans-serif",
  sans: "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
  mono: "'Geist Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,'Courier New',monospace",
  wide: "'Unbounded','Arial Black',Arial,sans-serif",
} as const;

/** The id the mark is attached under; the band's image points at it. */
export const LOGO_CONTENT_ID = "op-mark";

/** An image carried inside the email, shown where the markup says `cid:<contentId>`. */
export interface InlineImage {
  contentId: string;
  filename: string;
  contentType: string;
  base64: string;
}

export const LOGO_IMAGE: InlineImage = {
  contentId: LOGO_CONTENT_ID,
  filename: "okhare-paul-mark.png",
  contentType: "image/png",
  base64: EMAIL_LOGO.base64,
};

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Text made safe to place in markup or in an attribute. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

/** Free text as paragraphs: escaped, its line breaks kept. */
export function escapeLines(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

const C = EMAIL_COLOURS;
const F = EMAIL_FONTS;

/** The small spaced capitals the site labels everything with. */
export function label(text: string, colour: string = C.faint): string {
  return `<p style="margin:0 0 8px;font-family:${F.mono};font-size:10px;line-height:1.4;letter-spacing:0.2em;text-transform:uppercase;color:${colour};">${escapeHtml(text)}</p>`;
}

/** A button as a link. "solid" is black, as the site's main buttons; "outline" is its quiet one. */
export function button(href: string, text: string, kind: "solid" | "outline" = "solid"): string {
  const colours = kind === "solid" ? `background:${C.ink};color:#ffffff;border:1px solid ${C.ink};` : `background:${C.sheet};color:${C.ink};border:1px solid ${C.lineStrong};`;
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:13px 20px;border-radius:999px;${colours}font-family:${F.mono};font-size:11px;font-weight:600;letter-spacing:0.14em;line-height:1;text-decoration:none;text-transform:uppercase;">${escapeHtml(text)}&nbsp;&rarr;</a>`;
}

/** Columns that sit side by side on a wide screen and stack on a phone, with or without media queries. */
export function columns(cells: readonly string[], width: number): string {
  const each = cells
    .map(
      (cell) =>
        `<div class="col" style="display:inline-block;width:100%;max-width:${width}px;margin:0 0 12px;vertical-align:top;font-size:14px;">${cell}</div>`,
    )
    .join(`<div class="gap" style="display:inline-block;width:12px;font-size:0;">&nbsp;</div>`);
  return `<div style="font-size:0;">${each}</div>`;
}

/** A bordered card, as on the build sheet. */
export function card(inner: string, extra = ""): string {
  return `<div style="padding:16px 18px;border:1px solid ${C.line};border-radius:12px;background:${C.sheet};${extra}">${inner}</div>`;
}

/* ------------------------------------------------------------------ dates */

const UK_DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/London" });
const UK_TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
const CALENDAR = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** "21 Nov 2026", the day in the UK when it happened. */
export const ukDay = (date: Date): string => UK_DAY.format(date);
/** "21 Nov 2026, 15:42", in UK time. */
export const ukStamp = (date: Date): string => `${UK_DAY.format(date)}, ${UK_TIME.format(date)}`;
/** A calendar day held as local midnight (a build's own day), shown as it is, not moved by time zones. */
export const calendarDay = (date: Date): string => CALENDAR.format(date);

/* ------------------------------------------------------------------ shared sections */

/** A link that opens a reply to the sender, with the subject carried over. */
export function replyHref(email: string, subject: string): string {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${subject}`)}`;
}

/** The first thing to know about a message, as a pill: black, or orange when it needs more from you. */
export function pill(text: string, tone: "ink" | "orange" = "ink"): string {
  const colours = tone === "orange" ? `background:${C.orange};color:${C.ink};` : `background:${C.ink};color:#ffffff;`;
  return `<span style="display:inline-block;padding:6px 12px;border-radius:999px;${colours}font-family:${F.mono};font-size:10px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;">${escapeHtml(text)}</span>`;
}

interface OpeningOptions {
  pill: string;
  /** Markup: escape anything a visitor typed before it goes in. */
  headline: string;
  /** Markup, as the headline. */
  lead: string;
  buttons: string;
}

/** Under the band: the pill, the big headline, a line on what it is, and what to do. */
export function opening({ pill: badge, headline, lead, buttons }: OpeningOptions): string {
  return `<div style="padding:26px 2px 10px;">
${badge}
<h1 class="headline" style="margin:16px 0 0;font-family:${F.display};font-size:36px;font-weight:800;line-height:0.95;letter-spacing:-0.01em;text-transform:uppercase;color:${C.ink};">${headline}</h1>
<p style="margin:12px 0 20px;font-size:15px;line-height:1.6;color:${C.muted};">${lead}</p>
${buttons}
</div>`;
}

/** The person a message is from: their name, a line under it, and their address. */
export function personCard(title: string, name: string, email: string, detail = ""): string {
  return card(`${label(title, C.orangeText)}
<p style="margin:0;font-size:19px;font-weight:700;line-height:1.2;color:${C.ink};">${escapeHtml(name)}</p>
${detail ? `<p style="margin:4px 0 0;font-size:13px;color:${C.muted};">${escapeHtml(detail)}</p>` : ""}
<p style="margin:10px 0 0;font-family:${F.mono};font-size:12px;word-break:break-all;"><a href="mailto:${escapeHtml(email)}" style="color:${C.orangeText};text-decoration:underline;">${escapeHtml(email)}</a></p>`);
}

/** A card of short facts: a spaced label on the left, the value on the right. Values are markup. */
export function factsCard(title: string, rows: readonly (readonly [string, string])[]): string {
  const body = rows
    .map(
      ([term, value]) =>
        `<tr><td style="padding:3px 12px 3px 0;font-family:${F.mono};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;vertical-align:top;white-space:nowrap;color:${C.faint};">${escapeHtml(term)}</td><td style="padding:3px 0;font-size:13px;font-weight:600;text-align:right;vertical-align:top;color:${C.ink};">${value}</td></tr>`,
    )
    .join("\n");
  return card(`${label(title)}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${body}
</table>`);
}

/** Two cards side by side, with room above them. */
export function cardPair(left: string, right: string): string {
  return `<div style="height:10px;line-height:10px;font-size:0;">&nbsp;</div>${columns([left, right], 264)}`;
}

/** What they wrote, on the orange rule: free text, escaped, its line breaks kept. Shows `empty` when there is nothing. */
export function writtenBlock(title: string, text: string, empty: string): string {
  const body = text
    ? `<p style="margin:0;font-size:15px;line-height:1.65;color:${C.ink};">${escapeLines(text)}</p>`
    : `<p style="margin:0;font-size:14px;line-height:1.6;color:${C.faint};">${escapeHtml(empty)}</p>`;
  return `<div style="margin:4px 0 22px;padding:16px 18px;border-left:3px solid ${C.orange};border-radius:0 12px 12px 0;background:${C.note};">
${label(title, C.orangeText)}
${body}
</div>`;
}

interface ClosingOptions {
  /** The last button, or nothing. */
  action?: string;
  replyTo: string;
  /** The right-hand end of the footer line (plain text). */
  footRight: string;
}

/** The foot of the sheet: a last button, where a reply goes, and the sheet's footer line. */
export function closing({ action = "", replyTo, footRight }: ClosingOptions): string {
  return `<div style="margin:26px 0 0;padding-top:22px;border-top:1px solid ${C.line};">
${action}
<p style="margin:6px 0 0;font-size:13px;line-height:1.6;color:${C.muted};">Or just reply to this email: it goes to <a href="mailto:${escapeHtml(replyTo)}" style="color:${C.ink};">${escapeHtml(replyTo)}</a>.</p>
</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;border-top:1px solid ${C.line};">
<tr><td class="stack" style="padding-top:12px;font-family:${F.mono};font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;color:${C.faint};">Okhare Paul · Software engineering &amp; design</td><td class="stack" style="padding-top:12px;font-family:${F.mono};font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;text-align:right;color:${C.faint};">${escapeHtml(footRight)}</td></tr>
</table>`;
}

interface BandOptions {
  /** The big word on the right: "New build". */
  title: string;
  /** Under it: "No. OP-BLD-2611-0473". */
  number: string;
  /** The strip along the band's foot. */
  strip: string;
}

/** The black band the sheet opens with: the mark, the wordmark, and the document's name and number. */
export function band({ title, number, strip }: BandOptions): string {
  const logo = `<img src="cid:${LOGO_CONTENT_ID}" width="${EMAIL_LOGO.width}" height="${EMAIL_LOGO.height}" alt="OP" style="display:block;width:${EMAIL_LOGO.width}px;height:${EMAIL_LOGO.height}px;border:0;">`;
  const wordmark = `<p style="margin:0;font-family:${F.wide};font-size:15px;font-weight:900;letter-spacing:0.16em;line-height:1.2;color:#ffffff;">OKHARE <span style="color:${C.orange};">PAUL</span></p>
<p style="margin:6px 0 0;padding-top:6px;border-top:1px solid ${C.bandLine};font-family:${F.mono};font-size:9.5px;letter-spacing:0.22em;line-height:1.4;text-transform:uppercase;color:${C.bandMuted};">Software engineering &amp; design</p>`;
  const brand = `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right:14px;vertical-align:middle;">${logo}</td><td style="vertical-align:middle;">${wordmark}</td></tr></table>`;
  const heading = `<p class="band-title" style="margin:0;font-family:${F.display};font-size:40px;font-weight:800;line-height:0.9;letter-spacing:-0.01em;text-transform:uppercase;color:#ffffff;">${escapeHtml(title)}</p>
<p style="margin:8px 0 0;font-family:${F.mono};font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${C.bandMuted};">${escapeHtml(number)}</p>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.ink};border-radius:14px;">
<tr><td style="padding:20px 22px 16px;">
<div style="font-size:0;">
<div class="col" style="display:inline-block;width:100%;max-width:262px;vertical-align:middle;font-size:14px;">${brand}</div><div class="col band-right" style="display:inline-block;width:100%;max-width:238px;vertical-align:middle;text-align:right;font-size:14px;">${heading}</div>
</div>
</td></tr>
<tr><td style="padding:12px 22px 14px;border-top:1px solid ${C.bandLine};font-family:${F.mono};font-size:10px;letter-spacing:0.16em;line-height:1.6;text-transform:uppercase;color:${C.bandMuted};">${strip}</td></tr>
</table>`;
}

interface DocumentOptions {
  /** The email's title, for apps that show one. */
  title: string;
  /** The line inbox lists show after the subject. Never shown in the email itself. */
  preheader: string;
  /** The sheet's contents. */
  body: string;
  /** Small print under the sheet. */
  footnote: string;
}

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Big+Shoulders:wght@800&family=Geist:wght@400;600;700&family=Geist+Mono:wght@400;600&family=Unbounded:wght@900&display=swap";

/** A whole email: the page, the light sheet on it, and the narrow-screen rules. */
export function emailDocument({ title, preheader, body, footnote }: DocumentOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="${FONT_LINK}">
<style>
  :root { color-scheme: light only; }
  body { margin:0; padding:0; }
  a { color:${C.ink}; }
  @media only screen and (max-width: 620px) {
    .sheet { padding:14px !important; border-radius:14px !important; }
    .col { display:block !important; max-width:100% !important; }
    .gap { display:none !important; }
    .band-right { text-align:left !important; padding-top:18px !important; }
    .band-title { font-size:38px !important; }
    .headline { font-size:30px !important; }
    .stack { display:block !important; width:100% !important; box-sizing:border-box !important; text-align:left !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};font-size:1px;line-height:1px;">${escapeHtml(preheader)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page};">
<tr><td align="center" style="padding:28px 12px 36px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td class="sheet" style="padding:24px;border:1px solid ${C.line};border-radius:18px;background:${C.sheet};font-family:${F.sans};color:${C.ink};">
${body}
</td></tr>
<tr><td style="padding:18px 8px 0;font-family:${F.sans};font-size:12px;line-height:1.6;color:${C.faint};text-align:center;">${footnote}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
