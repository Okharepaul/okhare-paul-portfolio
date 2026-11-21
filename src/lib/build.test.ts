import { describe, expect, test } from "vitest";
import { projectTypes, type Group, type ProjectTypeId } from "@/content/quote";
import {
  CORE_SECTION,
  answersFromIds,
  buildAsText,
  buildBrief,
  buildLink,
  buildNumber,
  buildStack,
  codeFromHash,
  decodeBuild,
  encodeBuild,
  fromLine,
  isBuildComplete,
} from "./build";
import { EMPTY_ANSWERS, TYPE_STEP, choose, stepsFor, type Answers } from "./quote";

const typeGroup = TYPE_STEP.groups[0];

function groupOf(answers: Answers, groupId: string): Group {
  const group = stepsFor(answers.type)
    .flatMap((step) => step.groups)
    .find((candidate) => candidate.id === groupId);
  if (!group) throw new Error(`No group "${groupId}" for ${String(answers.type)}`);
  return group;
}

function answer(start: Answers, picks: readonly (readonly [string, string])[]): Answers {
  return picks.reduce((answers, [groupId, optionId]) => choose(answers, groupOf(answers, groupId), optionId), start);
}

/** The first answer to every one-answer question: the smallest complete build. */
const smallest = (typeId: ProjectTypeId): Answers =>
  stepsFor(typeId)
    .slice(1)
    .flatMap((step) => step.groups)
    .filter((group) => group.kind === "single")
    .reduce((answers, group) => choose(answers, group, group.options[0].id), choose(EMPTY_ANSWERS, typeGroup, typeId));

/** The last answer to every one-answer question, and every extra: the biggest build there is. */
const everything = (typeId: ProjectTypeId): Answers =>
  stepsFor(typeId)
    .slice(1)
    .flatMap((step) => step.groups)
    .reduce(
      (answers, group) =>
        group.kind === "single"
          ? choose(answers, group, group.options[group.options.length - 1].id)
          : group.options.reduce((sofar, option) => choose(sofar, group, option.id), answers),
      choose(EMPTY_ANSWERS, typeGroup, typeId),
    );

const website = choose(EMPTY_ANSWERS, typeGroup, "website");
const reference = "OP-BLD-2611-0473";
const issued = new Date(2026, 10, 21);

describe("buildStack", () => {
  test("has nothing to show before a kind of project is chosen", () => {
    expect(buildStack(EMPTY_ANSWERS)).toBeNull();
  });

  test("starts with the core work of the kind, before anything else is picked", () => {
    const build = buildStack(website)!;
    const type = projectTypes.find((candidate) => candidate.id === "website")!;
    expect(build.parts.map((part) => part.title)).toEqual(type.base.map((charge) => charge.title));
    expect(build.parts.every((part) => part.section === CORE_SECTION)).toBe(true);
  });

  test("adds every pick after the core work, filed under the question it answered", () => {
    const build = buildStack(answer(website, [["size", "size-small"], ["brand", "brand-need"]]))!;
    const size = build.parts.find((part) => part.id === "size-small")!;
    const brand = build.parts.find((part) => part.id === "brand-need")!;
    expect(size).toMatchObject({ title: "Pages: Up to 5 pages", covers: "Home, about, services, contact.", section: "Scope" });
    expect(brand).toMatchObject({ title: "Logo & brand kit", section: "Look" });
    expect(build.parts.indexOf(size)).toBeLessThan(build.parts.indexOf(brand));
  });

  test("records every question, with None where nothing was picked", () => {
    const build = buildStack(answer(website, [["size", "size-medium"]]))!;
    expect(build.choices.find((choice) => choice.label === "Pages")).toEqual({ label: "Pages", value: "6 to 12 pages", picks: 1 });
    expect(build.choices.find((choice) => choice.label === "Pace")).toEqual({ label: "Pace", value: "None", picks: 0 });
  });

  test("lists the running costs a pick brings, in the order the terms give them", () => {
    const build = buildStack(answer(website, [["golive", "launch-setup"]]))!;
    expect(build.running.map((cost) => cost.id).slice(0, 2)).toEqual(["domain", "hosting"]);
  });

  test("gives every part of a build its own id", () => {
    projectTypes.forEach((type) => {
      const ids = buildStack(everything(type.id))!.parts.map((part) => part.id);
      expect(new Set(ids).size, type.id).toBe(ids.length);
    });
  });

  test("never shows a price: no part says pounds", () => {
    projectTypes.forEach((type) => {
      const text = buildAsText(buildStack(everything(type.id))!, reference);
      expect(text, type.id).not.toMatch(/£|\bGBP\b/);
    });
  });
});

describe("isBuildComplete", () => {
  test("is false until every one-answer question has its answer", () => {
    expect(isBuildComplete(EMPTY_ANSWERS)).toBe(false);
    expect(isBuildComplete(website)).toBe(false);
    projectTypes.forEach((type) => expect(isBuildComplete(smallest(type.id)), type.id).toBe(true));
  });
});

describe("buildNumber", () => {
  test("numbers a build by year, month and a four-digit serial", () => {
    expect(buildNumber(issued, 473)).toBe(reference);
    expect(buildNumber(issued, 123456)).toBe("OP-BLD-2611-3456");
    expect(buildNumber(new Date(2027, 0, 2), -7)).toBe("OP-BLD-2701-0007");
  });
});

describe("the build in a link", () => {
  test("comes back exactly as it went, for every kind of project at its biggest", () => {
    projectTypes.forEach((type) => {
      const answers = everything(type.id);
      const code = encodeBuild({ answers, reference, issued });
      expect(code, type.id).toMatch(/^[a-z0-9.-]+$/);
      const record = decodeBuild(code)!;
      expect(record.reference, type.id).toBe(reference);
      expect(record.issued.getTime(), type.id).toBe(issued.getTime());
      expect(buildStack(record.answers), type.id).toEqual(buildStack(answers));
    });
  });

  test("stays short enough for an email link", () => {
    projectTypes.forEach((type) => {
      expect(buildLink("https://theokharepaul.site", encodeBuild({ answers: everything(type.id), reference, issued })).length, type.id).toBeLessThan(700);
    });
  });

  test("refuses a build with no kind of project", () => {
    expect(() => encodeBuild({ answers: EMPTY_ANSWERS, reference, issued })).toThrow();
  });

  test("turns away anything this page did not make", () => {
    const good = "b1.website.2611-0473.20261121.size-small";
    expect(decodeBuild(good)).toMatchObject({ reference, answers: { type: "website" } });
    expect(decodeBuild("")).toBeNull();
    expect(decodeBuild("not a code at all!")).toBeNull();
    expect(decodeBuild("b1.website.2611-0473.20261121." + "x".repeat(2000))).toBeNull();
    expect(decodeBuild("b2.website.2611-0473.20261121.size-small")).toBeNull();
    expect(decodeBuild("b1.spaceship.2611-0473.20261121.size-small")).toBeNull();
    expect(decodeBuild("b1.website.2611-0473.20261121.size-small.made-up")).toBeNull();
    expect(decodeBuild("b1.website.26110473.20261121.size-small")).toBeNull();
    expect(decodeBuild("b1.website.2611-0473.20260231.size-small")).toBeNull();
    expect(decodeBuild("b1.website.2611-0473")).toBeNull();
  });

  test("will not put two answers on a one-answer question", () => {
    expect(answersFromIds("website", ["size-small", "size-large"])).toBeNull();
    expect(answersFromIds("website", ["size-small", "web-cms"])).not.toBeNull();
  });

  test("is read from the address's fragment", () => {
    expect(codeFromHash("#build=b1.website.2611-0473.20261121")).toBe("b1.website.2611-0473.20261121");
    expect(codeFromHash("#build=<script>")).toBeNull();
    expect(codeFromHash("#contact")).toBeNull();
    expect(codeFromHash("")).toBeNull();
  });
});

describe("the build as text", () => {
  test("sets out the answers, every part with what it covers, and the running costs", () => {
    const build = buildStack(answer(website, [["size", "size-small"], ["golive", "launch-setup"]]))!;
    const text = buildAsText(build, reference);
    expect(text.startsWith(`Build ${reference} · Website`)).toBe(true);
    expect(text).toContain("Pages: Up to 5 pages");
    expect(text).toContain("01 Discovery & project scope [Core]");
    expect(text).toContain(`THE PARTS (${build.parts.length})`);
    expect(text).toContain("RUNNING COSTS, PAID BY THE CLIENT DIRECT");
  });

  test("says who it is from only when it knows", () => {
    expect(fromLine({ name: " Ada ", business: "Example Studio" })).toBe("From Ada, Example Studio");
    expect(fromLine({ name: "", business: "" })).toBe("");
  });

  test("fits an email link however big the build or long the note, and never loses the link", () => {
    const client = { name: "N".repeat(80), business: "B".repeat(80) };
    projectTypes.forEach((type) => {
      const link = buildLink("https://theokharepaul.site", encodeBuild({ answers: everything(type.id), reference, issued }));
      const brief = buildBrief(buildStack(everything(type.id))!, reference, { max: 900, client, note: "n".repeat(1000), link });
      expect(brief.length, type.id).toBeLessThanOrEqual(900);
      expect(brief, type.id).toContain(`Open the full build: ${link}`);
      expect(brief, type.id).toContain(`From ${client.name}`);
    });
  });

  test("keeps a short note whole, and the answers when there is room", () => {
    const link = buildLink("https://theokharepaul.site", "code");
    const brief = buildBrief(buildStack(answer(website, [["size", "size-small"]]))!, reference, { max: 900, client: { name: "Ada", business: "" }, note: "Hello.", link });
    expect(brief.startsWith("From Ada\n\nHello.\n\nBuild OP-BLD-2611-0473 · Website")).toBe(true);
    expect(brief).toContain("Pages: Up to 5 pages");
  });
});
