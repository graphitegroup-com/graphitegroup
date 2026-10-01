/**
 * Sample data for the portal preview. Every person here is fictional. Projects
 * are drawn from Graphite's public case studies. Replace by connecting the
 * database (see docs/PORTAL.md).
 */

import type { Member, PortalData } from "./types";

const m = (
  id: string,
  firstName: string,
  lastName: string,
  school: Member["school"],
  gradYear: number,
  practice: Member["practice"],
  role: Member["role"],
  joinedTerm: Member["joinedTerm"],
  execTitle?: Member["execTitle"],
): Member => {
  const handle = `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, "");
  const domain = { Pomona: "mymail.pomona.edu", CMC: "cmc.edu", "Harvey Mudd": "g.hmc.edu", Scripps: "scrippscollege.edu", Pitzer: "students.pitzer.edu" }[school];
  return {
    id,
    firstName,
    lastName,
    personalEmail: `${handle}@example.com`,
    schoolEmail: `${handle}@${domain}`,
    phone: "(555) 010-" + String(1000 + Number(id.slice(1)) * 37).slice(-4),
    school,
    studentId: String(40000000 + Number(id.slice(1)) * 7919),
    gradYear,
    practice,
    role,
    execTitle,
    joinedTerm,
    linkedin: "",
    showOnWebsite: true,
  };
};

export const seed: PortalData = {
  members: [
    m("m1", "Jordan", "Avery", "CMC", 2027, "Strategy", "Executive Board", "F2023", "Managing Director"),
    m("m2", "Maya", "Okafor", "Pomona", 2027, "Strategy", "Executive Board", "F2023", "Director of Strategy & Client Relations"),
    m("m3", "Ethan", "Liu", "Harvey Mudd", 2027, "Digital", "Executive Board", "F2023", "Director of Digital"),
    m("m4", "Sofia", "Marquez", "Scripps", 2028, "Strategy", "Executive Board", "F2024", "Director of Recruiting & Engagement"),
    m("m5", "Noah", "Feldman", "Pomona", 2028, "Strategy", "Executive Board", "F2024", "Director of Professional Development"),
    m("m6", "Ava", "Chen", "CMC", 2028, "Strategy", "Team Lead", "F2024"),
    m("m7", "Lucas", "Bennett", "Harvey Mudd", 2028, "Digital", "Team Lead", "F2024"),
    m("m8", "Isabella", "Rossi", "Pitzer", 2027, "Strategy", "Team Lead", "S2024"),
    m("m9", "Priya", "Raman", "Pomona", 2029, "Strategy", "Consultant", "F2025"),
    m("m10", "Daniel", "Kim", "CMC", 2028, "Strategy", "Consultant", "F2024"),
    m("m11", "Grace", "Thompson", "Scripps", 2029, "Digital", "Consultant", "F2025"),
    m("m12", "Omar", "Haddad", "Harvey Mudd", 2029, "Digital", "Consultant", "S2026"),
    m("m13", "Chloe", "Nguyen", "Pomona", 2029, "Strategy", "Associate Consultant", "S2026"),
    m("m14", "Samuel", "Ortiz", "CMC", 2030, "Strategy", "Associate Consultant", "F2026"),
    m("m15", "Hannah", "Weiss", "Scripps", 2030, "Digital", "Associate Consultant", "F2026"),
    m("m16", "Leo", "Park", "Pitzer", 2030, "Strategy", "Associate Consultant", "F2026"),
    m("m17", "Zara", "Patel", "Pomona", 2029, "Strategy", "Associate Consultant", "F2025"),
    // alumni (graduated)
    m("m18", "Ben", "Carter", "CMC", 2026, "Strategy", "Executive Board", "F2022", "Managing Director"),
    m("m19", "Emily", "Sato", "Pomona", 2026, "Digital", "Team Lead", "F2022"),
    m("m20", "Marcus", "Reed", "Harvey Mudd", 2025, "Digital", "Consultant", "F2021"),
    m("m21", "Olivia", "Grant", "Scripps", 2025, "Strategy", "Team Lead", "F2021"),
  ],
  roleChanges: [],
  taskTemplates: [
    { id: "t1", title: "Complete your member profile", body: "Confirm your school, class year, phone and emails so the directory and payroll stay accurate.", audience: { kind: "all" }, month: 9, day: 15, createdBy: "m1" },
    { id: "t2", title: "Book rooms for recruiting info sessions", body: "Reserve info session and interview rooms at CMC and Pomona for fall recruiting.", audience: { kind: "title", title: "Director of Recruiting & Engagement" }, month: 8, day: 20, createdBy: "m1" },
    { id: "t3", title: "Update the PD curriculum", body: "Refresh the Excel, market sizing and slide workshops before new members start.", audience: { kind: "title", title: "Director of Professional Development" }, month: 9, day: 1, createdBy: "m1" },
    { id: "t4", title: "Staff fall engagements", body: "Confirm clients, scopes and team assignments for the fall semester.", audience: { kind: "title", title: "Director of Strategy & Client Relations" }, month: 7, day: 15, createdBy: "m1" },
    { id: "t5", title: "Staff spring engagements", body: "Confirm clients, scopes and team assignments for the spring semester.", audience: { kind: "title", title: "Director of Strategy & Client Relations" }, month: 12, day: 5, createdBy: "m1" },
    { id: "t6", title: "Prepare the board meeting", body: "Agenda, budget update and semester review for the RLCIE board meeting.", audience: { kind: "title", title: "Managing Director" }, month: 10, day: 15, createdBy: "m1" },
    { id: "t7", title: "Final deck review with your team", body: "Dry-run the final client presentation with your project lead and one exec member.", audience: { kind: "role", role: "Team Lead" }, month: 11, day: 20, createdBy: "m1" },
    { id: "t8", title: "Log your recruiting outcomes", body: "Update My Recruiting with every application's final stage and add interview notes to Companies.", audience: { kind: "all" }, month: 4, day: 30, createdBy: "m1" },
    { id: "t9", title: "Write your transition document", body: "Document your role's recurring work, contacts and lessons for your successor.", audience: { kind: "role", role: "Executive Board" }, month: 4, day: 15, createdBy: "m1" },
    { id: "t10", title: "Complete the Graphite curriculum", body: "Finish the four onboarding workshops and submit the practice case.", audience: { kind: "role", role: "Associate Consultant" }, month: 10, day: 10, createdBy: "m5" },
  ],
  taskDone: { "t1:2026:m1": "2026-09-02T12:00:00Z", "t4:2026:m2": "2026-07-12T12:00:00Z", "t2:2026:m4": "2026-08-18T12:00:00Z" },
  applications: [
    { id: "a1", memberId: "m1", company: "McKinsey & Company", position: "Business Analyst", cycle: "Full-time 2027", stage: "Superday / Final", updatedAt: "2026-09-26", notes: "Final round next week. Prep the PEI stories." },
    { id: "a2", memberId: "m1", company: "Bain & Company", position: "Associate Consultant", cycle: "Full-time 2027", stage: "First Round", updatedAt: "2026-09-20", notes: "" },
    { id: "a3", memberId: "m1", company: "Goldman Sachs", position: "Investment Banking Analyst", cycle: "Full-time 2027", stage: "Rejected", updatedAt: "2026-08-30", notes: "Superday. Technicals were fine; fit answer too long." },
    { id: "a4", memberId: "m9", company: "Jane Street", position: "Trading Intern", cycle: "Summer 2027 Internship", stage: "Online Assessment", updatedAt: "2026-09-25", notes: "" },
    { id: "a5", memberId: "m9", company: "BlackRock", position: "Summer Analyst", cycle: "Summer 2027 Internship", stage: "Applied", updatedAt: "2026-09-18", notes: "" },
    { id: "a6", memberId: "m9", company: "Palantir", position: "Deployment Strategist Intern", cycle: "Summer 2027 Internship", stage: "Researching", updatedAt: "2026-09-10", notes: "Ask Ethan about his contact." },
    { id: "a7", memberId: "m10", company: "J.P. Morgan", position: "Investment Banking Summer Analyst", cycle: "Summer 2027 Internship", stage: "Offer", updatedAt: "2026-09-12", notes: "" },
  ],
  reports: [
    { id: "r1", company: "Goldman Sachs", memberId: "m18", year: 2025, position: "IB Summer Analyst", round: "Superday", format: "3 back-to-back 30-minute interviews", questions: "Walk me through a DCF. Why GS over other banks? A deal you followed recently.", tips: "Know one recent deal deeply. Keep fit answers under two minutes.", difficulty: 4, outcome: "Offer" },
    { id: "r2", company: "Goldman Sachs", memberId: "m1", year: 2026, position: "IB Analyst", round: "Superday", format: "3 interviews, one technical-heavy", questions: "Accretion/dilution basics; how would you value a pre-revenue company?", tips: "Technical interviewer cared about intuition more than formulas.", difficulty: 4, outcome: "Rejected" },
    { id: "r3", company: "McKinsey & Company", memberId: "m21", year: 2025, position: "Business Analyst", round: "Final", format: "2 case interviews + PEI", questions: "Profitability case for a regional grocery chain; market sizing for EV chargers.", tips: "They push hard on the PEI follow-ups. Have specific numbers in your stories.", difficulty: 5, outcome: "Offer" },
    { id: "r4", company: "Bain & Company", memberId: "m18", year: 2025, position: "Associate Consultant Intern", round: "First Round", format: "Case + behavioral", questions: "Should a PE firm acquire a pet-food company?", tips: "Structure first, then hypothesis. Interviewer liked a clear recommendation up front.", difficulty: 3, outcome: "Advanced" },
    { id: "r5", company: "Jane Street", memberId: "m20", year: 2024, position: "Trading Intern", round: "Phone screen", format: "45-minute mental math + probability", questions: "Expected value of dice games; betting under uncertainty.", tips: "Talk through your reasoning out loud. Practice Fermi estimates.", difficulty: 5, outcome: "Advanced" },
    { id: "r6", company: "Palantir", memberId: "m19", year: 2025, position: "Deployment Strategist", round: "Decomposition", format: "Open-ended problem breakdown with an engineer", questions: "How would you help a hospital reduce ER wait times with data?", tips: "Ask clarifying questions; they grade how you scope.", difficulty: 4, outcome: "Offer" },
    { id: "r7", company: "BlackRock", memberId: "m10", year: 2026, position: "Summer Analyst", round: "First Round", format: "HireVue + one live behavioral", questions: "Why asset management? Pitch a stock.", tips: "Have a one-minute stock pitch ready with a clear thesis.", difficulty: 2, outcome: "Advanced" },
    { id: "r8", company: "J.P. Morgan", memberId: "m10", year: 2026, position: "IB Summer Analyst", round: "Superday", format: "2 interviews", questions: "Walk me through the three statements; why JPM?", tips: "Very fit-focused. Know the group you are interviewing for.", difficulty: 3, outcome: "Offer" },
  ],
  comments: [
    { id: "c1", subject: "company:goldman-sachs", memberId: "m10", body: "Recruiting for SA starts earlier every year. Network in spring of sophomore year.", createdAt: "2026-03-02" },
    { id: "c2", subject: "company:mckinsey-company", memberId: "m21", body: "Happy to run mock cases for anyone in the final round. Message me.", createdAt: "2026-02-11" },
  ],
  contacts: [
    { id: "p1", name: "Alexandra Mills", company: "McKinsey & Company", title: "Engagement Manager", email: "", linkedin: "", isAlum: true, alumClass: 2021, preferences: "Prefers a short email with a specific ask. Responds on weekends.", addedBy: "m18" },
    { id: "p2", name: "David Cho", company: "Goldman Sachs", title: "Associate, TMT", email: "", linkedin: "", isAlum: false, preferences: "LinkedIn only.", addedBy: "m1" },
    { id: "p3", name: "Rachel Stein", company: "Bain & Company", title: "Consultant", email: "", linkedin: "", isAlum: true, alumClass: 2023, preferences: "Very generous with time; will do mock cases.", addedBy: "m21" },
    { id: "p4", name: "Kevin Brooks", company: "Jane Street", title: "Trader", email: "", linkedin: "", isAlum: false, preferences: "", addedBy: "m20" },
    { id: "p5", name: "Nina Alvarez", company: "Palantir", title: "Deployment Strategist", email: "", linkedin: "", isAlum: true, alumClass: 2024, preferences: "Prefers text after the first email.", addedBy: "m19" },
    { id: "p6", name: "Tom Becker", company: "BlackRock", title: "Analyst", email: "", linkedin: "", isAlum: false, preferences: "", addedBy: "m10" },
  ],
  outreach: [
    { id: "o1", contactId: "p1", memberId: "m1", date: "2026-08-10", channel: "Email", responded: true, responseDays: 2, chatted: true, helpfulness: 5, referred: true, notes: "Referred me to the BA recruiter." },
    { id: "o2", contactId: "p1", memberId: "m9", date: "2026-09-01", channel: "Email", responded: true, responseDays: 4, chatted: true, helpfulness: 4, referred: false, notes: "" },
    { id: "o3", contactId: "p2", memberId: "m1", date: "2026-07-15", channel: "LinkedIn", responded: false, chatted: false, referred: false, notes: "Followed up twice." },
    { id: "o4", contactId: "p2", memberId: "m10", date: "2026-06-20", channel: "LinkedIn", responded: true, responseDays: 9, chatted: true, helpfulness: 3, referred: false, notes: "" },
    { id: "o5", contactId: "p3", memberId: "m1", date: "2026-08-22", channel: "Email", responded: true, responseDays: 1, chatted: true, helpfulness: 5, referred: true, notes: "Ran a full mock case." },
    { id: "o6", contactId: "p4", memberId: "m9", date: "2026-09-12", channel: "Email", responded: false, chatted: false, referred: false, notes: "" },
    { id: "o7", contactId: "p5", memberId: "m12", date: "2026-09-05", channel: "Email", responded: true, responseDays: 3, chatted: true, helpfulness: 4, referred: false, notes: "" },
    { id: "o8", contactId: "p6", memberId: "m10", date: "2026-05-02", channel: "In person", responded: true, responseDays: 0, chatted: true, helpfulness: 3, referred: false, notes: "Met at career fair." },
  ],
  projects: [
    { id: "pr1", client: "vals.ai", year: 2025, term: "Spring", practice: "Digital", sector: "AI / LLM", categories: ["Benchmarking", "Data pipeline", "Statistical analysis"], summary: "Pipeline injecting racial bias into 2,000 MedQA questions; evaluated 5 bias types across 15+ LLMs. Benchmark published on vals.ai.", deliverables: [{ label: "Final report", url: "#" }, { label: "Pipeline repo", url: "#" }], lead: "m19" },
    { id: "pr2", client: "IBM InstructLab", year: 2024, term: "Fall", practice: "Digital", sector: "SaaS", categories: ["Product design", "Prototype", "User research"], summary: "Functional prototype for reviewing synthetic training data, circulated across IBM teams.", deliverables: [{ label: "Prototype", url: "#" }, { label: "Final deck", url: "#" }], lead: "m20" },
    { id: "pr3", client: "Paulaner Sunset", year: 2024, term: "Spring", practice: "Strategy", sector: "Consumer", categories: ["Market entry", "Customer research", "Survey"], summary: "Customer behavior analysis and student sentiment study for US market entry of a non-alcoholic beverage.", deliverables: [{ label: "Final deck", url: "#" }, { label: "Survey data", url: "#" }], lead: "m21" },
    { id: "pr4", client: "Emovid", year: 2024, term: "Fall", practice: "Strategy", sector: "Technology", categories: ["Market sizing", "Pricing", "Segmentation"], summary: "Market identification, segmentation and sizing with a pricing strategy for a video AI company.", deliverables: [{ label: "Final deck", url: "#" }, { label: "Sizing model", url: "#" }], lead: "m18" },
    { id: "pr5", client: "Gem Real Estate", year: 2023, term: "Fall", practice: "Strategy", sector: "Real Estate", categories: ["Competitive benchmarking", "Positioning"], summary: "Benchmarking and amenity recommendations to lift ADR and length of stay for a new resort.", deliverables: [{ label: "Final deck", url: "#" }], lead: "m21" },
    { id: "pr6", client: "Mesopetania AI", year: 2023, term: "Spring", practice: "Strategy", sector: "Consumer AI", categories: ["Customer research", "Product strategy", "Retention"], summary: "Research on creators' use of generative AI and recommended features to boost retention.", deliverables: [{ label: "Final deck", url: "#" }], lead: "m20" },
    { id: "pr7", client: "National agriculture transportation team", year: 2023, term: "Spring", practice: "Digital", sector: "Logistics", categories: ["Data cleaning", "Optimization"], summary: "Cleaned and optimized large logistics and supply-chain datasets.", deliverables: [{ label: "Notebook", url: "#" }], lead: "m20" },
  ],
  templates: [
    { id: "tp1", title: "Market sizing model", category: "Market sizing", description: "Top-down and bottom-up sizing workbook with sensitivity table.", sourceProjectId: "pr4", url: "#" },
    { id: "tp2", title: "Customer interview guide", category: "Customer research", description: "Screener, consent script and 30-minute interview structure.", sourceProjectId: "pr3", url: "#" },
    { id: "tp3", title: "Survey design and analysis kit", category: "Customer research", description: "Question bank, Qualtrics template and analysis workbook.", sourceProjectId: "pr3", url: "#" },
    { id: "tp4", title: "Competitive benchmarking matrix", category: "Competitive benchmarking", description: "Feature and pricing comparison grid with scoring.", sourceProjectId: "pr5", url: "#" },
    { id: "tp5", title: "Final presentation deck", category: "Deliverables", description: "Graphite-branded master deck with executive summary layout.", url: "#" },
    { id: "tp6", title: "Pricing analysis workbook", category: "Pricing", description: "Van Westendorp and competitor price-point analysis.", sourceProjectId: "pr4", url: "#" },
  ],
  settings: {
    archiveDeckUrl: "",
    archiveNote: "Every Graphite deck, event photo and recruiting slide from 2018 onward.",
  },
};
