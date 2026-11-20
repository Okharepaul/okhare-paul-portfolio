import { NextResponse } from "next/server";
import { contactSchema, formatMessage, toFieldErrors, type ApiResponse } from "@/lib/contact";
import { createRateLimiter } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 12_000;
const SEND_TIMEOUT_MS = 8_000;
const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Five messages per ten minutes from one address.
const limiter = createRateLimiter(5, 10 * 60 * 1000);

const respond = (body: ApiResponse<null>, status: number): NextResponse<ApiResponse<null>> =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const fail = (error: string, status: number): NextResponse<ApiResponse<null>> => respond({ success: false, error }, status);

/** A browser form post from another site carries that site's Origin: refuse it. */
function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

/**
 * Rate-limit key. Prefer the headers the hosting platform sets itself; the
 * left-most x-forwarded-for entry is client-supplied behind some proxies.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",") ?? [];
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    forwarded[forwarded.length - 1]?.trim() ||
    "unknown"
  );
}

function isJson(request: Request): boolean {
  return request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() === "application/json";
}

/** True when the declared size is already over the cap, so the body is never read. */
function declaresOversizedBody(request: Request): boolean {
  const declared = Number(request.headers.get("content-length"));
  return Number.isFinite(declared) && declared > MAX_BODY_BYTES;
}

async function readJson(request: Request): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) throw new RangeError("Body too large");
  return JSON.parse(text) as unknown;
}

function hasFilledHoneypot(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const trap = (body as Record<string, unknown>).ref_code;
  return typeof trap === "string" && trap.length > 0;
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<null>>> {
  if (isCrossOrigin(request)) return fail("This form only accepts messages sent from this site.", 403);
  if (!isJson(request)) return fail("Send the form as JSON.", 415);
  if (declaresOversizedBody(request)) return fail("That message is too long to send.", 413);
  if (!limiter.check(clientKey(request))) {
    return fail("Too many messages in a short time. Wait ten minutes and try again.", 429);
  }

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error: unknown) {
    return error instanceof RangeError
      ? fail("That message is too long to send.", 413)
      : fail("The form data couldn't be read. Reload the page and try again.", 400);
  }

  // Bots that fill the hidden field get a quiet success and nothing is sent.
  if (hasFilledHoneypot(body)) return respond({ success: true, data: null }, 200);

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return respond(
      { success: false, error: "Check the highlighted fields and send again.", fields: toFieldErrors(parsed.error) },
      422,
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    // Not wired to an email service yet. Say so rather than pretending the message went.
    return fail("The form isn't connected to email yet.", 503);
  }

  const input = parsed.data;
  try {
    const delivery = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: input.email,
        subject: `New message from ${input.name} — ${input.need}`,
        text: formatMessage(input),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!delivery.ok) {
      console.error(`[contact] email provider responded ${delivery.status}`);
      return fail("The message didn't send.", 502);
    }
  } catch (error: unknown) {
    console.error("[contact] email provider request failed:", error instanceof Error ? error.name : "unknown error");
    return fail("The message didn't send.", 502);
  }

  return respond({ success: true, data: null }, 200);
}
