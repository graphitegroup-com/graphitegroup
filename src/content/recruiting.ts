/**
 * Recruiting cycle shown on /students. Flip `status` and swap the dates each
 * semester. ("open" shows the application buttons, "closed" shows the mailing list.)
 */

export const recruiting = {
  status: "closed" as "open" | "closed",
  cycle: "Fall 2026",
  next: "Spring 2027",
  closedMessage:
    "Fall 2026 recruiting has wrapped. Spring recruiting opens at the start of next semester; join the list and you will hear first.",
  contact: {
    name: "Lucia Brunelli",
    title: "Director of Recruiting & Engagement",
    email: "lbbd2023@mymail.pomona.edu",
  },
  applications: [
    {
      label: "Strategy application",
      href: "https://docs.google.com/forms/d/e/1FAIpQLSdmwjJ7T3fjZrjbHQ3l1PSC62aww7Rfd2Zhi9GI7TBNrBHS1Q/viewform",
    },
    {
      label: "Digital application",
      href: "https://docs.google.com/forms/d/e/1FAIpQLScabDFMvYwNyYKVcHs5BF36pg-hZ3OijfbFOqnliQADNFoqRA/viewform",
    },
  ],
  mailingList: "https://forms.gle/UUqJrvFSrXCJfeDC8",
  calendar: [
    {
      phase: "Meet us",
      items: [
        { what: "CMC Club Fair", when: "Sep 4" },
        { what: "5C Club Fair", when: "Sep 9" },
        { what: "CMC Info Session", when: "Sep 9 · 7:30pm", where: "Kravis Lower Court 62" },
        { what: "Pomona Info Session", when: "Sep 11 · 4:00pm", where: "SCC 208" },
        { what: "Women's Coffee Chat", when: "Sep 12 · 4:00pm", where: "The Hub" },
        { what: "Ask Graphite Anything", when: "Sep 13 · Noon", where: "The Hub" },
        { what: "CMC Application Workshop", when: "Sep 16 · 7:30pm", where: "Pickford Auditorium" },
      ],
    },
    {
      phase: "Strategy track",
      items: [
        { what: "Application due", when: "Sep 22 · 6pm" },
        { what: "Group interview", when: "Sep 25–26" },
        { what: "Final interview", when: "Sep 27" },
      ],
    },
    {
      phase: "Digital track",
      items: [
        { what: "Application due", when: "Sep 17 · 6pm" },
        { what: "Behavioral interview", when: "Sep 19–20" },
        { what: "Technical case due", when: "Sep 22" },
        { what: "Final interviews", when: "Sep 25–27" },
      ],
    },
  ],
  decisions: "Sep 27",
};
