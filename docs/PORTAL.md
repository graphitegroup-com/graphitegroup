# Member Portal

Goal: institutional memory that doesn't graduate. Everything members learn (who's in the org, how recruiting went, which alumni respond, what past projects looked like, what exec has to do each year) gets captured once and stays useful after people leave.

## Status

Built and clickable, running on sample data in the browser (`src/portal/store.tsx`). In the preview build, the sign-in page lists sample people to try it as (Managing Director, Team Lead, Consultant, Associate Consultant, alum, and a new member who hasn't set up an account), and any password works.

| Module | Route | What it does |
| --- | --- | --- |
| Sign-in | `/login` | Invite-only. Exec adds a member's school and/or personal email; the member chooses "Set up your account", sets a password and confirms their details (school, class, start term, practice, role other than Executive Board). Either email signs in afterwards |
| Home | `/portal` | This semester's tasks, follow-ups due from your network, the most active forum threads, your applications and (for exec) items that need approval |
| Forum | `/portal/forum` | Bookface-style threads split into All threads, Current members and Alumni, across six channels (Recruiting, Interview prep, Referrals and intros, Opportunities, Offers, General), with replies, "helpful" votes, search and sorting. Everyone can read every space. A thread can be tagged with a firm and then also shows on that company's page. Exec can pin threads and remove any post |
| Directory | `/portal/directory` | Members and alumni with filters, showing personal emails. Class standing and alumni status are computed from graduation year; alumni show the highest role they held. Phone is visible only to the member and exec |
| My Recruiting | `/portal/recruiting` | Three tabs: Applications (your pipeline by stage), My network (your outreach spreadsheet: add a person with their LinkedIn and current role and they join the shared Network; follow-up reminders after 7 days with no reply; one-click updates for replies, chats and thank-yous that feed the contact grades) and My interviews |
| Companies | `/portal/companies` | Every firm members recruit with, graded by members on their recruiting process (communication, speed, fairness, interviewers, would they recommend applying), plus interview reports by year and forum threads about the firm |
| Network | `/portal/network` | Shared contacts with an outreach grade built from the outreach log (response rate, reply speed, helpfulness), searchable by firm. Any member can move a contact to a new firm or title; earlier roles are kept |
| Projects | `/portal/projects` | Past engagements, what each team learned (tagged lessons that stack up by topic and are searchable across projects) and reusable templates |
| Profile | `/portal/profile` | Name, emails, phone, school, grad year, practice, headshot |
| Members & Roles (exec) | `/portal/admin` | The full roster, current and alumni. Add members by email, see who has set up their sign-in, edit roles and exec titles, and approve the one automatic proposal: Associate Consultant to Consultant after two semesters. Alumni keep the highest role they held |
| Recurring Tasks (exec) | `/portal/admin/tasks` | Exec sets each semester's first day of classes and length once a year; tasks are set as "week 3", "2 weeks before classes start" or "the last week" and date themselves, aimed at everyone, a role, or whoever holds an exec title |
| Website (exec) | `/portal/admin/website` | Out of the sidebar while the public site stays on Webflow. Edits the public pages kept in this repo |

The automation rules are pure functions in `src/portal/logic.ts` (academic year, class standing, alumni cutoff, promotion proposals, highest role, semester task dates, follow-up reminders, response stats, grades), so the same code can run in a nightly job.

### Grades

Modeled on how Bookface founders rate investors, and built to be trusted for the same reasons: only members can see or write them, every grade is tied to a real interaction, and the letter needs a minimum of evidence.

- **Firms.** A member grades a firm once per recruiting cycle, saying how far they got (application, online assessment, first round, final) and the outcome. Communication and speed are always scored; fairness only once they were assessed; interviewers only once they were interviewed. The letter (A to F) is the average of every grade's mean score.
- **Contacts.** No separate form: every logged outreach counts. Response rate, median reply time and average helpfulness are each mapped to 1 to 5 and averaged.
- **Minimum of 3 members.** A letter only appears once 3 different members have graded a firm or logged outreach to a contact (`MIN_GRADERS`). Below that, one bad week would define a firm, and an anonymous grade would be easy to trace.
- **Anonymous, not unaccountable.** Grades and outreach can be posted anonymously. Other members see "Anonymous member"; the author and exec still see the name. In the database the base tables are readable only by their author and exec; members read `firm_grades_visible` and `outreach_visible`, which blank out the author of anonymous rows.

### Design

The portal mirrors Bookface on a plain white page: panels with hairline borders and 3px corners, warm-gray fills (`#f6f6ef`) for hovers and table headers, small uppercase panel labels, Avenir (Nunito Sans where Avenir isn't installed) and one blue for actions and links. Bookface's own `#268bd2` is darkened to `#1f78bd` so white text on it passes WCAG AA. Tokens are in `src/app/globals.css`, type in `src/portal/portal.css`, components in `src/portal/ui.tsx`.

## Going live

1. Create a Supabase project under a club-owned account and run `supabase/schema.sql`.
2. In Authentication, keep email + password sign-in and **email confirmation on** (otherwise anyone who knows a member's email could claim their account before they do). The `auth_users_roster_only` trigger already rejects emails that aren't on the roster.
3. Connect an email sender (Authentication, SMTP settings). Supabase writes and sends the confirmation and password-reset emails itself, but its built-in sender only delivers to your Supabase team's own addresses, a few an hour. A free option: a shared club Gmail account with an app password as the SMTP server. GitHub doesn't send email for apps.
4. Import the real roster into `members` from a spreadsheet (Table editor, Import CSV). Real member data goes in the database only, never into this repo.
5. Replace the browser store in `src/portal/store.tsx` and `src/lib/use-site-content.ts` with Supabase queries. The data shapes already match the tables. Read grades from `firm_grades_visible`, outreach from `outreach_visible` and interview reports from `interview_reports_visible`, never the base tables, and store forum votes as rows in `forum_votes`.
4. Move headshots to Supabase Storage (the preview stores them as resized data URLs).
5. Add a daily scheduled job for alumni transitions, task generation on July 1 and promotion proposals each term.
6. Turn on Supabase Realtime for `forum_posts` and `forum_replies` so new threads and replies appear without a refresh. Direct messages between members are the next step after the forum and would use the same channel.

## Stack

Everything runs on free tiers.

- **Next.js** (this repo), members only. `/` opens the portal; the public site stays on Webflow, so add a "Members" link there pointing at the portal's address. Portal routes live under `src/app/(portal)/` with their own layout and sidebar.
- **Hosting: GitHub Pages.** The portal runs entirely in the browser and its security comes from Supabase's row-level security, not a server, so it ships as static files (as `npm run build:preview` already does). GitHub's free plan publishes Pages only from a public repo; the code, schema and fictional sample data are safe to show, and real member data lives only in Supabase. Vercel's free Hobby plan is the alternative, but it is limited to non-commercial personal use and only deploys commits authored by the account owner on private repos.
- **Supabase**: Postgres, Auth and file storage in one place. The free plan (500 MB database, 1 GB file storage, 50,000 monthly active users) is far more than a club needs.
  - **Pausing:** free projects pause after 7 days with no activity and must be restored by hand, which would happen every winter and summer break. Add a free daily GitHub Actions job that makes one small query to keep the project awake.
  - **Sign-in:** email and password, invite-only. A signed-in account belongs to whichever member has that school or personal email (`member_for_email`), so either email works and alumni keep access after their school address closes.
  - **Row Level Security** keeps phone numbers visible only to the member themself and to exec, and a trigger stops members changing their own role, exec title or website visibility.
  - **`pg_cron`** runs the yearly rollovers (below).

## Modules (sidebar)

1. **Home**: action items for you, chosen by your role and the time of year.
2. **Directory**: everyone, filterable by school, year, practice and role.
3. **My Recruiting**: your applications, your network tracker and your interviews.
4. **Forum**: questions and answers about recruiting, interviews, referrals and offers, plus an alumni space.
5. **Companies**: member grades and interview intel by firm and year.
6. **Network**: alumni and contacts, with outreach grades.
7. **Projects**: every engagement, what each team learned, and templates.

## Data model (first pass)

```
members
  id, first_name, last_name, personal_email, school_email,
  phone*, school (pomona|cmc|hmc|scripps|pitzer), grad_year,
  practice (strategy|digital), joined_term, linkedin, photo_url,
  status (active|alumni|inactive)        -- derived, see automation
  * restricted columns: self + exec only

member_roles                                -- history, never overwritten
  member_id, role (associate|consultant|team_lead|exec|advisor),
  exec_title (managing_director|dir_strategy_client|dir_digital|dir_recruiting|dir_pd|...),
  term_start, term_end

task_templates                              -- what exec defines once
  title, body, audience (all|role|exec_title|member), due_rule
  (e.g. "Sep 1 every year", "2 weeks before spring recruiting"), recurring bool, owner

tasks                                       -- generated instances
  template_id, assignee_id, due_at, done_at, academic_year

companies           id, name, industry, website
applications        member_id, company_id, role_title, cycle (e.g. 2026-27 SA),
                    stage (applied|oa|first_round|superday|final|offer|rejected|withdrew),
                    stage_dates jsonb, notes
interview_reports   company_id, member_id, year, round, format, questions, tips, difficulty
comments            subject_type (contact|project), subject_id, author_id, body
firm_grades         company, member_id, cycle, stage_reached, outcome, communication,
                    speed, fairness?, interviewers?, recommend, review, anonymous
forum_posts         channel, member_id, title, body, company?, pinned, edited_at
forum_replies       post_id, member_id, body
forum_votes         member_id, post_id | reply_id (one helpful vote each)

contacts            id, name, company_id, title, email, linkedin, is_graphite_alum,
                    alum_member_id, preferences (how they like to be reached)
outreach            member_id, contact_id, sent_at, channel, responded bool,
                    responded_at, chatted bool, helpfulness 1-5, referral_likelihood 1-5, notes
                    -> response rate / median response time per contact, computed in a view

projects            client, year, term, practice, sector, categories[], summary,
                    deliverables (Drive links), team (member ids), search tsvector
templates           title, category, source_project_id, file link, description
```

## Automation

- **Class year and aging out.** Standing is computed from `grad_year` and the current academic year (rolling over July 1). A nightly job moves anyone past commencement to `alumni` and sends a reminder to update their personal email first.
- **Role maturation.** The one automatic proposal: Associate Consultant to Consultant after two completed semesters. Exec approves it (one at a time or all at once) and approvals write to `role_changes`. Nothing changes silently. Once someone graduates, their highest role is fixed.
- **Exec handoff.** When the new exec board's terms start, task templates re-target to the new title holders automatically, so "book the recruiting room by Aug 25" reaches whoever is Director of Recruiting that year.
- **Recurring tasks.** Each summer exec enters the fall and spring first days of classes and lengths; every template's due date (a week relative to the start or the end of the semester, due that Friday) follows from them. Home shows what is overdue and coming up.
- **Public site sync.** `/team` reads current members and roles from the database, so the website roster stays up to date on its own.

## Project archive ingestion (Google Drive)

With Drive access: crawl the projects folder, extract text from decks and docs, then draft a summary, sector, categories, deliverables and lessons learned for each project. Exec reviews the drafts, then they're indexed for full-text search. Templates are tagged from the strongest past deliverables per category.

## Decisions needed

- Who is "exec" for permissions: anyone with the Executive Board role (current), or a configurable list?
- Should the Current members and Alumni forum spaces be readable by everyone (current) or only by that group? It's one policy change either way.
