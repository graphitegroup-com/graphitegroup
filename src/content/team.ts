/**
 * Current roster, copied from the Webflow site.
 * Temporary: once the member portal is live this page reads from the members
 * table, so graduations and promotions update it automatically.
 */

export type Member = { name: string; role: string; photo?: string };

export const team: { group: string; members: Member[] }[] = [
  {
    group: "Executive Board",
    members: [
      { name: "Grant Gutzwiller", role: "Managing Director" },
      { name: "Ananya Mahtani", role: "Director of Strategy & Client Relations" },
      { name: "Ellie Lian", role: "Director of Digital" },
      { name: "Lucia Brunelli", role: "Director of Recruiting & Engagement" },
      { name: "Case Sakamoto", role: "Director of Professional Development" },
    ],
  },
  {
    group: "Team Leads",
    members: [
      { name: "Anika Sharma", role: "Digital Team Lead" },
      { name: "Crystina Young", role: "Strategy Team Lead" },
      { name: "Felix Peng", role: "Digital Team Lead" },
      { name: "Kyrsten Su", role: "Team Lead" },
      { name: "Nate Wehner", role: "Team Lead" },
      { name: "Tyler Lee", role: "Team Lead" },
    ],
  },
  {
    group: "Consultants",
    members: [
      { name: "Keith Maben", role: "Consultant" },
      { name: "Natalia Mathias", role: "Consultant" },
      { name: "Sohana Mulchand", role: "Consultant" },
      { name: "Joseph Nahas", role: "Consultant" },
      { name: "Jasper Detta", role: "Consultant" },
      { name: "Berenice Stolte", role: "Consultant" },
      { name: "Shrinidhi Sriraman", role: "Consultant" },
      { name: "Lok Pui Fong", role: "Consultant" },
      { name: "Noah Becker", role: "Consultant" },
      { name: "Amber Zhang", role: "Consultant" },
      { name: "Diego Agustin", role: "Digital Consultant" },
      { name: "Grace Murray", role: "Digital Consultant" },
      { name: "Sandy Shan", role: "Digital Consultant" },
      { name: "AJ Matheson-Lieber", role: "Digital Consultant" },
    ],
  },
  {
    group: "Advisors",
    members: [
      { name: "Juliana Jasma", role: "Advisor" },
      { name: "Athena Ke", role: "Advisor" },
      { name: "Sebastian Toole", role: "Advisor" },
    ],
  },
];
