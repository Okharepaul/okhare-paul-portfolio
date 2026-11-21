/**
 * The email a contact-form message arrives as, in the same design as the
 * build email: the black band with the mark, who wrote and what they need,
 * their message on the orange rule, and a way to reply. The plain-text
 * version (formatMessage in contact.ts) travels with it.
 */
import type { ContactInput } from "./contact";
import {
  EMAIL_COLOURS as C,
  band,
  button,
  cardPair,
  closing,
  emailDocument,
  escapeHtml,
  factsCard,
  opening,
  personCard,
  pill,
  replyHref,
  ukDay,
  ukStamp,
  writtenBlock,
} from "./email-html";

export interface ContactEmailInput {
  input: ContactInput;
  sentAt: Date;
  /** The email's subject, for the reply link. */
  subject: string;
}

type Need = ContactInput["need"];

/** What they want, as the end of "… wants to talk about …". A role or "something else" read better said their own way. */
const NEED_PHRASES: Record<Need, string> = {
  "Web app": "wants to talk about a web app",
  "Mobile app": "wants to talk about a mobile app",
  AI: "wants to talk about AI work",
  Cloud: "wants to talk about cloud work",
  "Brand & design": "wants to talk about brand and design",
  "Hiring for a role": "is hiring for a role and got in touch about it",
  "Something else": "has something else in mind",
};

/** A job is the one enquiry that is not a project: it gets the orange pill. */
const isHiring = (need: Need): boolean => need === "Hiring for a role";

/** A fact they gave, or a quiet "Not given". */
const given = (value: string): string => (value ? escapeHtml(value) : `<span style="font-weight:400;color:${C.faint};">Not given</span>`);

/** The designed email for a contact-form message. */
export function contactEmailHtml({ input, sentAt, subject }: ContactEmailInput): string {
  const { name, email, need, budget, timeline, message } = input;
  const who = escapeHtml(name);
  const firstName = name.trim().split(/\s+/)[0] ?? name;
  const reply = button(replyHref(email, subject), `Reply to ${firstName}`);

  const body = [
    band({ title: "New message", number: `Re: ${need}`, strip: `From the contact form &nbsp;·&nbsp; ${ukDay(sentAt)}` }),
    opening({
      pill: isHiring(need) ? pill("Hiring · a role", "orange") : pill(`Enquiry · ${need}`),
      headline: `${who} sent you a message`,
      lead: `${who} ${escapeHtml(NEED_PHRASES[need])}. Their message is below. Reply and it goes straight to them.`,
      buttons: reply,
    }),
    cardPair(
      personCard("From", name, email),
      factsCard("The enquiry", [
        ["Need", escapeHtml(need)],
        ["Budget", given(budget)],
        ["Timeline", given(timeline)],
        ["Sent", ukStamp(sentAt)],
      ]),
    ),
    writtenBlock("Their message", message, "No message."),
    closing({ action: reply, replyTo: email, footRight: "Contact form · theokharepaul.site" }),
  ].join("\n");

  return emailDocument({
    title: subject,
    preheader: `${name} ${NEED_PHRASES[need]}. ${message.slice(0, 90)}`,
    body,
    footnote: "Sent to you from the contact form on theokharepaul.site. Replies go to the sender.",
  });
}
