# Member Portal: plan

Goal: institutional memory that doesn't graduate. Everything members learn (who's in the org, how recruiting went, which alumni respond, what past projects looked like, what exec has to do each year) gets captured once and stays useful after people leave.

## Stack

- **Vercel + Next.js** (this repo). Portal routes live under `src/app/(portal)/` with their own layout and sidebar.
- **Supabase**: Postgres, Auth and file storage in one place, with a free tier that fits a club.
  - **Sign-in:** Google, limited to 5C email domains (`pomona.edu`, `mymail.pomona.edu`, `cmc.edu`, `hmc.edu`, `g.hmc.edu`, `scrippscollege.edu`, `pitzer.edu`, `students.pitzer.edu`). Alumni keep access through a personal-email magic link once their school address is closed.
  - **Row Level Security** keeps sensitive fields (phone, student ID, payroll) visible only to the member themself and to exec.
  - **`pg_cron`** runs the yearly rollovers (below).

## Modules (sidebar)

1. **Home**: action items for you, chosen by your role and the time of year.
2. **Directory**: everyone, filterable by school, year, practice and role.
3. **My Recruiting**: your applications and coffee chats.
4. **Companies**: shared interview intel by firm and year.
5. **Network**: alumni and contacts, with response rates.
6. **Projects**: a searchable archive of every engagement, plus templates.
7. **Archive**: a link to the historical slide deck (the URL is a setting).

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
comments            subject_type (company|report|contact|project), subject_id, author_id, body

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

## Build order

1. Auth + onboarding profile + Directory, with automation for status and roles. (This replaces the Google Form roster.)
2. My Recruiting + Companies + interview reports.
3. Network + outreach tracking + response stats.
4. Home tasks + exec task templates.
5. Projects archive + Drive ingestion + templates.

## Decisions needed

- Supabase OK as the backend? (Alternatives: Neon + Clerk; Firebase.)
- Who is "exec" for permissions: the current five director titles, or a configurable list?
- Payroll: what fields are actually needed (student ID only, or also employee ID / pay rate), and who sees them?
- Should alumni see the Network and Companies modules? (Recommended: yes, read and contribute.)
