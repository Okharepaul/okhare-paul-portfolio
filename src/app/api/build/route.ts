import type { NextResponse } from "next/server";
import { site } from "@/content/site";
import { buildLink, buildStack, decodeBuild, encodeBuild, isBuildComplete } from "@/lib/build";
import { buildRequestSchema, ownerEmail, type BuildFieldErrors } from "@/lib/build-request";
import { toFieldErrors, type ApiResponse } from "@/lib/contact";
import { sendToOwner } from "@/lib/email";
import { LOGO_IMAGE } from "@/lib/email-html";
import { clientKey, declaresOversizedBody, fail, hasFilledHoneypot, isCrossOrigin, isJson, readJson, respond } from "@/lib/http";
import { buildQuote } from "@/lib/quote";
import { createRateLimiter } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 8_000;

// Five builds per ten minutes from one address.
const limiter = createRateLimiter(5, 10 * 60 * 1000);

/** Links in the email open the live site; while developing, they open the copy that sent them. */
function siteOrigin(request: Request): string {
  return process.env.NODE_ENV === "production" ? site.url : new URL(request.url).origin;
}

/**
 * "Send to Paul": a visitor's approved build, emailed to the owner. The build
 * arrives as its code and is rebuilt here from the price list's own options,
 * so what reaches the owner is exactly what the page showed.
 */
export async function POST(request: Request): Promise<NextResponse<ApiResponse<null, BuildFieldErrors>>> {
  if (isCrossOrigin(request)) return fail("This form only accepts builds sent from this site.", 403);
  if (!isJson(request)) return fail("Send the build as JSON.", 415);
  if (declaresOversizedBody(request, MAX_BODY_BYTES)) return fail("That build is too long to send.", 413);
  if (!limiter.check(clientKey(request))) {
    return fail("Too many builds in a short time. Wait ten minutes and try again.", 429);
  }

  let body: unknown;
  try {
    body = await readJson(request, MAX_BODY_BYTES);
  } catch (error: unknown) {
    return error instanceof RangeError
      ? fail("That build is too long to send.", 413)
      : fail("The build couldn't be read. Reload the page and try again.", 400);
  }

  // Bots that fill the hidden field get a quiet success and nothing is sent.
  if (hasFilledHoneypot(body)) return respond({ success: true, data: null }, 200);

  const parsed = buildRequestSchema.safeParse(body);
  if (!parsed.success) {
    return respond(
      { success: false, error: "Check the highlighted fields and send again.", fields: toFieldErrors<BuildFieldErrors>(parsed.error) },
      422,
    );
  }

  const input = parsed.data;
  const record = decodeBuild(input.build);
  const build = record ? buildStack(record.answers) : null;
  const guide = record ? buildQuote(record.answers) : null;
  if (!record || !build || !guide || !isBuildComplete(record.answers)) {
    return fail("This build is missing answers. Go back through the questions and send it again.", 422);
  }

  const { subject, text, html } = ownerEmail({
    input,
    build,
    reference: record.reference,
    issued: record.issued,
    sentAt: new Date(),
    guide,
    link: buildLink(siteOrigin(request), encodeBuild(record)),
  });
  const result = await sendToOwner({ subject, text, html, images: [LOGO_IMAGE], replyTo: input.email, tag: "build" });
  if (result === "unconfigured") return fail("Sending isn't connected to email yet.", 503);
  if (result === "failed") return fail("Your build didn't send.", 502);
  return respond({ success: true, data: null }, 200);
}
