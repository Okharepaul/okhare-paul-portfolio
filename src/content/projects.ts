/**
 * Case studies, in index order (the owner's list, 17 Nov 2026; rewritten in
 * full 20 Nov 2026). The entries live in ./projects, grouped by kind of work.
 *
 * Pictures and recordings live in /public/projects, three files per project:
 * `<slug>.webp` (thumbnail), `<slug>.mp4` (the whole screen recording) and
 * `<slug>-preview.mp4` (a short, small clip). They are made from the originals
 * by `node scripts/build-project-media.mjs`; set `thumb`, `video` and
 * `preview` on the entry. A project with none gets a code-drawn plate.
 */
import { axig, obsiryn, pod, podWebsite } from "./projects/products";
import { deliveryDrone, miniBank, swarmRouting } from "./projects/research";
import { datum, gilmore, jerrieBones, maryAndPaul, novaAdeyemi } from "./projects/sites";
import type { Project } from "./projects/types";

export type { PlateVariant, Project, ProjectKind, ProjectNotice, ProjectSite, StackGroup } from "./projects/types";

export const projects: readonly Project[] = [
  swarmRouting,
  obsiryn,
  axig,
  pod,
  podWebsite,
  gilmore,
  datum,
  jerrieBones,
  novaAdeyemi,
  maryAndPaul,
  deliveryDrone,
  miniBank,
];

/** Public repos listed under the case studies. TODO(owner): send the rest of the GitHub list. */
export const repos: readonly { name: string; line?: string; language?: string; url?: string }[] = [
  { name: "map-wedding" },
];

export const pad2 = (value: number) => String(value).padStart(2, "0");

export function getProject(slug: string): { project: Project; index: number } | null {
  const index = projects.findIndex((project) => project.slug === slug);
  return index === -1 ? null : { project: projects[index], index };
}

export function nextProject(index: number): { project: Project; index: number } {
  const next = (index + 1) % projects.length;
  return { project: projects[next], index: next };
}
