import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { site } from "@/content/site";

const STATIC_ROUTES = ["", "/meet-the-developer", "/projects", "/start-a-project", "/lab", "/cv", "/privacy-policy", "/legal-notice"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...STATIC_ROUTES.map((route) => ({ url: `${site.url}${route}`, priority: route === "" ? 1 : 0.7 })),
    ...projects.map((project) => ({ url: `${site.url}/project/${project.slug}`, priority: 0.6 })),
  ];
}
