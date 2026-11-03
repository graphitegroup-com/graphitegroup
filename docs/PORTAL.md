# Member Portal

Goal: institutional memory that doesn't graduate. Everything members learn (who's in the org, how recruiting went, which alumni respond, what past projects looked like, what exec has to do each year) gets captured once and stays useful after people leave.

## Status

Built and clickable, running on sample data in the browser (`src/portal/store.tsx`). Log in from the **Login** button at the top right of the site. The login page offers three preview personas: Managing Director, Consultant and new Associate Consultant.

| Module | Route | What it does |
| --- | --- | --- |
| Home | `/portal` | Action items generated from exec's recurring tasks, the most active forum threads, a recruiting snapshot and (for exec) items that need approval |
| Forum | `/portal/forum` | Bookface-style threads in six channels (Recruiting, Interview prep, Referrals and intros, Opportunities, Offers, General), with replies, "helpful" votes, search and sorting. A thread can be tagged with a firm and then also shows on that company's page. Exec can pin threads and remove any post |
| Directory | `/portal/directory` | Members and alumni with filters. Class standing and alumni status are computed from graduation year. Phone and student ID are visible only to the member and exec |
| My Recruiting | `/portal/recruiting` | Personal application pipeline by stage, plus your coffee chats |
| Companies | `/portal/companies` | Every firm members recruit with, graded by members on their recruiting process (communication, speed, fairness, interviewers, would they recommend applying), plus interview reports by year and forum threads about the firm |
| Network | `/portal/network` | Shared contacts with an outreach grade built from the outreach log (response rate, reply speed, helpfulness), plus referrals and how to approach them |
| Projects | `/portal/projects` | Searchable archive of past engagements and reusable templates |
| Archive | `/portal/archive` | Link to the historical slide deck (set by exec) |
| Profile | `/portal/profile` | Onboarding fields: name, emails, phone, school, student ID, grad year, practice, role, headshot |
| Members & Roles (exec) | `/portal/admin` | Approve proposed promotions, edit roles and exec titles, add members, role history |
| Recurring Tasks (exec) | `/portal/admin/tasks` | Yearly task calendar aimed at everyone, a role, or whoever holds an exec title |
| Website (exec) | `/portal/admin/website` | Edit the public site with no code changes: stats, Our People roster with headshots (or sync it from the directory), case studies, recruiting status and testimonials |

The automation rules are pure functions in `src/portal/logic.ts` (academic year, class standing, alumni cutoff, promotion proposals, task generation, response stats, grades), so the same code can run in a nightly job.

### Grades

Modeled on how Bookface founders rate investors, and built to be trusted for the same reasons: only members can see or write them, every grade is tied to a real interaction, and the letter needs a minimum of evidence.

- **Firms.** A member grades a firm once per recruiting cycle, saying how far they got (application, online assessment, first round, final) and the outcome. Communication and speed are always scored; fairness only once they were assessed; interviewers only once they were interviewed. The letter (A to F) is the average of every grade's mean score.
- **Contacts.** No separate form: every logged outreach counts. Response rate, median reply time and average helpfulness are each mapped to 1 to 5 and averaged.
- **Minimum of 3 members.** A letter only appears once 3 different members have graded a firm or logged outreach to a contact (`MIN_GRADERS`). Below that, one bad week would define a firm, and an anonymous grade would be easy to trace.
- **Anonymous, not unaccountable.** Grades and outreach can be posted anonymously. Other members see "Anonymous member"; the author and exec still see the name. In the database the base tables are readable only by their author and exec; members read `firm_grades_visible` and `outreach_visible`, which blank out the author of anonymous rows.

### Design

The portal mirrors Bookface on a plain white page: panels with hairline borders and 3px corners, warm-gray fills (`#f6f6ef`) for hovers and table headers, small uppercase panel labels, Avenir (Nunito Sans where Avenir isn't installed) and one blue for actions and links. Bookface's own `#268bd2` is darkened to `#1f78bd` so white text on it passes WCAG AA. Tokens are in `src/app/globals.css`, type in `src/portal/portal.css`, components in `src/portal/ui.tsx`.

## Going live

1. Create a Supabase project and run `supabase/schema.sql`.
2. Enable Google sign-in and restrict it to 5C domains.
3. Replace the browser store in `src/portal/store.tsx` and `src/lib/use-site-content.ts` with Supabase queries. The data shapes already match the tables. Read grades from `firm_grades_visible` and outreach from `outreach_visible`, never the base tables, and store forum votes as rows in `forum_votes`.
4. Move headshots to Supabase Storage (the preview stores them as resized data URLs).
5. Add a daily scheduled job for alumni transitions, task generation on July 1 and promotion proposals each term.
6. Turn on Supabase Realtime for `forum_posts` and `forum_replies` so new threads and replies appear without a refresh. Direct messages between members are the next step after the forum and would use the same channel.

## Stack

Everything runs on free tiers.

- **Next.js** (this repo), members only. `/` opens the portal; the public site stays on WordPress, so add a "Members" link there pointing at the portal's address. Portal routes live under `src/app/(portal)/` with their own layout and sidebar.
- **Hosting.** Vercel's free Hobby plan is limited to non-commercial personal use, and Graphite does client work, so confirm with Vercel before relying on it. There's a simpler free option: the portal runs entirely in the browser, and its security comes from Supabase's row-level security, not a server. That means it can be exported as static files (as `npm run build:preview` already does) and served from Cloudflare Pages or GitHub Pages.
- **Supabase**: Postgres, Auth and file storage in one place. The free plan (500 MB database, 1 GB file storage, 50,000 monthly active users) is far more than a club needs.
  - **Pausing:** free projects pause after 7 days with no activity and must be restored by hand, which would happen every winter and summer break. Add a free daily GitHub Actions job that makes one small query to keep the project awake.
  - **Sign-in:** Google, limited to 5C email domains (`pomona.edu`, `mymail.pomona.edu`, `cmc.edu`, `hmc.edu`, `g.hmc.edu`, `scrippscollege.edu`, `pitzer.edu`, `students.pitzer.edu`). Alumni keep access through a personal-email magic link once their school address is closed.
  - **Row Level Security** keeps sensitive fields (phone, student ID, payroll) visible only to the member themself and to exec.
  - **`pg_cron`** runs the yearly rollovers (below).

## Modules (sidebar)

1. **Home**: action items for you, chosen by your role and the time of year.
2. **Directory**: everyone, filterable by school, year, practice and role.
3. **My Recruiting**: your applications and coffee chats.
4. **Forum**: questions and answers about recruiting, interviews, referrals and offers.
5. **Companies**: member grades and interview intel by firm and year.
6. **Network**: alumni and contacts, with outreach grades.
7. **Projects**: a searchable archive of every engagement, plus templates.
8. **Archive**: a link to the historical slide deck (the URL is a setting).

## Data model (first pass)

```
members
  id, auth_user_id, first_name, last_name, personal_email, school_email,
  phone*, student_id*, school (pomona|cmc|hmc|scripps|pitzer), grad_year,
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
- **Role maturation.** Each term, the system proposes promotions (e.g. Associate → Consultant after 2 semesters, Consultant → eligible for Team Lead). Exec approves them in one batch, and approvals write to `member_roles`. Nothing changes silently.
- **Exec handoff.** When the new exec board's terms start, task templates re-target to the new title holders automatically, so "book the recruiting room by Aug 25" reaches whoever is Director of Recruiting that year.
- **Recurring tasks.** On July 1, `tasks` are generated for the academic year from `task_templates`. Home shows what is overdue, due this week and coming up.
- **Public site sync.** `/team` reads current members and roles from the database, so the website roster stays up to date on its own.

## Project archive ingestion

With Drive access: crawl the projects folder, extract text from decks and docs, then generate a summary, sector, categories and deliverable types for each project. Exec reviews the results, then they're indexed for full-text search. Templates are tagged from the strongest past deliverables per category.

## Decisions needed

- Supabase OK as the backend? (Alternatives: Neon + Clerk; Firebase.)
- Who is "exec" for permissions: the current five director titles, or a configurable list?
- Payroll: what fields are actually needed (student ID only, or also employee ID / pay rate), and who sees them?
- Should alumni see the Network and Companies modules? (Recommended: yes, read and contribute.)
