/**
 * Everything on the public site that exec can edit from the portal
 * (Admin > Website). Defaults come from src/content; edits are layered on top.
 *
 * Preview build: edits are saved in the browser (localStorage).
 * Production: the same shape is stored in the `site_content` table (see
 * supabase/schema.sql) and read on the server.
 */

import { caseStudies, site, testimonials, type CaseStudy } from "@/content/site";
import { recruiting } from "@/content/recruiting";
import { team } from "@/content/team";

export type PublicMember = {
  id: string;
  name: string;
  role: string;
  group: string;
  photo?: string; // URL or data URL
};

export type SiteContent = {
  stats: { value: string; label: string }[];
  groups: string[];
  roster: PublicMember[];
  caseStudies: CaseStudy[];
  testimonials: { quote: string; name: string; org: string }[];
  recruiting: {
    status: "open" | "closed";
    cycle: string;
    next: string;
    decisions: string;
    closedMessage: string;
  };
  updatedAt?: string;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export const defaultSiteContent: SiteContent = {
  stats: site.stats.map((s) => ({ ...s })),
  groups: team.map((g) => g.group),
  roster: team.flatMap((g) =>
    g.members.map((m) => ({ id: slug(m.name), name: m.name, role: m.role, group: g.group, photo: m.photo })),
  ),
  caseStudies: caseStudies.map((c) => ({ ...c })),
  testimonials: testimonials.map((t) => ({ ...t })),
  recruiting: {
    status: recruiting.status,
    cycle: recruiting.cycle,
    next: recruiting.next,
    decisions: recruiting.decisions,
    closedMessage: recruiting.closedMessage,
  },
};
