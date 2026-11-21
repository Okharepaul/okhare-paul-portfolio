import { describe, expect, test } from "vitest";
import { buildStack } from "./build";
import { buildEmailHtml, type BuildEmailInput } from "./build-email";
import { LOGO_CONTENT_ID, escapeHtml, escapeLines } from "./email-html";
import { EMPTY_ANSWERS, TYPE_STEP, buildQuote, choose, stepsFor, type Answers } from "./quote";

/** The first answer to every one-answer question of a website: the smallest complete build. */
const website: Answers = stepsFor("website")
  .slice(1)
  .flatMap((step) => step.groups)
  .filter((group) => group.kind === "single")
  .reduce((answers, group) => choose(answers, group, group.options[0].id), choose(EMPTY_ANSWERS, TYPE_STEP.groups[0], "website"));

const build = buildStack(website);
const guide = buildQuote(website);
if (!build || !guide) throw new Error("The test build did not build.");

const base: BuildEmailInput = {
  intent: "send",
  name: "Ada Lovelace",
  business: "Analytical Engines",
  email: "ada@example.com",
  note: "",
  build,
  reference: "OP-BLD-2611-0473",
  issued: new Date(2026, 10, 21),
  sentAt: new Date(Date.UTC(2026, 10, 21, 15, 42)),
  guide,
  link: "http://localhost:3500/start-a-project#build=b1.website.2611-0473.20261121",
  subject: "Build OP-BLD-2611-0473 · Website · from Ada Lovelace",
};

describe("escapeHtml", () => {
  test("turns every character that could open markup or end an attribute into an entity", () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe("&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;");
  });

  test("keeps line breaks of free text as breaks", () => {
    expect(escapeLines("one\r\ntwo\n<b>")).toBe("one<br>two<br>&lt;b&gt;");
  });
});

describe("buildEmailHtml", () => {
  test("is a whole document that shows the mark from inside the email", () => {
    const html = buildEmailHtml(base);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(`src="cid:${LOGO_CONTENT_ID}"`);
    expect(html).toContain("No. OP-BLD-2611-0473");
  });

  test("lists every part, numbered, in the order of the build", () => {
    const html = buildEmailHtml(base);
    const positions = build.parts.map((part) => html.indexOf(escapeHtml(part.title)));
    expect(positions.every((at) => at > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(html).toContain(`>${String(build.parts.length).padStart(2, "0")}<`);
  });

  test("says what the client wants: sent as it is, or questions first", () => {
    expect(buildEmailHtml(base)).toContain("Ada Lovelace sent you a build");
    expect(buildEmailHtml(base)).toContain("Approved · sent as it is");
    const asking = buildEmailHtml({ ...base, intent: "ask", note: "Can it take bookings?" });
    expect(asking).toContain("Ada Lovelace has questions about a build");
    expect(asking).toContain("Approved · has questions");
  });

  test("never lets anything the visitor typed become markup", () => {
    const html = buildEmailHtml({
      ...base,
      name: `<script>alert(1)</script>`,
      business: `"><img src=x onerror=alert(2)>`,
      note: `Hello\n<a href="javascript:alert(3)">click</a>`,
    });
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain(`<a href="javascript:`);
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Hello<br>&lt;a href=");
  });

  test("replies by mail to the client, with the subject carried over and encoded", () => {
    const html = buildEmailHtml(base);
    expect(html).toContain(`href="mailto:ada%40example.com?subject=${escapeHtml(encodeURIComponent(`Re: ${base.subject}`))}"`);
    expect(html).toContain("Reply to Ada");
  });

  test("shows the note when there is one, and says so when there is none", () => {
    expect(buildEmailHtml({ ...base, note: "Launch before March, please." })).toContain("Launch before March, please.");
    expect(buildEmailHtml(base)).toContain("No note. They sent the build as it is.");
  });

  test("keeps the guide figure for the owner and says the client never saw one", () => {
    const html = buildEmailHtml(base);
    expect(html).toContain("For your eyes only");
    expect(html).toMatch(/£[\d,]+\.\d\d/);
    expect(html).toContain("The client was not shown a price.");
  });

  test("dates the sending in UK time and the build by its own calendar day", () => {
    const html = buildEmailHtml(base);
    expect(html).toContain("21 Nov 2026, 15:42");
    expect(html).toMatch(/Built on<\/td><td[^>]*>21 Nov 2026</);
  });
});
