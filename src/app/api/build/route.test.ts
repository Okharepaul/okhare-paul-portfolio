import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { encodeBuild } from "@/lib/build";
import { EMPTY_ANSWERS, TYPE_STEP, choose, stepsFor, type Answers } from "@/lib/quote";
import { POST } from "./route";

/** The first answer to every one-answer question of a website: the smallest complete build. */
const website: Answers = stepsFor("website")
  .slice(1)
  .flatMap((step) => step.groups)
  .filter((group) => group.kind === "single")
  .reduce((answers, group) => choose(answers, group, group.options[0].id), choose(EMPTY_ANSWERS, TYPE_STEP.groups[0], "website"));

const code = encodeBuild({ answers: website, reference: "OP-BLD-2611-0473", issued: new Date(2026, 10, 21) });

const valid = {
  intent: "send",
  build: code,
  name: "Ada Lovelace",
  business: "",
  email: "ada@example.com",
  note: "",
  approved: true,
  ref_code: "",
};

let ip = 0;

/** A same-site JSON post, from a fresh address each time so the rate limit never decides a test. */
function post(body: unknown): Request {
  ip += 1;
  return new Request("http://localhost:3500/api/build", {
    method: "POST",
    headers: { "content-type": "application/json", host: "localhost:3500", origin: "http://localhost:3500", "x-real-ip": `10.0.0.${ip}` },
    body: JSON.stringify(body),
  });
}

describe("POST /api/build", () => {
  const sent: {
    subject: string;
    text: string;
    html?: string;
    reply_to: string;
    attachments?: { filename: string; content: string; content_type: string; content_id: string }[];
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

  test("emails an approved build to the owner, rebuilt from its code, with a guide figure and a link", async () => {
    const response = await POST(post(valid));
    expect(response.status).toBe(200);
    expect(sent).toHaveLength(1);
    const [email] = sent;
    expect(email.subject).toBe("Build OP-BLD-2611-0473 · Website · from Ada Lovelace");
    expect(email.reply_to).toBe("ada@example.com");
    expect(email.text).toContain("They approved this build and sent it as it is.");
    expect(email.text).toContain("01 Discovery & project scope [Core]");
    expect(email.text).toMatch(/Guide figure from your draft price list: £[\d,]+\.\d\d/);
    expect(email.text).toContain(`http://localhost:3500/start-a-project#build=${code}`);
  });

  test("sends the designed version too, with the mark carried inside the email", async () => {
    const response = await POST(post({ ...valid, note: "<b>Bold</b> request" }));
    expect(response.status).toBe(200);
    const [email] = sent;
    expect(email.html).toContain("Ada Lovelace sent you a build");
    expect(email.html).toContain('src="cid:op-mark"');
    expect(email.html).toContain("&lt;b&gt;Bold&lt;/b&gt; request");
    expect(email.html).not.toContain("<b>Bold</b>");
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments?.[0]).toMatchObject({ content_id: "op-mark", content_type: "image/png", filename: "okhare-paul-mark.png" });
    expect(email.attachments?.[0].content.length).toBeGreaterThan(1000);
  });

  test("marks a build sent with questions, and needs the question", async () => {
    expect((await POST(post({ ...valid, intent: "ask" }))).status).toBe(422);
    const response = await POST(post({ ...valid, intent: "ask", note: "Can it take bookings in two languages?" }));
    expect(response.status).toBe(200);
    expect(sent[0].subject.startsWith("Questions about build OP-BLD-2611-0473")).toBe(true);
    expect(sent[0].text).toContain("Can it take bookings in two languages?");
  });

  test("sends nothing that was not approved", async () => {
    const response = await POST(post({ ...valid, approved: false }));
    expect(response.status).toBe(422);
    expect((await response.json()).fields.approved).toBeDefined();
    expect(sent).toHaveLength(0);
  });

  test("turns away a build that is not complete, or not one the page made", async () => {
    const half = encodeBuild({ answers: choose(EMPTY_ANSWERS, TYPE_STEP.groups[0], "website"), reference: "OP-BLD-2611-0473", issued: new Date(2026, 10, 21) });
    expect((await POST(post({ ...valid, build: half }))).status).toBe(422);
    expect((await POST(post({ ...valid, build: "b1.website.2611-0473.20261121.made-up" }))).status).toBe(422);
    expect(sent).toHaveLength(0);
  });

  test("keeps line breaks out of the name, which goes in the subject", async () => {
    expect((await POST(post({ ...valid, name: "Ada\nBcc: someone@example.com" }))).status).toBe(422);
  });

  test("gives a bot a quiet success and sends nothing", async () => {
    expect((await POST(post({ ...valid, ref_code: "filled" }))).status).toBe(200);
    expect(sent).toHaveLength(0);
  });

  test("refuses a post from another site", async () => {
    const request = new Request("http://localhost:3500/api/build", {
      method: "POST",
      headers: { "content-type": "application/json", host: "localhost:3500", origin: "https://elsewhere.example" },
      body: JSON.stringify(valid),
    });
    expect((await POST(request)).status).toBe(403);
  });

  test("says so when email is not connected, rather than pretending it went", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    expect((await POST(post(valid))).status).toBe(503);
  });

  test("says so when the email provider fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect((await POST(post(valid))).status).toBe(502);
  });
});
