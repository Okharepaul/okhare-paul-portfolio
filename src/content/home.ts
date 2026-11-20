/** Home page copy, in page order. Verbatim from the copy doc; dates and figures from the CVs. */

export const hero = {
  status: "Studio Okhare Paul · Salford",
  /** The strip above the hero, linking to the contact section. */
  strip: "A product to build, a brand to launch or a role to fill?",
  heading: "Building,",
  cycle: ["web apps.", "AI systems.", "brands.", "things that ship."],
  intro:
    "I design and build web apps, AI systems and brand identities for businesses and founders. From the first sketch of a logo to the database behind the checkout, I build the whole thing and put it live.",
  signature: "Full-Stack Engineer & Designer — 2026",
  tagline: "Software, AI and cloud, built for things people actually use.",
} as const;

export const about = {
  heading: "From circuit board to browser",
  lead: "I trained as an electrical and electronics engineer. My final-year project was a delivery drone I designed and built myself, and it flew. That led me to an MSc in Computer Science at Birmingham City University. My dissertation taught swarms of delivery drones to route themselves, and it won two awards.",
  body: "For three years I built web apps at AXIG Limited: React, Next.js, TypeScript and Node.js on the front, RESTful APIs behind them, shipped through Docker, AWS and CI/CD pipelines. My daily stack is React, Next.js, TypeScript, Node.js and Python, with Postgres, MongoDB and Azure underneath. Today I run my own studio, Okhare Paul, from Salford, building products for clients in the UK and Nigeria.",
  profile: [
    { label: "Based", value: "Salford, Manchester, UK" },
    { label: "Role", value: "Full-Stack Engineer" },
    { label: "Studio", value: "Okhare Paul" },
    { label: "Previously", value: "AXIG Limited, Nigeria" },
    { label: "Focus", value: "Software · AI · Cloud · Web" },
  ],
} as const;

export type JourneyStop = {
  code: string;
  place: string;
  lat: number;
  lon: number;
  years: string;
  chapter: string;
};

/**
 * One stop per chapter of the story, starting at home. Coordinates are real;
 * distances are computed, not typed. The globe flies from the first to the last.
 */
export const journey: readonly JourneyStop[] = [
  {
    code: "BNI",
    place: "Benin City, Edo, Nigeria",
    lat: 6.34,
    lon: 5.63,
    years: "Home",
    chapter: "Where I am from.",
  },
  {
    code: "ADO",
    place: "Ado-Ekiti, Nigeria",
    lat: 7.62,
    lon: 5.22,
    years: "2017 – 2021",
    chapter:
      "BEng Electrical and Electronics Engineering at Afe Babalola University. Final project: a working delivery drone.",
  },
  {
    code: "BHM",
    place: "Birmingham, UK",
    lat: 52.48,
    lon: -1.89,
    years: "2024 – 2025",
    chapter:
      "MSc Computer Science at Birmingham City University. Dissertation: AI route optimisation for autonomous drone swarms.",
  },
  {
    code: "SLF",
    place: "Salford, UK",
    lat: 53.49,
    lon: -2.29,
    years: "2026 – Present",
    chapter:
      "Founder & Lead Engineer at my own studio, Okhare Paul. I take projects from brief to launch.",
  },
];

/** One line under the journey counter. Composed from the CV facts above; edit freely. */
export const journeyNote =
  "From Benin City, Edo, where I am from, through a BEng and a hand-built delivery drone in Ado-Ekiti and an MSc in Birmingham, to my own studio in Salford.";

/**
 * A cut-out picture for a service (transparent background, in /public/services).
 * `isTinted` pictures are line art: only their shape is kept and it is painted
 * in the page's foreground colour, so they work on the dark and the light theme.
 */
export type ServiceImage = { src: string; width: number; height: number; isTinted: boolean };

export const services: readonly {
  number: string;
  code: string;
  image: ServiceImage;
  title: string;
  copy: string;
}[] = [
  {
    number: "#01",
    code: "WEB",
    image: { src: "/services/web.webp", width: 534, height: 849, isTinted: false },
    title: "Web apps & e-commerce",
    copy: "Full products, from the first screen to payments and hosting. React, Next.js and Node.js, built to load fast on any phone.",
  },
  {
    number: "#02",
    code: "AI",
    image: { src: "/services/ai.webp", width: 621, height: 833, isTinted: true },
    title: "Applied AI & automation",
    copy: "Models that make decisions, not demos. Route planning, data pipelines and LLM features wired into real products.",
  },
  {
    number: "#03",
    code: "CLOUD",
    image: { src: "/services/cloud.webp", width: 617, height: 630, isTinted: true },
    title: "Cloud & delivery",
    copy: "Docker, AWS and Azure, with CI/CD so every release is small, tested and easy to roll back.",
  },
  {
    number: "#04",
    code: "DESIGN",
    image: { src: "/services/design.webp", width: 607, height: 976, isTinted: false },
    title: "Brands & interfaces",
    copy: "Logos, colour systems and interfaces designed by the same person who builds them, so nothing gets lost in handover.",
  },
];

export const stack = [
  {
    name: "Development",
    tools: [
      "JavaScript (ES6+)", "TypeScript", "React", "Next.js", "Vue.js", "Three.js", "GSAP", "Tailwind CSS",
      "HTML", "CSS", "Node.js", "Express", "RESTful APIs", "C#", ".NET", "Stripe",
    ],
  },
  {
    name: "AI & Data",
    tools: [
      "Python", "scikit-learn", "NumPy", "pandas", "Matplotlib", "Reinforcement learning",
      "Spectral clustering", "Graph algorithms", "LLM integration", "Power BI", "Excel",
    ],
  },
  {
    name: "Databases",
    tools: ["PostgreSQL", "Neon", "MySQL", "Microsoft SQL", "MongoDB", "Supabase", "Firebase"],
  },
  {
    name: "Cloud & DevOps",
    tools: ["AWS (EC2, S3, Lambda)", "Azure", "Docker", "CI/CD", "Git", "GitHub", "Postman", "Chrome DevTools"],
  },
  {
    name: "Design & Brand",
    tools: ["Figma", "Logo design", "Brand systems", "UI design", "Typography"],
  },
  {
    name: "Engineering & Systems",
    tools: ["Autodesk Fusion", "MATLAB", "Simulink", "Electronics", "MetaTrader 5 (MQL5)"],
  },
] as const;

export const stackTotal = stack.reduce((sum, category) => sum + category.tools.length, 0);

export const expertise = [
  "Full-stack web applications",
  "Frontend engineering and motion",
  "AI and machine learning",
  "API design and integration",
  "Cloud deployment and DevOps",
  "Brand identity and UI design",
  "Engineering and hardware prototyping",
] as const;

export const path = [
  {
    dates: "2026 – Present",
    title: "Founder & Lead Engineer",
    org: "Okhare Paul",
    place: "Salford",
    description:
      "My own studio. I take projects from brief to launch: logo and brand, interface, frontend, backend, payments and hosting. Current work includes an ordering web app and brand for a Lagos fashion label, and my own products.",
    tags: [
      "Next.js", "React", "TypeScript", "Tailwind CSS", "GSAP", "Three.js", "WebGL", "Node.js", "RESTful APIs",
      "PostgreSQL", "Neon", "Stripe", "React Native", "Expo", "LLM integration", "Figma", "Brand identity",
      "Logo design", "UI design", "Git & GitHub", "Hosting & launch",
    ],
  },
  {
    dates: "Jan 2023 – Jan 2026",
    title: "Software Developer",
    org: "AXIG Limited",
    place: "Remote, Nigeria",
    description:
      "Led end-to-end builds of responsive web apps in React, Next.js, TypeScript and Node.js. Redesigned RESTful APIs and cut page load times by 25%. Shipped through AWS, Docker and CI/CD, with code reviews, structured logging and monitoring in agile sprints.",
    tags: [
      "React", "Next.js", "TypeScript", "JavaScript (ES6+)", "HTML", "CSS", "Tailwind CSS", "Node.js", "Express",
      "RESTful APIs", "PostgreSQL", "MongoDB", "AWS (EC2, S3, Lambda)", "Docker", "CI/CD", "Git", "GitHub", "Postman",
      "Responsive design", "Component libraries", "Code review", "Structured logging", "Monitoring", "Agile sprints",
    ],
  },
  {
    dates: "Jan 2024 – Jan 2025",
    title: "Research Developer",
    org: "Birmingham City University",
    place: "Birmingham",
    description:
      "Built an AI routing system in Python for autonomous delivery-drone swarms, combining graph theory, TSP heuristics and machine learning. Ran large simulations for scalability and fault tolerance. Cut runtime failures by over 40% through modular architecture and error handling.",
    tags: [
      "Python", "Reinforcement learning", "Q-learning", "Multi-agent RL", "Machine learning", "LLMs", "scikit-learn",
      "NumPy", "pandas", "Matplotlib", "Graph partitioning", "Spectral clustering", "Graph theory", "TSP heuristics",
      "Route optimisation", "Swarm modelling", "Simulation", "Fault-tolerance testing", "Google Colab",
    ],
  },
  {
    dates: "Jan 2022 – Jan 2023",
    title: "ICT Technician",
    org: "Morgan Oxford Education",
    place: "Oxfordshire",
    description:
      "Ran day-to-day IT: Google Workspace administration, network setup, troubleshooting and new hardware. Digitised internal workflows and made information 20% faster to find.",
    tags: [
      "IT support", "First-line support", "Help desk", "Troubleshooting", "Hardware setup", "Software installation",
      "Google Workspace admin", "User accounts & access", "Networking", "Wi-Fi & LAN", "Device maintenance",
      "Printers & peripherals", "Workflow digitisation", "Documentation",
    ],
  },
] as const;

/** Taught modules on the MSc, with what each one covered. */
export const modules = [
  {
    title: "Research Methods & Project Management",
    skills: ["PRINCE2", "Agile", "Waterfall", "Project planning", "Risk management", "Research design", "Literature review", "Technical writing"],
  },
  {
    title: "Software Analysis & Design",
    skills: ["Requirements analysis", "Software architecture", "System design", "UML", "Database design", "ER modelling", "Design patterns"],
  },
  {
    title: "Software Development",
    skills: ["Python", "C++", "C#", ".NET", "Object-oriented programming", "Data structures", "Testing", "Version control"],
  },
  {
    title: "Database Design & Development",
    skills: ["SQL", "Relational schemas", "Normalisation", "ER diagrams", "Queries & joins", "Stored procedures", "Indexing", "MySQL", "Microsoft SQL"],
  },
  {
    title: "Web Application Development",
    skills: ["React", "Node.js", "Express", "MongoDB", "RESTful APIs", "JavaScript", "HTML & CSS", "Authentication"],
  },
  {
    title: "Artificial Intelligence Fundamentals",
    skills: ["Machine learning", "Search & optimisation", "Reinforcement learning", "Clustering", "Graph algorithms", "Python", "scikit-learn"],
  },
] as const;

export const education = [
  {
    year: "2025",
    credential: "Certificate of Achievement, PGXPO Research Innovation Awards",
    institution: "Birmingham City University",
    topic: "AI for delivery-drone routing",
  },
  {
    year: "2024 – 2025",
    credential: "MSc Computer Science",
    institution: "Birmingham City University",
    topic: "Dissertation: AI route optimisation for autonomous drone swarms",
  },
  {
    year: "2017 – 2021",
    credential: "BEng Electrical and Electronics Engineering",
    institution: "Afe Babalola University, Nigeria",
    topic: "Final project: a working delivery drone",
  },
] as const;

/** `figure` is the number as printed; `count` (when set) is what the counter animates to. */
export const results: readonly { figure: string; count?: number; suffix?: string; line: string }[] = [
  { figure: "25%", count: 25, suffix: "%", line: "faster page loads at AXIG, from redesigned RESTful APIs." },
  {
    figure: "40%",
    count: 40,
    suffix: "%",
    line: "fewer runtime failures on the BCU research platform, through modular code and error handling.",
  },
  {
    figure: "30%",
    count: 30,
    suffix: "%",
    line: "higher task completion for drone swarms than static routing, with 25% shorter delivery times.",
  },
  { figure: "2 → 50", line: "drones: the routing system scaled with completion improving steadily." },
  {
    figure: "2",
    count: 2,
    line: "awards for the dissertation: PGXPO 2025 Research Innovation Award and the Faculty Award for Dissertation Excellence.",
  },
  {
    figure: "20%",
    count: 20,
    suffix: "%",
    line: "faster information retrieval after digitising workflows at Morgan Oxford Education.",
  },
];

export const selected = {
  heading: "Selected projects",
  intro: "Five projects, each showing a different side of how I work. The full list is in the index.",
  slugs: ["pod-website", "nova-adeyemi", "gilmore", "jerrie-bones", "mary-and-paul"],
} as const;

export const labBand = {
  heading: "The site, taken apart.",
  copy: "8 components and 4 experiments, each with a live demo and an honest verdict. Start with DitherHero, the WebGL sphere in the hero, or turn the Journey globe.",
  cta: "Open the Lab",
  links: [
    { label: "DitherHero", tag: "WebGL", href: "/lab#c-01" },
    { label: "Journey", tag: "Canvas", href: "/lab#c-02" },
    { label: "NightShift", tag: "CSS", href: "/lab#c-07" },
  ],
} as const;

export const contact = {
  heading: "Let's work together",
  copy: "Got a product to build, a brand to launch or a role to fill? Tell me what you're working on. I reply within two working days.",
  needs: ["Web app", "AI", "Cloud", "Brand & design", "Hiring for a role", "Something else"],
  sent: "Message sent. I'll reply within two working days.",
} as const;
