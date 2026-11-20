import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { journey, modules, path, results, selected, services, stack, stackTotal } from "@/content/home";
import { getProject, nextProject, projects } from "@/content/projects";
import { contactSchema, formatMessage, toFieldErrors } from "./contact";
import { formatCoords, haversineKm, legDistancesKm } from "./geo";
import { parseRgb } from "./motion";
import { createRateLimiter } from "./rate-limit";

describe("haversineKm", () => {
  test("is zero for the same place", () => {
    expect(haversineKm({ lat: 53.49, lon: -2.29 }, { lat: 53.49, lon: -2.29 })).toBe(0);
  });

  test("measures London to Paris at about 344 km", () => {
    const km = haversineKm({ lat: 51.5074, lon: -0.1278 }, { lat: 48.8566, lon: 2.3522 });
    expect(km).toBeGreaterThan(335);
    expect(km).toBeLessThan(350);
  });

  test("gives the journey three legs, Nigeria to the UK being the long one", () => {
    const [home, flight, north] = legDistancesKm(journey);
    expect(home).toBeGreaterThan(100);
    expect(home).toBeLessThan(200);
    expect(flight).toBeGreaterThan(4500);
    expect(flight).toBeLessThan(5500);
    expect(north).toBeGreaterThan(80);
    expect(north).toBeLessThan(160);
  });

  test("starts the journey in Benin City and ends it in Salford", () => {
    expect(journey[0].place).toMatch(/^Benin City/);
    expect(journey[journey.length - 1].place).toMatch(/^Salford/);
    const km = haversineKm(journey[0], journey[journey.length - 1]);
    expect(km).toBeGreaterThan(5100);
    expect(km).toBeLessThan(5500);
  });
});

describe("formatCoords", () => {
  test("labels hemispheres", () => {
    expect(formatCoords({ lat: 53.49, lon: -2.29 })).toBe("53.49°N · 2.29°W");
    expect(formatCoords({ lat: -7.6, lon: 5.2 })).toBe("7.60°S · 5.20°E");
  });
});

describe("parseRgb", () => {
  test("reads an rgb() string into 0..1 channels", () => {
    expect(parseRgb("rgb(255, 0, 51)")).toEqual([1, 0, 0.2]);
  });

  test("falls back to mid grey for anything else", () => {
    expect(parseRgb("transparent")).toEqual([0.5, 0.5, 0.5]);
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    need: "Web app",
    message: "I have a product to build and would like to talk.",
  };

  test("accepts a complete message and fills optional fields", () => {
    const parsed = contactSchema.parse(valid);
    expect(parsed.budget).toBe("");
    expect(parsed.timeline).toBe("");
    expect(parsed.ref_code).toBe("");
  });

  test("rejects a bad email with a message that says what to type", () => {
    const result = contactSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) expect(toFieldErrors(result.error).email).toMatch(/name@example\.com/);
  });

  test("rejects a need that is not on the list", () => {
    expect(contactSchema.safeParse({ ...valid, need: "Free work" }).success).toBe(false);
  });

  test("rejects line breaks in single-line fields", () => {
    expect(contactSchema.safeParse({ ...valid, name: "Ada\r\nBcc: x@example.com" }).success).toBe(false);
  });

  test("rejects a filled honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, ref_code: "Acme" }).success).toBe(false);
  });

  test("rejects a message that is too short or too long", () => {
    expect(contactSchema.safeParse({ ...valid, message: "Hi" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
  });

  test("formats a plain-text body with dashes for empty optional fields", () => {
    const body = formatMessage(contactSchema.parse(valid));
    expect(body).toContain("Name: Ada Lovelace");
    expect(body).toContain("Budget: —");
    expect(body).toContain(valid.message);
  });
});

describe("createRateLimiter", () => {
  test("allows up to the limit, then refuses", () => {
    const limiter = createRateLimiter(2, 1000);
    expect(limiter.check("a", 0)).toBe(true);
    expect(limiter.check("a", 1)).toBe(true);
    expect(limiter.check("a", 2)).toBe(false);
  });

  test("tracks keys separately", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.check("a", 0)).toBe(true);
    expect(limiter.check("b", 0)).toBe(true);
  });

  test("opens a new window once the old one has passed", () => {
    const limiter = createRateLimiter(1, 1000);
    expect(limiter.check("a", 0)).toBe(true);
    expect(limiter.check("a", 500)).toBe(false);
    expect(limiter.check("a", 1000)).toBe(true);
  });
});

describe("content", () => {
  test("the stack heading count matches the tools listed", () => {
    expect(stackTotal).toBe(52);
    expect(stack.map((category) => category.tools.length)).toEqual([16, 11, 7, 8, 5, 5]);
  });

  test("lists twelve case studies with unique slugs, in the owner's order", () => {
    expect(projects.map((project) => project.slug)).toEqual([
      "swarm-routing", "obsiryn", "axig", "pod", "pod-website", "gilmore", "datum",
      "jerrie-bones", "nova-adeyemi", "mary-and-paul", "delivery-drone", "mini-bank",
    ]);
    expect(new Set(projects.map((project) => project.slug)).size).toBe(12);
  });

  test("finds a project by slug and wraps round to the first after the last", () => {
    expect(getProject("axig")?.index).toBe(2);
    expect(getProject("missing")).toBeNull();
    expect(nextProject(11).project.slug).toBe("swarm-routing");
  });

  test("features the owner's five projects on the home page, each with a thumbnail", () => {
    expect(selected.slugs).toEqual(["pod-website", "nova-adeyemi", "gilmore", "jerrie-bones", "mary-and-paul"]);
    selected.slugs.forEach((slug) => expect(getProject(slug)?.project.thumb).toBeDefined());
    selected.slugs.forEach((slug) => expect(getProject(slug)).not.toBeNull());
  });

  test("keeps every thumbnail path inside /projects", () => {
    projects.forEach((project) => {
      if (project.thumb !== undefined) expect(project.thumb).toMatch(/^\/projects\/[\w-]+\.(webp|jpg|jpeg|png|avif)$/);
    });
  });

  test("gives the eight recorded projects a thumbnail, a recording and a preview clip", () => {
    const recorded = projects.filter((project) => project.video !== undefined).map((project) => project.slug);
    expect([...recorded].sort()).toEqual(["datum", "gilmore", "jerrie-bones", "mary-and-paul", "nova-adeyemi", "obsiryn", "pod", "pod-website"]);
    recorded.forEach((slug) => {
      const project = getProject(slug)?.project;
      expect(project?.thumb).toBe(`/projects/${slug}.webp`);
      expect(project?.video).toBe(`/projects/${slug}.mp4`);
      expect(project?.preview).toBe(`/projects/${slug}-preview.mp4`);
    });
  });

  test("never lists a preview clip without the recording it is cut from", () => {
    projects.forEach((project) => {
      if (project.preview !== undefined) expect(project.video).toBeDefined();
    });
  });

  test("finds every listed picture and recording on disk", () => {
    const listed = projects.flatMap((project) => [project.thumb, project.video, project.preview]).filter((file) => file !== undefined);
    expect(listed.length).toBeGreaterThan(0);
    listed.forEach((file) => expect(existsSync(join(process.cwd(), "public", file)), file).toBe(true));
  });

  test("gives each service a cut-out picture with its size", () => {
    expect(services).toHaveLength(4);
    services.forEach((service) => {
      expect(service.image.src).toMatch(/^\/services\/[\w-]+\.webp$/);
      expect(service.image.width).toBeGreaterThan(0);
      expect(service.image.height).toBeGreaterThan(0);
    });
  });

  test("lists skills for every role and module without repeats", () => {
    [...path.map((role) => role.tags), ...modules.map((module) => module.skills)].forEach((skills) => {
      expect(skills.length).toBeGreaterThanOrEqual(7);
      expect(new Set(skills).size).toBe(skills.length);
    });
    expect(modules).toHaveLength(6);
  });

  test("every counted result prints the number it counts to", () => {
    results.forEach((result) => {
      if (result.count !== undefined) expect(result.figure).toBe(`${result.count}${result.suffix ?? ""}`);
    });
  });
});

describe("scrolling with the keyboard", () => {
  test("arrows move a step, Page Down and space most of a screen", async () => {
    const { ARROW_STEP_PX, PAGE_STEP_SHARE, keyScrollDelta } = await import("./scroll");
    expect(keyScrollDelta("ArrowDown", false, 800)).toBe(ARROW_STEP_PX);
    expect(keyScrollDelta("ArrowUp", false, 800)).toBe(-ARROW_STEP_PX);
    expect(keyScrollDelta("PageDown", false, 800)).toBeCloseTo(800 * PAGE_STEP_SHARE);
    expect(keyScrollDelta(" ", false, 800)).toBeCloseTo(800 * PAGE_STEP_SHARE);
    expect(keyScrollDelta(" ", true, 800)).toBeCloseTo(-800 * PAGE_STEP_SHARE);
  });

  test("Home and End reach for the ends, and other keys are left alone", async () => {
    const { keyScrollDelta } = await import("./scroll");
    expect(keyScrollDelta("Home", false, 800)).toBe(Number.NEGATIVE_INFINITY);
    expect(keyScrollDelta("End", false, 800)).toBe(Number.POSITIVE_INFINITY);
    expect(keyScrollDelta("a", false, 800)).toBeNull();
    expect(keyScrollDelta("Enter", false, 800)).toBeNull();
  });
});

describe("the case studies", () => {
  test("every project is written in full: a summary, a story, what it does, how, and a stack", () => {
    projects.forEach((project) => {
      expect(project.summary?.length, project.slug).toBeGreaterThan(60);
      expect(project.story?.length, project.slug).toBeGreaterThan(200);
      expect(project.does?.length, project.slug).toBeGreaterThanOrEqual(5);
      expect(project.solved?.length, project.slug).toBeGreaterThanOrEqual(4);
      expect(project.stack?.length, project.slug).toBeGreaterThanOrEqual(3);
    });
  });

  test("the focus is a technology, never a discipline", () => {
    projects.forEach((project) => expect(["Brand", "Editorial", "Hardware"], project.slug).not.toContain(project.tag));
  });

  test("live sites link out over https, and the held work says coming soon with a notice", () => {
    projects.forEach((project) => {
      if (project.site !== undefined && project.site !== "soon") expect(project.site.href, project.slug).toMatch(/^https:\/\/[\w.-]+\/?$/);
    });
    ["pod", "pod-website"].forEach((slug) => {
      const project = getProject(slug)?.project;
      expect(project?.site).toBe("soon");
      expect(project?.notice?.text).toContain("client");
    });
    expect(getProject("axig")?.project.notice).toBeDefined();
    expect(getProject("axig")?.project.site).toBeUndefined();
  });

  test("the store's stack names what built it, not what it teaches", () => {
    const text = JSON.stringify(getProject("obsiryn")?.project);
    expect(text).not.toContain("Claude");
    const tools = getProject("obsiryn")?.project.stack?.flatMap((group) => group.items) ?? [];
    expect(tools).not.toContain("MetaTrader 5");
  });

  test("projects with no picture to come carry no caption, and no caption gives the game away", () => {
    expect(getProject("delivery-drone")?.project.figure).toBeUndefined();
    expect(getProject("mini-bank")?.project.figure).toBeUndefined();
    projects.forEach((project) => expect(project.figure ?? "", project.slug).not.toMatch(/recording|screenshot|no sound|seconds|to follow/i));
  });

  test("nothing held back about Pod slips into its pages", () => {
    const text = JSON.stringify([getProject("pod")?.project, getProject("pod-website")?.project]).toLowerCase();
    ["community", "co-founded", "social"].forEach((word) => expect(text).not.toContain(word));
  });
});
