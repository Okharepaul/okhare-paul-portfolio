import type { PlateVariant } from "@/content/projects";
import type { ArtName } from "./art";

/** Which procedural figure stands in for each project until real screens arrive. */
export const PLATE_ART: Record<PlateVariant, ArtName> = {
  swarm: "routes",
  board: "board",
  tiers: "tiers",
  architecture: "pipeline",
  plain: "numeral",
};
