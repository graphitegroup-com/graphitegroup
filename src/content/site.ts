/**
 * Public site content. Everything a non-engineer should be able to update lives
 * here (or in team.ts / recruiting.ts) so a change is a one-line PR.
 * Once the member portal ships, team + recruiting will be read from the database.
 */

export const site = {
  name: "Graphite Group",
  founded: 2018,
  tagline: "Small organization. Big impact.",
  description:
    "Graphite Group is the student-run consulting group of the Claremont Colleges. Since 2018 we have delivered strategy and digital work for startups, institutions and Fortune 500 teams.",
  url: "https://graphitegroup.co",
  instagram: "https://www.instagram.com/thegraphitegroup/",
  instagramHandle: "@thegraphitegroup",
  linkedin: "https://www.linkedin.com/company/graphitegroup/",
  email: "", // TODO: set a shared inbox; the contact form uses INQUIRY_WEBHOOK_URL meanwhile
  stats: [
    { value: "77", label: "Client engagements completed since 2018" },
    { value: "9", label: "Sectors, from fintech and healthcare to real estate" },
    { value: "5", label: "Claremont Colleges represented on every team" },
    { value: "90+", label: "Members and alumni in the Graphite network" },
  ],
} as const;

export const nav = [
  {
    href: "/work",
    label: "Our Work",
    children: [
      { href: "/work/strategy", label: "Graphite Strategy" },
      { href: "/work/digital", label: "Graphite Digital" },
      { href: "/work", label: "Case Studies" },
    ],
  },
  { href: "/clients", label: "For Clients" },
  { href: "/students", label: "For Students" },
  { href: "/life", label: "Life at Graphite" },
  { href: "/about", label: "About Us" },
  { href: "/people", label: "Our Team" },
] as const;

export const pillars = [
  {
    title: "Realize potential",
    body: "Members get extensive professional development and hands-on experience with innovative organizations.",
  },
  {
    title: "Foster community",
    body: "A close-knit group whose relationships last well beyond campus. Once a member of Graphite, always a member.",
  },
  {
    title: "Uphold integrity",
    body: "Since 2018 we have held ourselves to high standards of honesty and accountability, with clients and with each other.",
  },
];

export const clients = [
  "IBM",
  "vals.ai",
  "Paulaner Sunset",
  "Fizz",
  "Dreambox",
  "Emovid",
  "Gem Real Estate",
  "Mesopetania AI",
] as const;

export const colleges = ["Pomona", "Claremont McKenna", "Harvey Mudd", "Scripps", "Pitzer"] as const;

export type Practice = {
  slug: "strategy" | "digital";
  name: string;
  kicker: string;
  summary: string;
  long: string;
  services: { title: string; body: string }[];
  sectors: string[];
};

export const practices: Practice[] = [
  {
    slug: "strategy",
    name: "Graphite Strategy",
    kicker: "Market entry, positioning, pricing, GTM",
    summary:
      "Decision-grade research and recommendations for teams entering a market, pricing a product or looking for margin.",
    long: "Since 2018, Graphite Strategy has completed more than 40 engagements across 9 sectors. We pair rigorous primary research (surveys, expert calls, the student market we sit inside of) with a structured training program, so every recommendation can be traced back to evidence.",
    services: [
      {
        title: "Market Entry",
        body: "Local market dynamics, segment identification and a launch plan with the competitive edge spelled out.",
      },
      {
        title: "Market Positioning",
        body: "Competitive benchmarking and analysis that makes you stand out to the audience that matters.",
      },
      {
        title: "Pricing Strategy",
        body: "Pricing models built from market trends, consumer behavior and cost structure, tuned to your goals.",
      },
      {
        title: "Customer Engagement",
        body: "Find the ideal customer, then deepen the relationship with data-driven retention and loyalty plays.",
      },
      {
        title: "Cost Optimization",
        body: "Detailed cost and process analysis that finds inefficiency without trading away quality.",
      },
    ],
    sectors: [
      "Technology",
      "Education",
      "Healthcare",
      "Information",
      "Retail",
      "Food & Beverage",
      "Institutions",
      "NGO",
      "Financial Services",
    ],
  },
  {
    slug: "digital",
    name: "Graphite Digital",
    kicker: "Product, engineering, data, AI",
    summary:
      "A build team for UX research, software, data pipelines and AI evaluation that complements your R&D rather than replacing it.",
    long: "Founded in 2021 as Graphite's technical arm, Graphite Digital ships working artifacts: prototypes adopted by IBM teams, a public LLM benchmark now maintained by vals.ai, and production websites built from zero.",
    services: [
      {
        title: "Product Design & UX",
        body: "User research, intuitive product design, prototyping and usability testing.",
      },
      {
        title: "Application Development",
        body: "Tailored software, from marketing sites to custom internal platforms.",
      },
      {
        title: "Data Strategy",
        body: "Cleaning, modeling and optimizing data into operational efficiency and real insight.",
      },
      {
        title: "AI Strategy & Deployment",
        body: "Model selection, evaluation and deployment of machine learning that fits the problem.",
      },
      {
        title: "Emerging Tech Research",
        body: "Rapid testing of new technologies to judge what is viable before you invest.",
      },
    ],
    sectors: ["Data & Infrastructure", "AI / ML", "Product & Design", "Tech Strategy"],
  },
];

export type CaseStudy = {
  client: string;
  title: string;
  practice: "Strategy" | "Digital";
  sector: string;
  summary: string;
  outcome: string;
  link?: { href: string; label: string };
};

export const caseStudies: CaseStudy[] = [
  {
    client: "vals.ai",
    title: "LLM bias benchmark",
    practice: "Digital",
    sector: "AI / LLM",
    summary:
      "Built a pipeline that injects racial bias into 2,000 MedQA questions based on each question's context, then evaluated 5 bias types across 15+ LLMs.",
    outcome:
      "Found statistically significant gaps between control and bias-injected questions. The benchmark is public on the vals.ai homepage and maintained by Vals going forward.",
    link: { href: "https://www.vals.ai/benchmarks/medqa-01-27-2025", label: "Read the benchmark" },
  },
  {
    client: "IBM InstructLab",
    title: "Synthetic data review prototype",
    practice: "Digital",
    sector: "SaaS",
    summary:
      "Designed a fully functional prototype for reviewing synthetically generated training data, presented to senior developers, PMs and UX leads.",
    outcome: "IBM began circulating the prototype across internal teams and expressed interest in scaling it.",
  },
  {
    client: "Paulaner Sunset",
    title: "US market entry",
    practice: "Strategy",
    sector: "Consumer",
    summary:
      "A German beverage brand entering Los Angeles and US campuses. We ran customer behavior analysis and a case study on student sentiment toward non-alcoholic drinks.",
    outcome: "Findings became a pivotal input to the client's go-to-market strategy.",
  },
  {
    client: "Emovid",
    title: "Market sizing & pricing",
    practice: "Strategy",
    sector: "Technology",
    summary:
      "Market identification, segmentation and sizing for a video AI company, combined with a pricing strategy against startups and incumbents.",
    outcome: "A sharper competitive position and a pricing model grounded in segment economics.",
  },
  {
    client: "Gem Real Estate",
    title: "Resort positioning",
    practice: "Strategy",
    sector: "Real Estate",
    summary:
      "Market analysis and competitive benchmarking for a Chicago firm's newly developed resort.",
    outcome: "Identified features and amenities to lift average daily rate and length of stay.",
  },
  {
    client: "Mesopetania AI",
    title: "Creator engagement",
    practice: "Strategy",
    sector: "Consumer AI",
    summary: "Research into how creators use generative AI for text and visual art.",
    outcome: "New features and products designed to enhance creative flow and boost retention.",
  },
];

export const digitalArchive = [
  { year: 2024, client: "Open-source LLM development team", work: "User research and product design for a data ranking and review system." },
  { year: 2024, client: "LLM benchmarking startup", work: "An industry-specific benchmark for major LLMs, publicly released." },
  { year: 2024, client: "AI consumer research company", work: "Research and advice on AI model selection and implementation." },
  { year: 2023, client: "National agriculture transportation team", work: "Cleaned and optimized large logistics and supply-chain datasets." },
  { year: 2022, client: "Data privacy & compliance startup", work: "Main marketing website and a data auditing platform, from 0 to 1." },
];

export const testimonials = [
  {
    quote:
      "Graphite Group was able to accomplish significant research with physicians, a group that is very hard to contact and whose time is precious. They corrected some of our assumptions.",
    name: "President & CTO",
    org: "Healthcare software company",
  },
  {
    quote:
      "The team is communicative, thoughtful, and analytical, and truly took every piece of feedback we gave them in stride. I would happily work with the team again.",
    name: "Teddy Solomon",
    org: "Co-Founder & CEO, Fizz",
  },
  {
    quote:
      "Their research enabled us to better understand trends and patterns within our target demographic and refine our strategy to better understand customer needs.",
    name: "Matthias Memminger",
    org: "Head of Paulaner Sunset USA",
  },
  {
    quote:
      "Their approach to bringing in subject matter experts has added a continually evolving dimension to our product development process.",
    name: "Dan Bejmuk",
    org: "CEO, Dreambox",
  },
  {
    quote: "This is a big step forward from what we've been doing in the past. A large improvement!",
    name: "Backend SWE",
    org: "IBM",
  },
  {
    quote:
      "It was incredibly beneficial to have many smart minds helping me over the semester. The conversations were top-notch and the work produced was quality.",
    name: "Founder",
    org: "Financial services startup",
  },
];

export const engagement = [
  {
    step: "01",
    title: "Scope",
    body: "We meet, define the question and agree on deliverables. Fall projects staff in July, spring projects in December.",
  },
  {
    step: "02",
    title: "Staff",
    body: "A project lead plus four to five consultants, chosen for the problem: economists, engineers, designers, policy minds.",
  },
  {
    step: "03",
    title: "Research & build",
    body: "Primary research, expert interviews, models and prototypes, with weekly check-ins run by your project lead.",
  },
  {
    step: "04",
    title: "Deliver",
    body: "A final presentation and every working file, at 12 weeks for one semester or 24 for two.",
  },
];
