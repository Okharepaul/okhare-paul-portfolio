/**
 * Sends an email to the owner through Resend: always as plain text, and also
 * designed (HTML, with any images it carries) when the caller has a design.
 * The key and the two addresses come from the environment; without them
 * nothing is sent and the caller is told so, rather than a message being lost
 * quietly.
 */
import type { InlineImage } from "./email-html";

const SEND_TIMEOUT_MS = 8_000;
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailResult = "sent" | "unconfigured" | "failed";

export interface OwnerEmail {
  subject: string;
  /** The plain-text version. Every email has one: some apps and readers show only this. */
  text: string;
  /** The designed version. Whatever a visitor typed must already be escaped in it. */
  html?: string;
  /** Images the design shows from inside the email (`cid:` in its markup). */
  images?: readonly InlineImage[];
  /** The visitor's address, so a reply goes straight to them. */
  replyTo: string;
  /** Names the sender in the server log, e.g. "contact". */
  tag: string;
}

export async function sendToOwner({ subject, text, html, images = [], replyTo, tag }: OwnerEmail): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return "unconfigured";

  try {
    const delivery = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyTo,
        subject,
        text,
        ...(html ? { html } : {}),
        ...(images.length > 0
          ? {
              attachments: images.map((image) => ({
                filename: image.filename,
                content: image.base64,
                content_type: image.contentType,
                content_id: image.contentId,
              })),
            }
          : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!delivery.ok) {
      console.error(`[${tag}] email provider responded ${delivery.status}`);
      return "failed";
    }
    return "sent";
  } catch (error: unknown) {
    console.error(`[${tag}] email provider request failed:`, error instanceof Error ? error.name : "unknown error");
    return "failed";
  }
}
