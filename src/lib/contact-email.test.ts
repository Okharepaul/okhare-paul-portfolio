import { describe, expect, test } from "vitest";
import type { ContactInput } from "./contact";
import { contactEmailHtml } from "./contact-email";
import { LOGO_CONTENT_ID, escapeHtml } from "./email-html";

const input: ContactInput = {
  name: "Grace Hopper",
  email: "grace@example.com",
  need: "Web app",
  budget: "£5k to £8k",
  timeline: "",
  message: "We need a booking system.\nCan we talk next week?",
  ref_code: "",
};

const subject = "New message from Grace Hopper — Web app";
const sentAt = new Date(Date.UTC(2026, 10, 21, 9, 5));

describe("contactEmailHtml", () => {
  test("is a whole document in the site's design, with the mark carried inside it", () => {
    const html = contactEmailHtml({ input, sentAt, subject });
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain(`src="cid:${LOGO_CONTENT_ID}"`);
    expect(html).toContain("New message");
    expect(html).toContain("Grace Hopper sent you a message");
    expect(html).toContain("Enquiry · Web app");
  });

  test("says what they need in words, and marks a job with the orange pill", () => {
    expect(contactEmailHtml({ input, sentAt, subject })).toContain("wants to talk about a web app");
    const hiring = contactEmailHtml({ input: { ...input, need: "Hiring for a role" }, sentAt, subject });
    expect(hiring).toContain("is hiring for a role");
    expect(hiring).toContain("Hiring · a role");
  });

  test("shows the message with its line breaks, and the facts they gave or left out", () => {
    const html = contactEmailHtml({ input, sentAt, subject });
    expect(html).toContain("We need a booking system.<br>Can we talk next week?");
    expect(html).toContain("£5k to £8k");
    expect(html).toContain("Not given");
    expect(html).toContain("21 Nov 2026, 09:05");
  });

  test("replies to the sender with the subject carried over", () => {
    const html = contactEmailHtml({ input, sentAt, subject });
    expect(html).toContain(`href="mailto:grace%40example.com?subject=${escapeHtml(encodeURIComponent(`Re: ${subject}`))}"`);
    expect(html).toContain("Reply to Grace");
  });

  test("never lets anything the visitor typed become markup", () => {
    const html = contactEmailHtml({
      input: { ...input, name: `<script>x()</script>`, budget: `"><img src=x onerror=y()>`, message: `<a href="javascript:z()">hi</a> there` },
      sentAt,
      subject,
    });
    expect(html).not.toContain("<script>x()");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain(`<a href="javascript:`);
    expect(html).toContain("&lt;script&gt;x()&lt;/script&gt;");
  });
});
