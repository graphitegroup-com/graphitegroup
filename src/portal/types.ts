/** Portal domain types. These mirror the tables in supabase/schema.sql. */

export type School = "Pomona" | "CMC" | "Harvey Mudd" | "Scripps" | "Pitzer";
export const SCHOOLS: School[] = ["Pomona", "CMC", "Harvey Mudd", "Scripps", "Pitzer"];

export type Practice = "Strategy" | "Digital";

export type Role = "Associate Consultant" | "Consultant" | "Team Lead" | "Executive Board" | "Advisor";
export const ROLES: Role[] = ["Associate Consultant", "Consultant", "Team Lead", "Executive Board", "Advisor"];

export const EXEC_TITLES = [
  "Managing Director",
  "Director of Strategy & Client Relations",
  "Director of Digital",
  "Director of Recruiting & Engagement",
  "Director of Professional Development",
] as const;
export type ExecTitle = (typeof EXEC_TITLES)[number];

/** "F2025" = fall 2025, "S2026" = spring 2026. */
export type Term = `${"F" | "S"}${number}`;

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  personalEmail: string;
  schoolEmail: string;
  phone: string; // private: self + exec
  school: School;
  studentId: string; // private: self + exec
  gradYear: number;
  practice: Practice;
  role: Role;
  execTitle?: ExecTitle;
  joinedTerm: Term;
  linkedin?: string;
  photo?: string;
  showOnWebsite: boolean;
};

export type RoleChange = { id: string; memberId: string; from: Role; to: Role; term: Term; approvedBy: string };

export type Audience =
  | { kind: "all" }
  | { kind: "role"; role: Role }
  | { kind: "title"; title: ExecTitle };

export type TaskTemplate = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  /** Due every academic year on this month/day (1-12, 1-31). */
  month: number;
  day: number;
  createdBy: string;
};

export type Stage =
  | "Researching"
  | "Applied"
  | "Online Assessment"
  | "First Round"
  | "Superday / Final"
  | "Offer"
  | "Rejected"
  | "Withdrew";
export const STAGES: Stage[] = [
  "Researching",
  "Applied",
  "Online Assessment",
  "First Round",
  "Superday / Final",
  "Offer",
  "Rejected",
  "Withdrew",
];

export type Application = {
  id: string;
  memberId: string;
  company: string;
  position: string;
  cycle: string; // e.g. "Summer 2027 Internship"
  stage: Stage;
  updatedAt: string;
  notes: string;
};

export type InterviewReport = {
  id: string;
  company: string;
  memberId: string;
  year: number;
  position: string;
  round: string;
  format: string;
  questions: string;
  tips: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  outcome: "Advanced" | "Offer" | "Rejected" | "Unknown";
};

export type Comment = {
  id: string;
  subject: string; // "company:goldman-sachs", "contact:c1", "project:p1"
  memberId: string;
  body: string;
  createdAt: string;
};

export type Contact = {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  linkedin: string;
  isAlum: boolean;
  alumClass?: number;
  preferences: string;
  addedBy: string;
};

export type Outreach = {
  id: string;
  contactId: string;
  memberId: string;
  date: string;
  channel: "Email" | "LinkedIn" | "Referral" | "In person";
  responded: boolean;
  responseDays?: number;
  chatted: boolean;
  helpfulness?: 1 | 2 | 3 | 4 | 5;
  referred: boolean;
  notes: string;
};

export type Project = {
  id: string;
  client: string;
  year: number;
  term: "Fall" | "Spring";
  practice: Practice;
  sector: string;
  categories: string[];
  summary: string;
  deliverables: { label: string; url: string }[];
  lead: string;
};

export type Template = {
  id: string;
  title: string;
  category: string;
  description: string;
  sourceProjectId?: string;
  url: string;
};

export type Settings = {
  archiveDeckUrl: string;
  archiveNote: string;
};

export type PortalData = {
  members: Member[];
  roleChanges: RoleChange[];
  taskTemplates: TaskTemplate[];
  /** `${templateId}:${academicYear}:${memberId}` -> ISO completion time */
  taskDone: Record<string, string>;
  applications: Application[];
  reports: InterviewReport[];
  comments: Comment[];
  contacts: Contact[];
  outreach: Outreach[];
  projects: Project[];
  templates: Template[];
  settings: Settings;
};
