/**
 * What "Send to Paul" posts, and the email it becomes. The build travels as
 * its code, not as text, so the server rebuilds it from the price list's own
 * options: nothing the visitor's browser says about a part reaches the owner
 * unchecked, and only the name, the note and the address are free text.
 */
import { z } from "zod";
import { BUILD_CODE_MAX, buildAsText, fromLine, type Build, type BuildClient } from "./build";
import { buildEmailHtml } from "./build-email";
import { singleLine } from "./contact";
import { formatGBP, type Quote } from "./quote";

export const BUILD_NOTE_MAX = 1000;
/** The shortest note that counts as a question, when the visitor asks for more rather than sending as it is. */
export const ASK_NOTE_MIN = 10;

export const buildRequestSchema = z
  .object({
    /** "send": the build as it is. "ask": the build, with questions or more features to talk through. */
    intent: z.enum(["send", "ask"]),
    build: z.string().min(1).max(BUILD_CODE_MAX),
    name: singleLine(80).min(2, "Enter your name."),
    business: singleLine(80).optional().default(""),
    email: z.email("Enter an email address like name@example.com.").max(160),
    note: z.string().trim().max(BUILD_NOTE_MAX, `Keep the note under ${BUILD_NOTE_MAX} characters.`).optional().default(""),
    /** The visitor ticked "I approve this build". Nothing is sent without it. */
    approved: z.literal(true, { error: "Approve your build before you send it." }),
    /** Honeypot. People never see this field; bots fill it in. */
    ref_code: z.string().max(0).optional().default(""),
  })
  .refine((input) => input.intent === "send" || input.note.length >= ASK_NOTE_MIN, {
    path: ["note"],
    message: "Tell me what you would like to add or ask, in a sentence or two.",
  });

export type BuildRequest = z.infer<typeof buildRequestSchema>;

export type BuildFieldErrors = Partial<Record<"name" | "business" | "email" | "note" | "approved", string>>;

type OwnerEmailInput = {
  input: BuildRequest;
  build: Build;
  reference: string;
  /** The day the build was made. */
  issued: Date;
  /** When it was sent. */
  sentAt: Date;
  /** The owner's price list run over the same answers. For his eyes; the visitor never sees a figure. */
  guide: Quote;
  /** Opens the build on the page, ready to save as a PDF. */
  link: string;
};

/** The email a sent build arrives as: its subject, the plain-text body, and the designed one. */
export function ownerEmail({ input, build, reference, issued, sentAt, guide, link }: OwnerEmailInput): { subject: string; text: string; html: string } {
  const client: BuildClient = { name: input.name, business: input.business };
  const isAsking = input.intent === "ask";
  const subject = `${isAsking ? "Questions about build" : "Build"} ${reference} · ${build.type.label} · from ${input.name}`;
  const priority = guide.priority ? `, including ${guide.priority.label.toLowerCase()} (+${guide.priority.percent}%)` : "";

  const text = [
    fromLine(client),
    isAsking
      ? "They approved this build and want to talk through more features or details first."
      : "They approved this build and sent it as it is.",
    `Reply to: ${input.email}`,
    "",
    "THEIR NOTE",
    input.note || "No note.",
    "",
    buildAsText(build, reference),
    "",
    "FOR YOUR EYES ONLY",
    `Guide figure from your draft price list: ${formatGBP(guide.total)}${priority}. The client was not shown a price.`,
    `Open the build to save it as a PDF: ${link}`,
  ].join("\n");

  const { intent, name, business, email, note } = input;
  const html = buildEmailHtml({ intent, name, business, email, note, build, reference, issued, sentAt, guide, link, subject });
  return { subject, text, html };
}
