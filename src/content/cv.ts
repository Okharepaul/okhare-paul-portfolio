import { path, stack } from "./home";

/** CV page copy. Section order and wording from the copy doc; roles reuse the Path entries. */

export const cv = {
  name: "Okhare Paul Ogbomida",
  headline: "Full-Stack Engineer | Software, AI, Cloud & Web",
  profile:
    "Full-stack engineer with an MSc in Computer Science and a BEng in Electrical and Electronics Engineering. Three years building production web apps in React, Next.js, TypeScript and Node.js, shipped on AWS with Docker and CI/CD. Award-winning research in AI routing for drone swarms. Now running my own studio in Salford, from brand to launch.",
  recentProjects: ["swarm-routing", "beeshop", "obsiryn"],
  education: [
    { credential: "MSc Computer Science", institution: "Birmingham City University", year: "2024 – 2025" },
    {
      credential: "BEng Electrical and Electronics Engineering",
      institution: "Afe Babalola University (ABUAD)",
      year: "2017 – 2021",
    },
    { credential: "Certificate of Achievement, PGXPO Research Innovation Awards", institution: "Birmingham City University", year: "2025" },
  ],
  strengths: [
    "Builds the whole product, design to deployment",
    "Turns research into working software",
    "Explains technical work in plain language",
  ],
  interests: [
    "Building trading algorithms for the forex market",
    "Designing AI algorithms for modern-day problems",
    "Researching engineering designs",
  ],
} as const;

/** Each role's description, one sentence per bullet. */
export const cvExperience = path.map((role) => ({
  ...role,
  bullets: role.description.split(/(?<=\.)\s+/).filter((sentence) => sentence.length > 0),
}));

const FRONT_END = new Set([
  "JavaScript (ES6+)", "TypeScript", "React", "Next.js", "Vue.js", "Three.js", "GSAP", "Tailwind CSS", "HTML", "CSS",
]);

const [development, aiAndData, databases, cloud, design] = stack;

export const cvSkills = [
  { group: "Front-end", items: development.tools.filter((tool) => FRONT_END.has(tool)) },
  {
    group: "Back-end and data",
    items: [...development.tools.filter((tool) => !FRONT_END.has(tool)), ...databases.tools, ...aiAndData.tools.slice(0, 4)],
  },
  { group: "Cloud and DevOps", items: [...cloud.tools] },
  { group: "Design and brand", items: [...design.tools] },
] as const;
