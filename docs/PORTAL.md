# Member Portal

Goal: institutional memory that doesn't graduate. Everything members learn (who's in the org, how recruiting went, which alumni respond, what past projects looked like, what exec has to do each year) gets captured once and stays useful after people leave.

## Status

Two modes, one codebase (`src/portal/store.tsx`):

- **Live**, when the build has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the deploy job passes the repo's `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` Variables): real sign-in and the club's data in Supabase. `src/portal/live/` loads what the signed-in member may see (`load.ts`, a page of 1,000 rows at a time, so nothing is cut off at Supabase's per-request cap), maps rows to the portal's types (`rows.ts`) and turns every change into the matching inserts, updates and deletes (`sync.ts`). The database's access rules decide what's allowed; anything refused shows a banner and the page reloads from what's saved.
- **Demo**, without those settings: fictional sample data in the browser. The preview's sign-in page lists sample people to try it as, and any password works.

Who sees what: alumni land on the forum and don't get tasks or My recruiting. Exec can **View as** any member from Members and roles to check what they see; changes are off while viewing, and live it shows only what exec itself may see (never anyone's private notes). Current members see their tasks, applications and follow-ups, plus their project team's tasks; only exec sees member counts. Executive board access ends at graduation even though alumni keep their highest role.

| Module | Route | What it does |
| --- | --- | --- |
| Sign-in | `/login` | Invite-only. Exec adds a member's school and/or personal email; the member chooses "Set up your account", sets a password and confirms their details (school, class, start term, practice, role other than Executive Board). Someone invited by email alone fills in their own name too. If the confirmation email doesn't arrive, "Didn't get it?" sends it again (once a minute), from the check-your-inbox screen or after a sign-in that fails for want of confirming. Either email signs in afterwards |
| Home | `/portal` | This semester's tasks, your project team's next tasks, follow-ups due from your network, the most active forum threads, your applications and (for exec) items that need approval |
| Forum | `/portal/forum` | Bookface-style threads split into All threads, Current members and Alumni, across six channels (Recruiting, Interview prep, Referrals and intros, Opportunities, Offers, General), with replies, "helpful" votes, search and sorting. Everyone can read every space. A thread can be tagged with a firm and then also shows on that company's page. Exec can pin threads and remove any post |
| Directory | `/portal/directory` | Members and alumni with filters, showing personal emails. Class standing and alumni status are computed from graduation year; alumni show the highest role they held. Phone is visible only to the member and exec. Each current member's profile shows their project this semester; exec can put anyone on any team from here, and a team lead can add someone who isn't on a team yet to their own |
| Teams | `/portal/teams` | This semester's projects, each with its team and its tasks week by week (due that week's Friday on the semester calendar). Exec staffs any team and a project's lead (set in Projects) staffs theirs; one team per member per semester, so adding someone moves them off their other team. Leads and exec set tasks for the whole team or one person; each member checks off their own, and the lead sees "3 of 5 done". Other teams' tasks are folded away. Alumni don't see it |
| My Recruiting | `/portal/recruiting` | Four tabs. Applications: your pipeline by stage, with one prompt at a time for what to log next (rate effort and fit once you apply, log the interview once you reach a first round, grade the process once there's an outcome, add an offer to your experience). My network: your outreach spreadsheet (add a person with their LinkedIn and current role and they join the shared Network; follow-up reminders after 7 days with no reply; one-click updates for replies, chats and thank-yous that feed the contact grades). My interviews. Similar members: who applies like you and where they did well (see Applications below) |
| Companies | `/portal/companies` | Every firm members recruit with or worked at. Filter by type of company and by "has hired a" freshman, sophomore, junior or senior, to find where members that age have been hired (summers count the year just finished). Each firm shows member grades of its recruiting process, who worked there and in which year, which members reached a first round or further and how it ended (with the year of each offer), members' notes on the process, interview notes, a question bank, the average application effort and forum threads |
| Network | `/portal/network` | Shared contacts with an outreach grade built from the outreach log (response rate, reply speed, helpfulness), searchable by firm and filterable by type of company. Any member can move a contact to a new firm or title; earlier roles are kept |
| Projects | `/portal/projects` | Past engagements, what each team learned (tagged lessons that stack up by topic and are searchable across projects) and reusable templates |
| Profile | `/portal/profile` | Name, emails, phone, school, grad year, practice, headshot (stored in Supabase Storage in each member's own folder; only the address sits on their row), and Experience: internships and jobs with the year in school at the time, shared with every member. My recruiting offers to add an application here once it reaches Offer |
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

### Applications and interviews

- **Hidden until a first round.** Only the member (and exec) sees an application at first. Once it reaches a first round, every member sees the firm, position, cycle, how far it got and the outcome, by name or as "Anonymous member" (per application, or all at once). "How far it got" survives a rejection, so a rejection after a final still reads as a final.
- **Notes on the process show your name, with an anonymous option.** Notes on an application (and the notes half of an interview log) show on the firm's page right away, in their own list with the cycle. The name appears unless the member posts them anonymously. One exception follows from the rule above: until the application reaches a first round, its notes show as "Anonymous member", or the name would reveal an application that is still hidden.
- **Effort and fit.** Asked when you apply. Effort is averaged on the firm's page from the first rating. Fit is used only for Similar members.
- **Similar members.** 60% the share of firms you both applied to, 40% the overlap in kinds of firm you each rated a 4 or 5 for fit (Jaccard on both). It reads only applications other members shared with their name, so anonymous and pre-first-round ones never count. "Where they did well" lists firms your matches reached that you haven't applied to, weighted by similarity, a final counting double and an offer triple. In the database this runs in `similar_members()`, so other members' fit ratings never reach the browser.
- **Interview logs come in two halves.** Notes on the process (format, how it went, advice, difficulty, outcome) show the member's name unless they post them anonymously. The questions go into the firm's question bank as soon as they're logged, with the firm, a broad round (online assessment, first, final, other) and the text, but no year, position, timestamp or link to the notes. Questions are anonymous by default, and then no author is stored at all; a member can untick that to put their name on them.

### Design

The portal mirrors Bookface on a plain white page: panels with hairline borders and 3px corners, warm-gray fills (`#f6f6ef`) for hovers and table headers, small uppercase panel labels, Avenir (Nunito Sans where Avenir isn't installed) and one blue for actions and links. Bookface's own `#268bd2` is darkened to `#1f78bd` so white text on it passes WCAG AA. Tokens are in `src/app/globals.css`, type in `src/portal/portal.css`, components in `src/portal/ui.tsx`.

## Going live

1. Create a Supabase project under a club-owned account and run `supabase/schema.sql` in the SQL editor, then each file in `supabase/migrations/` in order (`003_teams_headshots.sql` is the only place the `headshots` storage bucket is created). A project that ran an earlier version runs the migrations it hasn't had yet; each is safe to run twice. If one is missing, the portal says which table it can't find.
2. Optional: run `supabase/starter-tasks.sql` for the club's usual recurring tasks. Exec can edit them in Recurring tasks.
3. Add the first Managing Director by hand, since only exec can add members and there's no exec yet (SQL editor):
   ```sql
   insert into members (first_name, last_name, school_email, personal_email, school, grad_year, role, exec_title, joined_term)
   values ('First', 'Last', 'name@cmc.edu', 'name@gmail.com', 'CMC', 2027, 'Executive Board', 'Managing Director', 'F2024');
   ```
4. Authentication settings:
   - **Sign In / Providers → Email:** keep **Confirm email** on, so nobody can claim a member's account by knowing their email. The `auth_users_roster_only` trigger already rejects emails that aren't on the roster.
   - **URL Configuration:** set **Site URL** to the portal's sign-in page (for example `https://graphitegroup-com.github.io/graphitegroup/login.html`) and add the site with `/**` (for example `https://graphitegroup-com.github.io/graphitegroup/**`) under **Redirect URLs**. Confirmation and password-reset links land there.
   - **Emails → SMTP Settings:** connect a sender. Supabase's built-in one only delivers to your Supabase team's own addresses, a few an hour for the whole project, so members wouldn't get their confirmation emails (the portal tells them when that cap is hit). A free option is the club Gmail with an app password (host `smtp.gmail.com`, port 465). Then raise **Rate Limits → emails sent per hour** to cover an invite wave (30 is plenty).
5. Add the `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` Variables and the deploy builds the live portal (see [`OPERATIONS.md`](OPERATIONS.md)).
6. The Managing Director opens the portal, chooses **Set up your account**, confirms the email and fills in their details. Then they add everyone else in **Members and roles**: **Invite by email** takes a pasted list of any length (each person fills in their own name, school and class when they set up), or **Add one member** with full details. Real member data goes in the database only, never into this repo.

Later:
- Add a daily scheduled job for alumni transitions and promotion proposals each term.
- Turn on Supabase Realtime for `forum_posts` and `forum_replies` so new threads appear without a refresh; for now the portal reloads when you come back to the tab.
- Members can't be deleted from the portal; remove them in Supabase's Table editor.

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
applications        member_id, company, position, cycle, stage, furthest, anonymous,
                    effort 1-5, fit 1-5, notes, notes_anonymous
interview_reports   company, member_id, year, round, format, overview, tips, difficulty, anonymous
interview_questions company, round (online assessment|first|final|other), question,
                    member_id (null when anonymous, the default); added only through log_interview
comments            subject_type (contact|project), subject_id, author_id, body
firms               name, type (consulting, banking, ... ), updated_by
jobs                member_id, company, role, kind (summer internship|full-time|part-time),
                    year, class_at_time (freshman|sophomore|junior|senior|alum)
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
                    deliverables (Drive links), lead (member id), search tsvector
project_members     project_id, member_id, added_by     -- the semester team; lead staffs it
project_tasks       project_id, title, body, week, assignee_id (null = whole team), created_by
project_task_done   task_id, member_id, done_at        -- each member checks off their own
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
