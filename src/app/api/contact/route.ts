import type { NextResponse } from "next/server";
import { contactSchema, formatMessage, toFieldErrors, type ApiResponse, type FieldErrors } from "@/lib/contact";
import { contactEmailHtml } from "@/lib/contact-email";
import { sendToOwner } from "@/lib/email";
import { LOGO_IMAGE } from "@/lib/email-html";
import { clientKey, declaresOversizedBody, fail, hasFilledHoneypot, isCrossOrigin, isJson, readJson, respond } from "@/lib/http";
import { createRateLimiter } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 12_000;

// Five messages per ten minutes from one address.
const limiter = createRateLimiter(5, 10 * 60 * 1000);

export async function POST(request: Request): Promise<NextResponse<ApiResponse<null, FieldErrors>>> {
  if (isCrossOrigin(request)) return fail("This form only accepts messages sent from this site.", 403);
  if (!isJson(request)) return fail("Send the form as JSON.", 415);
  if (declaresOversizedBody(request, MAX_BODY_BYTES)) return fail("That message is too long to send.", 413);
  if (!limiter.check(clientKey(request))) {
    return fail("Too many messages in a short time. Wait ten minutes and try again.", 429);
  }

  let body: unknown;
  try {
    body = await readJson(request, MAX_BODY_BYTES);
  } catch (error: unknown) {
    return error instanceof RangeError
      ? fail("That message is too long to send.", 413)
      : fail("The form data couldn't be read. Reload the page and try again.", 400);
  }

  // Bots that fill the hidden field get a quiet success and nothing is sent.
  if (hasFilledHoneypot(body)) return respond({ success: true, data: null }, 200);

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return respond({ success: false, error: "Check the highlighted fields and send again.", fields: toFieldErrors(parsed.error) }, 422);
  }

  const input = parsed.data;
  const subject = `New message from ${input.name} — ${input.need}`;
  const result = await sendToOwner({
    subject,
    text: formatMessage(input),
    html: contactEmailHtml({ input, sentAt: new Date(), subject }),
    images: [LOGO_IMAGE],
    replyTo: input.email,
    tag: "contact",
  });
  // Not wired to an email service yet: say so rather than pretending the message went.
  if (result === "unconfigured") return fail("The form isn't connected to email yet.", 503);
  if (result === "failed") return fail("The message didn't send.", 502);
  return respond({ success: true, data: null }, 200);
}
