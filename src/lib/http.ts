import { NextResponse } from "next/server";
import type { ApiResponse } from "./contact";

/**
 * The checks every form endpoint on the site makes before it reads a body:
 * same site, JSON, not too big, not a bot. Shared by the contact form and
 * "Build your stack".
 */

export const respond = <F>(body: ApiResponse<null, F>, status: number): NextResponse<ApiResponse<null, F>> =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export const fail = (error: string, status: number): NextResponse<ApiResponse<null, never>> => respond<never>({ success: false, error }, status);

/** A browser form post from another site carries that site's Origin: refuse it. */
export function isCrossOrigin(request: Request): boolean {
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
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",") ?? [];
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    forwarded[forwarded.length - 1]?.trim() ||
    "unknown"
  );
}

export function isJson(request: Request): boolean {
  return request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() === "application/json";
}

/** True when the declared size is already over the cap, so the body is never read. */
export function declaresOversizedBody(request: Request, maxBytes: number): boolean {
  const declared = Number(request.headers.get("content-length"));
  return Number.isFinite(declared) && declared > maxBytes;
}

/** The body as JSON. Throws a RangeError when it is over the cap, whatever the headers said. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new RangeError("Body too large");
  return JSON.parse(text) as unknown;
}

/** People never see the `ref_code` field; bots fill it in. */
export function hasFilledHoneypot(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const trap = (body as Record<string, unknown>).ref_code;
  return typeof trap === "string" && trap.length > 0;
}
