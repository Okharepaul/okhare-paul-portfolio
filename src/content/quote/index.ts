/**
 * The "Build your stack" questions and the owner's price list, put together.
 * Where the figures come from, and which are still DRAFT, is set out at the top
 * of `shared.ts`. The prices are never shown on the page: see `stack.ts`.
 */
import { automation } from "./automation";
import { brand } from "./brand";
import { chatbot } from "./chatbot";
import { mobile } from "./mobile";
import type { ProjectType } from "./shared";
import { store } from "./store";
import { webapp } from "./webapp";
import { website } from "./website";

export * from "./shared";
export * from "./stack";

/** What can be built, in the order the first question offers it. */
export const projectTypes: readonly ProjectType[] = [website, store, mobile, webapp, automation, chatbot, brand];
