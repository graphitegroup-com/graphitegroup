/**
 * Current roster and headshots, copied from the Webflow site.
 * Temporary: once the member portal is live this page reads from the members
 * table, so graduations and promotions update it automatically.
 */

export type Member = { name: string; role: string; photo?: string };

export const team: { group: string; members: Member[] }[] = [
  {
    group: "Executive Board",
    members: [
      { name: "Grant Gutzwiller", role: "Managing Director", photo: "/images/people/grant-gutzwiller.jpg" },
      { name: "Ananya Mahtani", role: "Director of Strategy & Client Relations", photo: "/images/people/ananya-mahtani.jpg" },
      { name: "Ellie Lian", role: "Director of Digital", photo: "/images/people/ellie-lian.jpg" },
      { name: "Lucia Brunelli", role: "Director of Recruiting & Engagement", photo: "/images/people/lucia-brunelli.jpg" },
      { name: "Case Sakamoto", role: "Director of Professional Development", photo: "/images/people/case-sakamoto.jpg" },
    ],
  },
  {
    group: "Team Leads",
    members: [
      { name: "Anika Sharma", role: "Digital Team Lead", photo: "/images/people/anika-sharma.jpg" },
      { name: "Crystina Young", role: "Strategy Team Lead", photo: "/images/people/crystina-young.jpg" },
      { name: "Felix Peng", role: "Digital Team Lead", photo: "/images/people/felix-peng.jpg" },
      { name: "Kyrsten Su", role: "Team Lead", photo: "/images/people/kyrsten-su.jpg" },
      { name: "Nate Wehner", role: "Team Lead", photo: "/images/people/nate-wehner.jpg" },
      { name: "Tyler Lee", role: "Team Lead", photo: "/images/people/tyler-lee.jpg" },
    ],
  },
  {
    group: "Consultants",
    members: [
      { name: "Keith Maben", role: "Consultant", photo: "/images/people/keith-maben.jpg" },
      { name: "Natalia Mathias", role: "Consultant", photo: "/images/people/natalia-mathias.jpg" },
      { name: "Sohana Mulchand", role: "Consultant", photo: "/images/people/sohana-mulchand.jpg" },
      { name: "Joseph Nahas", role: "Consultant", photo: "/images/people/joseph-nahas.jpg" },
      { name: "Jasper Detta", role: "Consultant", photo: "/images/people/jasper-detta.jpg" },
      { name: "Berenice Stolte", role: "Consultant", photo: "/images/people/berenice-stolte.jpg" },
      { name: "Shrinidhi Sriraman", role: "Consultant", photo: "/images/people/shrinidhi-sriraman.jpg" },
      { name: "Lok Pui Fong", role: "Consultant", photo: "/images/people/lok-pui-fong.jpg" },
      { name: "Noah Becker", role: "Consultant", photo: "/images/people/noah-becker.jpg" },
      { name: "Amber Zhang", role: "Consultant", photo: "/images/people/amber-zhang.jpg" },
      { name: "Diego Agustin", role: "Digital Consultant", photo: "/images/people/diego-agustin.jpg" },
      { name: "Grace Murray", role: "Digital Consultant", photo: "/images/people/grace-murray.jpg" },
      { name: "Sandy Shan", role: "Digital Consultant", photo: "/images/people/sandy-shan.jpg" },
      { name: "AJ Matheson-Lieber", role: "Digital Consultant", photo: "/images/people/aj-matheson-lieber.jpg" },
    ],
  },
  {
    group: "Advisors",
    members: [
      { name: "Juliana Jasma", role: "Advisor", photo: "/images/people/juliana-jasma.jpg" },
      { name: "Athena Ke", role: "Advisor", photo: "/images/people/athena-ke.jpg" },
      { name: "Sebastian Toole", role: "Advisor", photo: "/images/people/sebastian-toole.jpg" },
    ],
  },
];
