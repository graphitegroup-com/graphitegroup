"use client";

import Link from "@/components/app-link";
import { appOutcome, appYear, companySlug, firmType, fullName, memberLine, reachedLabel, similarMembers, stageRank, suggestedFirms, type SimilarMember } from "./logic";
import { usePortal } from "./store";
import type { Application } from "./types";
import { Badge, Card, Empty } from "./ui";

const outcomeTone = (a: Application) => {
  const o = appOutcome(a);
  return o === "Offer" ? ("green" as const) : o === "Rejected" ? ("red" as const) : o === "Withdrew" ? ("gray" as const) : ("blue" as const);
};

/** "Offer, 2026", "Final round, rejected", "First round, in process". */
function result(a: Application) {
  if (a.stage === "Offer") return `Offer, ${appYear(a)}`;
  const reached = reachedLabel(a.furthest);
  const o = appOutcome(a);
  return o === "In process" ? `${reached}, in process` : `${reached}, ${o.toLowerCase()}`;
}

/** Each member's furthest application at a firm, furthest first. */
function bestAt(similar: SimilarMember[], company: string) {
  const key = companySlug(company);
  return similar
    .map((s) => ({ member: s.member, app: s.apps.filter((a) => companySlug(a.company.trim()) === key).sort((a, b) => stageRank(b.furthest) - stageRank(a.furthest))[0] }))
    .filter((x): x is { member: SimilarMember["member"]; app: Application } => !!x.app)
    .sort((a, b) => stageRank(b.app.furthest) - stageRank(a.app.furthest));
}

/**
 * Who recruits like you, and where they got furthest. Built only from
 * applications other members have shared with their name: anonymous ones and
 * anything before a first round never count.
 */
export function SimilarMembers() {
  const { data, me } = usePortal();
  if (!me) return null;

  const mine = data.applications.filter((a) => a.memberId === me.id);
  const similar = similarMembers(data, me);
  const firms = suggestedFirms(data, me, similar);
  const rated = mine.filter((a) => a.fit != null).length;

  const how = (
    <p className="border-b border-edge bg-[#fbfbf7] px-4 py-2 text-[12.5px] text-muted">
      Ranked by the firms you both applied to (60%) and the kinds of firm you both rated a 4 or 5 for fit (40%). Only applications members have shared with their
      name count; anonymous ones and anything before a first round never do.
      {mine.length > 0 && rated < mine.length && ` You've rated fit on ${rated} of your ${mine.length} applications; rating the rest sharpens this.`}
    </p>
  );

  if (mine.length === 0) {
    return (
      <Card flush>
        {how}
        <Empty>Add your applications and rate how well each fits your interests. Members who recruit like you then show up here.</Empty>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card title="Most similar to you" flush>
        {how}
        {similar.length === 0 ? (
          <Empty>No one yet. As more members reach first rounds and share their applications, matches appear here.</Empty>
        ) : (
          <ul className="divide-y divide-edge">
            {similar.map((s) => {
              const email = s.member.personalEmail || s.member.schoolEmail;
              const apps = [...s.apps].sort((a, b) => stageRank(b.furthest) - stageRank(a.furthest) || appYear(b) - appYear(a));
              return (
                <li key={s.member.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p>
                      <span className="font-medium">{fullName(s.member)}</span>
                      <span className="ml-2 text-[12.5px] text-muted">{memberLine(s.member)}</span>
                    </p>
                    <span className="text-[12.5px] text-muted tabular-nums">{Math.round(s.score * 100)}% match</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {s.sharedFirms.length > 0 && `Both applied to ${s.sharedFirms.join(", ")}. `}
                    {s.sharedTypes.length > 0 && `Both most interested in ${s.sharedTypes.join(", ").toLowerCase()}. `}
                    {email && (
                      <a href={`mailto:${email}`} className="text-link hover:underline">
                        {email}
                      </a>
                    )}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {apps.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/portal/companies/${companySlug(a.company.trim())}`}
                          className="inline-flex items-center gap-1.5 rounded-[3px] border border-edge px-2 py-1 text-[12.5px] hover:border-[#cfcfc4] hover:bg-stone"
                        >
                          <span className="font-medium">{a.company}</span>
                          <Badge tone={outcomeTone(a)}>{result(a)}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Where they did well" flush>
        <p className="border-b border-edge bg-[#fbfbf7] px-4 py-2 text-[12.5px] text-muted">
          Firms you haven&apos;t applied to, weighted by how alike you are and how far they got. A final counts double, an offer triple.
        </p>
        {firms.length === 0 ? (
          <Empty>Nothing new: you&apos;ve applied everywhere your matches have.</Empty>
        ) : (
          <ol className="divide-y divide-edge">
            {firms.map((f) => {
              const type = firmType(data.firms, f.company);
              return (
                <li key={f.company} className="px-4 py-2.5">
                  <Link href={`/portal/companies/${companySlug(f.company)}`} className="font-medium hover:underline">
                    {f.company}
                  </Link>
                  {type && <span className="ml-2 text-[12px] text-faint">{type}</span>}
                  <ul className="mt-0.5 text-[12.5px] text-muted">
                    {bestAt(similar, f.company).map(({ member, app }) => (
                      <li key={member.id}>
                        {fullName(member)}: {result(app).replace(/^./, (c) => c.toLowerCase())}
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
