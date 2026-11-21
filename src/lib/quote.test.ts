import { describe, expect, test } from "vitest";
import { paymentTerms, projectTypes, runningCosts, sharedSteps, type Group } from "@/content/quote";
import {
  EMPTY_ANSWERS,
  TYPE_STEP,
  buildQuote,
  choose,
  formatDate,
  formatShortDate,
  formatGBP,
  getType,
  isStepComplete,
  selectedIds,
  coreAt,
  startingFrom,
  stepsFor,
  type Answers,
} from "./quote";

const typeGroup = TYPE_STEP.groups[0];

/** Finds a group among the questions a project is asked. */
function groupOf(answers: Answers, groupId: string): Group {
  const group = stepsFor(answers.type)
    .flatMap((step) => step.groups)
    .find((candidate) => candidate.id === groupId);
  if (!group) throw new Error(`No group "${groupId}" for ${String(answers.type)}`);
  return group;
}

/** Answers a run of questions in order: [groupId, optionId] pairs. */
function answer(start: Answers, picks: readonly (readonly [string, string])[]): Answers {
  return picks.reduce((answers, [groupId, optionId]) => choose(answers, groupOf(answers, groupId), optionId), start);
}

const store = choose(EMPTY_ANSWERS, typeGroup, "store");

describe("the price list", () => {
  test("gives every option a unique id within its project, and every charge a positive whole price", () => {
    projectTypes.forEach((type) => {
      const options = stepsFor(type.id)
        .flatMap((step) => step.groups)
        .flatMap((group) => group.options);
      const ids = options.map((option) => option.id);
      expect(new Set(ids).size, type.id).toBe(ids.length);
      [...type.base, ...options.flatMap((option) => (option.charge ? [option.charge] : []))].forEach((charge) => {
        expect(Number.isInteger(charge.price), charge.title).toBe(true);
        expect(charge.price, charge.title).toBeGreaterThan(0);
        expect(charge.covers.length, charge.title).toBeGreaterThan(10);
        expect(charge.why.length, charge.title).toBeGreaterThan(10);
      });
    });
  });

  test("asks every project how big it is, and ends every project on the timeline", () => {
    projectTypes.forEach((type) => {
      const steps = stepsFor(type.id);
      expect(steps[0], type.id).toBe(TYPE_STEP);
      expect(steps.some((step) => step.groups.some((group) => group.id === "size")), type.id).toBe(true);
      expect(steps[steps.length - 1], type.id).toBe(sharedSteps.timeline);
    });
  });

  test("names only running costs that have an explanation", () => {
    const known = Object.keys(runningCosts);
    projectTypes.forEach((type) => type.running.forEach((id) => expect(known).toContain(id)));
    projectTypes.forEach((type) =>
      stepsFor(type.id)
        .flatMap((step) => step.groups)
        .flatMap((group) => group.options)
        .forEach((option) => option.running?.forEach((id) => expect(known, option.id).toContain(id))),
    );
  });

  test("keeps every question of a project apart, by id and by the label it carries on the quote", () => {
    projectTypes.forEach((type) => {
      const groups = stepsFor(type.id).flatMap((step) => step.groups);
      const steps = stepsFor(type.id).map((step) => step.id);
      expect(new Set(groups.map((group) => group.id)).size, type.id).toBe(groups.length);
      expect(new Set(groups.map((group) => group.legend)).size, type.id).toBe(groups.length);
      expect(new Set(steps).size, type.id).toBe(steps.length);
    });
  });

  test("lets only the size question scale the build, and only the pace question rush it", () => {
    projectTypes.forEach((type) => {
      const groups = stepsFor(type.id).flatMap((step) => step.groups);
      const sizing = groups.filter((group) => group.options.some((option) => option.factor !== undefined));
      const pacing = groups.filter((group) => group.options.some((option) => (option.percent ?? 0) > 0));
      expect(sizing.map((group) => group.id), type.id).toEqual(type.id === "brand" ? [] : ["size"]);
      expect(pacing.map((group) => group.id), type.id).toEqual(["timeline"]);
    });
  });

  test("offers a mobile app, before the web application, priced well above it at every size", () => {
    const ids = projectTypes.map((type) => type.id);
    expect(ids.indexOf("mobile")).toBeLessThan(ids.indexOf("webapp"));
    const mobile = getType("mobile")!;
    const webapp = getType("webapp")!;
    expect(startingFrom(mobile)).toBeGreaterThan(startingFrom(webapp) * 1.75);
    [0.7, 1, 1.5, 2.1].forEach((factor) => expect(coreAt(mobile, factor), String(factor)).toBeGreaterThan(coreAt(webapp, factor) * 1.75));
  });

  test("splits payment into parts that make the whole", () => {
    expect(paymentTerms.upfront.percent + paymentTerms.completion.percent).toBe(100);
  });
});

describe("stepsFor", () => {
  test("asks only the first question until a kind of project is chosen", () => {
    expect(stepsFor(null)).toEqual([TYPE_STEP]);
  });

  test("leaves the look of the thing out of projects that have no screens", () => {
    expect(stepsFor("automation").map((step) => step.id)).not.toContain("look");
    expect(stepsFor("website").map((step) => step.id)).toContain("look");
  });
});

describe("choose", () => {
  test("swaps the answer in a one-answer group", () => {
    const first = answer(store, [["size", "size-small"]]);
    const second = answer(first, [["size", "size-large"]]);
    expect(selectedIds(second, "size")).toEqual(["size-large"]);
  });

  test("adds to a pick-any group, and takes the option out when it is picked again", () => {
    const two = answer(store, [
      ["shop-run", "shop-admin"],
      ["shop-run", "shop-vat"],
    ]);
    expect(selectedIds(two, "shop-run")).toEqual(["shop-admin", "shop-vat"]);
    expect(selectedIds(answer(two, [["shop-run", "shop-admin"]]), "shop-run")).toEqual(["shop-vat"]);
  });

  test("starts the later answers again when the kind of project changes, and never changes its input", () => {
    const before = answer(store, [["size", "size-small"]]);
    const snapshot = JSON.stringify(before);
    const after = choose(before, typeGroup, "website");
    expect(after.type).toBe("website");
    expect(after.choices).toEqual({});
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  test("ignores an option the group does not have", () => {
    expect(choose(store, groupOf(store, "size"), "not-an-option")).toBe(store);
  });
});

describe("isStepComplete", () => {
  test("holds a step until its one-answer questions are answered, and never waits on a pick-any question", () => {
    const [, scope, features] = stepsFor("store");
    expect(isStepComplete(TYPE_STEP, EMPTY_ANSWERS)).toBe(false);
    expect(isStepComplete(TYPE_STEP, store)).toBe(true);
    expect(isStepComplete(scope, store)).toBe(false);
    expect(isStepComplete(scope, answer(store, [["size", "size-small"]]))).toBe(true);
    expect(isStepComplete(features, store)).toBe(true);
  });
});

describe("buildQuote", () => {
  test("has nothing to price before a kind of project is chosen", () => {
    expect(buildQuote(EMPTY_ANSWERS)).toBeNull();
  });

  test("reproduces the owner's invoice for a small store, less the domain he no longer pays for", () => {
    // Invoice OP-2611-0473: £3,725 including a £200 line for domain and hosting, now the client's own cost.
    const answers = answer(store, [
      ["size", "size-small"],
      ["shop-run", "shop-admin"],
      ["brand", "brand-need"],
      ["finish", "finish-clean"],
      ["care", "launch-support"],
      ["timeline", "time-standard"],
    ]);
    const quote = buildQuote(answers);
    expect(quote?.subtotal).toBe(3525);
    expect(quote?.priority).toBeNull();
    expect(quote?.total).toBe(3525);
    expect(quote?.lines.map((line) => line.title)).toEqual([
      "Discovery & project scope",
      "UI/UX design",
      "Frontend development",
      "Backend & database",
      "Payment integration",
      "Testing, SEO & go-live",
      "Admin dashboard",
      "Logo & brand kit",
      "Launch support & handover",
    ]);
  });

  test("gives a running figure from the first answer on", () => {
    const quote = buildQuote(store);
    expect(quote?.lines).toHaveLength(getType("store")?.base.length ?? 0);
    expect(quote?.total).toBe(2675);
  });

  test("grows only the work that depends on size, in round fives", () => {
    const small = buildQuote(answer(store, [["size", "size-small"]]));
    const large = buildQuote(answer(store, [["size", "size-large"]]));
    const price = (quote: typeof small, id: string): number => quote?.lines.find((line) => line.id === id)?.price ?? Number.NaN;
    expect(price(large, "payments")).toBe(price(small, "payments"));
    expect(price(large, "frontend")).toBeGreaterThan(price(small, "frontend"));
    large?.lines.forEach((line) => expect(line.price % 5, line.title).toBe(0));
  });

  test("adds a rushed deadline as a percentage of the build, and splits the total 60/40", () => {
    const rushed = buildQuote(answer(store, [["size", "size-small"], ["timeline", "time-priority"]]));
    expect(rushed?.priority?.percent).toBe(20);
    expect(rushed?.priority?.amount).toBe(Math.round((rushed?.subtotal ?? 0) * 0.2));
    expect(rushed?.total).toBe((rushed?.subtotal ?? 0) + (rushed?.priority?.amount ?? 0));
    expect((rushed?.upfront ?? 0) + (rushed?.completion ?? 0)).toBeCloseTo(rushed?.total ?? 0, 2);
    expect(rushed?.upfront).toBeCloseTo((rushed?.total ?? 0) * 0.6, 2);
  });

  test("splits every total into two parts that are whole pence and add back up exactly", () => {
    projectTypes.forEach((type) => {
      const typed = choose(EMPTY_ANSWERS, typeGroup, type.id);
      [typed, answer(typed, [["timeline", "time-priority"]])].forEach((answers) => {
        const quote = buildQuote(answers)!;
        expect(Number.isInteger(Math.round(quote.upfront * 100)), type.id).toBe(true);
        expect(Math.round(quote.upfront * 100) + Math.round(quote.completion * 100), type.id).toBe(Math.round(quote.total * 100));
        expect(quote.completion, type.id).toBe(Number(quote.completion.toFixed(2)));
      });
    });
  });

  test("lists the running costs the project brings, without repeats", () => {
    const quote = buildQuote(answer(choose(EMPTY_ANSWERS, typeGroup, "webapp"), [["app-business", "app-payments"], ["app-work", "app-ai"]]));
    const ids = quote?.running.map((cost) => cost.id) ?? [];
    expect(ids).toEqual(expect.arrayContaining(["domain", "hosting", "payments", "ai"]));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("records every question in the summary, answered or not", () => {
    const quote = buildQuote(answer(store, [["size", "size-small"]]));
    expect(quote?.summary.find((row) => row.label === "Catalogue")?.value).toBe("Up to 50 products");
    expect(quote?.summary.find((row) => row.label === "Running it")?.value).toBe("None");
  });

  test("prices every kind of project from its first answer, at the figure its tile promised", () => {
    projectTypes.forEach((type) => {
      const quote = buildQuote(choose(EMPTY_ANSWERS, typeGroup, type.id));
      const atOrdinarySize = type.base.reduce((sum, charge) => sum + charge.price, 0);
      expect(startingFrom(type), type.id).toBeGreaterThan(0);
      expect(startingFrom(type), type.id).toBeLessThanOrEqual(atOrdinarySize);
      expect(quote?.total, type.id).toBe(startingFrom(type));
    });
  });

  test("never lowers the figure when a size is chosen", () => {
    projectTypes.forEach((type) => {
      const typed = choose(EMPTY_ANSWERS, typeGroup, type.id);
      const sizes = type.steps.flatMap((step) => step.groups).find((group) => group.options.some((option) => option.factor !== undefined));
      sizes?.options.forEach((option) => {
        const sized = buildQuote(choose(typed, sizes, option.id));
        expect(sized?.total, option.id).toBeGreaterThanOrEqual(startingFrom(type));
        expect(sized?.total, option.id).toBe(coreAt(type, option.factor ?? 1) + (option.charge?.price ?? 0));
      });
    });
  });
});

describe("formatting", () => {
  test("writes pounds with pence and thousands", () => {
    expect(formatGBP(3525)).toBe("£3,525.00");
    expect(formatGBP(0)).toBe("£0.00");
  });

  test("writes dates the British way", () => {
    expect(formatDate(new Date(2026, 10, 19))).toBe("19 November 2026");
    expect(formatShortDate(new Date(2026, 11, 19))).toBe("19 Dec 2026");
  });
});
