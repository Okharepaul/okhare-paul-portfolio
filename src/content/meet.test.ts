import { describe, expect, test } from "vitest";
import { cv } from "./cv";
import { about, journeyNote, path, services } from "./home";
import { chapters, interests, meet, onPaper, strengths } from "./meet";
import { projects } from "./projects";

/**
 * The page's text is cut out of copy that lives elsewhere (the About
 * paragraph by sentence, the path and the results by position). These tests
 * are the guard: if that copy is reworded or reordered, they fail here
 * instead of the page quietly printing the wrong sentence, or none.
 */

describe("the chapters of Meet the developer", () => {
  test("there are five, each with a title, a place and time, and something to say", () => {
    expect(chapters).toHaveLength(5);
    chapters.forEach((chapter) => {
      expect(chapter.title, chapter.id).toMatch(/^The \w+$/);
      expect(chapter.kicker.length, chapter.id).toBeGreaterThan(5);
      expect(chapter.body.length, chapter.id).toBeGreaterThan(60);
      expect(chapter.body, chapter.id).toMatch(/\.$/);
    });
  });

  test("no sentence went missing when the copy was cut up", () => {
    const everything = JSON.stringify({ chapters, meet });
    expect(everything).not.toContain("undefined");
    chapters.forEach((chapter) => {
      chapter.facts.forEach((fact) => expect(fact.value.length, `${chapter.id} · ${fact.label}`).toBeGreaterThan(3));
    });
  });

  test("every sentence is one already on the site, word for word", () => {
    const source = [about.lead, about.body, path[0].description, services[3].copy].join(" ");
    chapters.forEach((chapter) => {
      chapter.body.split(/(?<=\.)\s+/).forEach((sentence) => expect(source, chapter.id).toContain(sentence));
    });
    expect(meet.prologue.text).toBe(journeyNote);
  });

  test("each chapter is about what its title says", () => {
    const body = (id: string): string => chapters.find((chapter) => chapter.id === id)?.body ?? "";
    expect(body("engineer")).toContain("delivery drone");
    expect(body("researcher")).toContain("dissertation");
    expect(body("developer")).toContain("AXIG");
    expect(body("founder")).toContain("my own studio");
    expect(body("designer")).toContain("Logos");
  });

  test("the awards and the figures are the ones from the results", () => {
    const facts = chapters.flatMap((chapter) => chapter.facts.map((fact) => fact.value));
    expect(facts.some((value) => value.includes("PGXPO 2025 Research Innovation Award"))).toBe(true);
    expect(facts.some((value) => value.startsWith("25% faster page loads"))).toBe(true);
    expect(facts.some((value) => value.startsWith("30% higher task completion"))).toBe(true);
  });

  test("links to case studies point at projects that exist", () => {
    const slugs = new Set(projects.map((project) => project.slug));
    chapters.forEach((chapter) => {
      const match = chapter.link?.href.match(/^\/project\/(.+)$/);
      if (match) expect(slugs.has(match[1]), chapter.link?.href).toBe(true);
    });
  });
});

describe("the rest of the page", () => {
  test("strengths, interests and the profile are the CV's and the home page's own", () => {
    expect(strengths.items).toBe(cv.strengths);
    expect(interests.items).toBe(cv.interests);
    expect(onPaper.rows).toBe(about.profile);
  });
});
