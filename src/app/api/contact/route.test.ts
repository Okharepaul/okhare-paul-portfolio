import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "./route";

const valid = {
  name: "Grace Hopper",
  email: "grace@example.com",
  need: "Web app",
  budget: "",
  timeline: "Spring",
  message: "We need a booking system for our studio.",
  ref_code: "",
};

let ip = 0;

/** A same-site JSON post, from a fresh address each time so the rate limit never decides a test. */
function post(body: unknown): Request {
  ip += 1;
  return new Request("http://localhost:3500/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3500", origin: "http://localhost:3500", "x-real-ip": `10.1.0.${ip}` },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  const sent: {
    subject: string;
    text: string;
    html?: string;
    reply_to: string;
    attachments?: { content_id: string; content_type: string }[];
  }[] = [];

  beforeEach(() => {
    sent.length = 0;
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("CONTACT_TO_EMAIL", "owner@example.com");
    vi.stubEnv("CONTACT_FROM_EMAIL", "site@example.com");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent.push(JSON.parse(String(init.body)));
        return new Response("{}", { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("emails the message as plain text and in the site's design, with the mark inside it", async () => {
    const response = await POST(post(valid));
    expect(response.status).toBe(200);
    expect(sent).toHaveLength(1);
    const [email] = sent;
    expect(email.subject).toBe("New message from Grace Hopper — Web app");
    expect(email.reply_to).toBe("grace@example.com");
    expect(email.text).toContain("We need a booking system for our studio.");
    expect(email.html).toContain("Grace Hopper sent you a message");
    expect(email.html).toContain('src="cid:op-mark"');
    expect(email.attachments?.[0]).toMatchObject({ content_id: "op-mark", content_type: "image/png" });
  });

  test("escapes what the visitor typed in the designed version", async () => {
    await POST(post({ ...valid, message: "<b>Bold</b> plans for the studio" }));
    const [email] = sent;
    expect(email.html).toContain("&lt;b&gt;Bold&lt;/b&gt; plans");
    expect(email.html).not.toContain("<b>Bold</b>");
  });

  test("says so, and sends nothing, when email is not connected", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const response = await POST(post(valid));
    expect(response.status).toBe(503);
    expect(sent).toHaveLength(0);
  });

  test("turns away a message with a line break in the name, so nothing reaches the subject", async () => {
    const response = await POST(post({ ...valid, name: "Grace\r\nBcc: someone@example.com" }));
    expect(response.status).toBe(422);
    expect(sent).toHaveLength(0);
  });
});
