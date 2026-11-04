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
  /** Members can sign in with either email; alumni keep the personal one after school email closes. */
  personalEmail: string;
  schoolEmail: string;
  phone: string; // private: self + exec
  school: School;
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

export const TASK_SEMESTERS = ["Fall", "Spring", "Every semester"] as const;
export type TaskSemester = (typeof TASK_SEMESTERS)[number];

/**
 * When a recurring task falls, relative to the semester calendar exec sets:
 *  before: n weeks before classes start (n >= 1)
 *  week:   week n of the semester (1 = the first week of classes)
 *  end:    n weeks before the last week (0 = the last week)
 * Due dates land on the Friday of that week.
 */
export type TaskWhen = { anchor: "before" | "week" | "end"; n: number };

export type TaskTemplate = {
  id: string;
  title: string;
  body: string;
  audience: Audience;
  semester: TaskSemester;
  when: TaskWhen;
  createdBy: string;
};

/** First day of classes (YYYY-MM-DD) and length in weeks. */
export type SemesterDates = { start: string; weeks: number };

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
  /** Furthest stage reached, so a rejection after a final round still shows how far it got. */
  furthest: Stage;
  /**
   * Shared with members under "Anonymous member" instead of a name. Either
   * way an application stays private until it reaches a first round.
   */
  anonymous: boolean;
  /** 1 to 5: how much work the application took. */
  effort?: Score;
  /** 1 to 5: how well the role fits the member's interests. */
  fit?: Score;
  updatedAt: string;
  /**
   * Notes on the process, shown on the firm's page right away. They carry the
   * member's name once the application reaches a first round, unless
   * `notesAnonymous`; before that they show as "Anonymous member".
   */
  notes: string;
  notesAnonymous?: boolean;
};

export type InterviewReport = {
  id: string;
  company: string;
  memberId: string;
  year: number;
  position: string;
  round: string;
  format: string;
  /** General thoughts on how it went. Interview questions live in the question bank, unlinked. */
  overview: string;
  tips: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  outcome: "Advanced" | "Offer" | "Rejected" | "Unknown";
  /** Hidden from other members; the member and exec still see who wrote it. */
  anonymous?: boolean;
};

export const QUESTION_ROUNDS = ["Online assessment", "First round", "Final round", "Other"] as const;
export type QuestionRound = (typeof QUESTION_ROUNDS)[number];

/**
 * One interview question in a firm's question bank: the firm, a broad round
 * and the text, with no date, year, position or link to a report. Anonymous
 * by default, and then no author is stored at all; `memberId` is set only
 * when the member chose to show their name.
 */
export type InterviewQuestion = { id: string; company: string; round: QuestionRound; question: string; memberId?: string };

export type Comment = {
  id: string;
  subject: string; // "contact:c1", "project:p1". Company discussion lives in the forum.
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
  /** Earlier roles, newest first, kept when a member moves the contact to a new company or title. */
  history?: { company: string; title: string; until: string }[];
  updatedAt?: string;
  updatedBy?: string;
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
  /** Hidden from other members; the member and exec still see who logged it. */
  anonymous?: boolean;
  /** Dates (YYYY-MM-DD) of follow-up messages after the first one. */
  followUps?: string[];
  /** When they replied; responseDays is counted from `date` to this. */
  respondedOn?: string;
  /** Sent a thank-you after the chat. */
  thanked?: boolean;
};

export type Score = 1 | 2 | 3 | 4 | 5;

export const STAGES_REACHED = ["Applied", "Online Assessment", "First Round", "Superday / Final"] as const;
export type StageReached = (typeof STAGES_REACHED)[number];

/**
 * What a member grades a firm's recruiting process on, each 1 to 5. A
 * dimension only applies once the candidate reached `from`: someone who was
 * never interviewed can't grade the interviewers.
 */
export const FIRM_DIMENSIONS = [
  { key: "communication", label: "Communication", hint: "Clear timelines, updates and responses", from: "Applied" },
  { key: "speed", label: "Speed", hint: "Moved quickly from application to decision", from: "Applied" },
  { key: "fairness", label: "Fairness", hint: "Assessments matched the role and were judged fairly", from: "Online Assessment" },
  { key: "interviewers", label: "Interviewers", hint: "Prepared, engaged and respectful", from: "First Round" },
] as const satisfies readonly { key: string; label: string; hint: string; from: StageReached }[];
export type FirmDimension = (typeof FIRM_DIMENSIONS)[number]["key"];

export const GRADE_OUTCOMES = ["Offer", "Rejected", "No response", "Withdrew", "Still in process"] as const;
export type GradeOutcome = (typeof GRADE_OUTCOMES)[number];

/**
 * One member's grade of a firm's recruiting process for one cycle. A member
 * holds at most one grade per firm and cycle; saving again replaces it.
 */
export type FirmGrade = {
  id: string;
  company: string;
  memberId: string;
  cycle: string; // e.g. "Summer 2027 Internship"
  stageReached: StageReached;
  outcome: GradeOutcome;
  /** Only the dimensions that apply at `stageReached`. */
  scores: Partial<Record<FirmDimension, Score>>;
  recommend: boolean;
  review: string;
  /** Hidden from other members; the member and exec still see who wrote it. */
  anonymous: boolean;
  createdAt: string;
};

export const FORUM_CHANNELS = [
  { id: "recruiting", label: "Recruiting", description: "Timelines, strategy and which firms to target" },
  { id: "interview-prep", label: "Interview prep", description: "Cases, technicals, behaviorals and mock partners" },
  { id: "referrals", label: "Referrals and intros", description: "Ask for an intro or offer one" },
  { id: "opportunities", label: "Opportunities", description: "Open roles members and alumni are hiring for" },
  { id: "offers", label: "Offers", description: "Deadlines, extensions, negotiation and choosing" },
  { id: "general", label: "General", description: "Everything else" },
] as const;
export type ForumChannel = (typeof FORUM_CHANNELS)[number]["id"];

/** Who a thread is for. Everyone can read every space; the split is for finding your people. */
export const FORUM_SPACES = [
  { id: "everyone", label: "Everyone", description: "Members and alumni together" },
  { id: "members", label: "Current members", description: "Questions among current members" },
  { id: "alumni", label: "Alumni", description: "Alumni keeping in touch and offering help" },
] as const;
export type ForumSpace = (typeof FORUM_SPACES)[number]["id"];

export type ForumPost = {
  id: string;
  space: ForumSpace;
  channel: ForumChannel;
  memberId: string;
  title: string;
  body: string;
  /** Firm the thread is about; the thread also appears on that company's page. */
  company?: string;
  pinned?: boolean;
  createdAt: string;
  editedAt?: string;
  /** Member ids. Production keeps these in forum_votes. */
  upvotes: string[];
};

export type ForumReply = {
  id: string;
  postId: string;
  memberId: string;
  body: string;
  createdAt: string;
  upvotes: string[];
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

/** The kinds of employer members recruit with, for filtering firms and people. */
export const COMPANY_TYPES = [
  "Consulting",
  "Investment banking",
  "Asset management",
  "Private equity and venture capital",
  "Quant and trading",
  "Technology",
  "Startups",
  "Corporate",
  "Nonprofit and government",
  "Other",
] as const;
export type CompanyType = (typeof COMPANY_TYPES)[number];

/** What members know about a firm itself. Any member can set or correct its type. */
export type Firm = { name: string; type: CompanyType; updatedBy?: string; updatedAt?: string };

export const JOB_KINDS = ["Summer internship", "Full-time", "Part-time"] as const;
export type JobKind = (typeof JOB_KINDS)[number];

/** Year in school when someone held a job; for a summer internship, the year just finished. */
export const CLASS_LEVELS = ["Freshman", "Sophomore", "Junior", "Senior", "Alum"] as const;
export type ClassLevel = (typeof CLASS_LEVELS)[number];

/**
 * A job a member held, shared with every member so younger ones can see where
 * Graphite has been hired and at what year. Applications stay private; this
 * is what a member chooses to share once they've worked somewhere.
 */
export type Job = {
  id: string;
  memberId: string;
  company: string;
  role: string;
  kind: JobKind;
  /** The summer's year for an internship; the start year otherwise. */
  year: number;
  classAtTime: ClassLevel;
  createdAt: string;
};

/** Something a project team learned, kept so later teams can search it by topic. */
export type Lesson = {
  id: string;
  projectId: string;
  memberId: string;
  body: string;
  tags: string[];
  createdAt: string;
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
  /** Set by exec each academic year; recurring task due dates are computed from it. */
  calendar: { year: number; fall: SemesterDates; spring: SemesterDates };
};

export type PortalData = {
  members: Member[];
  roleChanges: RoleChange[];
  taskTemplates: TaskTemplate[];
  /** `${templateId}:${term}:${memberId}` -> ISO completion time, term like "F2026" */
  taskDone: Record<string, string>;
  /** Preview stand-in for sign-in accounts: member id -> when they set up their password. */
  accounts: Record<string, string>;
  applications: Application[];
  reports: InterviewReport[];
  questions: InterviewQuestion[];
  comments: Comment[];
  contacts: Contact[];
  outreach: Outreach[];
  grades: FirmGrade[];
  firms: Firm[];
  jobs: Job[];
  posts: ForumPost[];
  replies: ForumReply[];
  projects: Project[];
  lessons: Lesson[];
  templates: Template[];
  settings: Settings;
};
