-- Graphite Group member portal: production schema (Supabase / Postgres).
-- Mirrors src/portal/types.ts and src/lib/site-content.ts. Run in the Supabase
-- SQL editor. Sign-in is email + password, invite-only: exec adds a member's
-- school and/or personal email, and only those emails can create an account
-- (see "sign-in" below and docs/PORTAL.md).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type school as enum ('Pomona', 'CMC', 'Harvey Mudd', 'Scripps', 'Pitzer');
create type practice as enum ('Strategy', 'Digital');
create type member_role as enum ('Associate Consultant', 'Consultant', 'Team Lead', 'Executive Board', 'Advisor');
create type exec_title as enum (
  'Managing Director',
  'Director of Strategy & Client Relations',
  'Director of Digital',
  'Director of Recruiting & Engagement',
  'Director of Professional Development'
);
create type app_stage as enum (
  'Researching', 'Applied', 'Online Assessment', 'First Round', 'Superday / Final', 'Offer', 'Rejected', 'Withdrew'
);

-- ---------------------------------------------------------------- members
create table members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  -- Either email signs in. Alumni keep the personal one after school email closes.
  personal_email text,
  school_email text,
  school school not null,
  grad_year int not null check (grad_year between 2015 and 2100),
  practice practice not null default 'Strategy',
  role member_role not null default 'Associate Consultant',
  exec_title exec_title,
  joined_term text not null,               -- 'F2026' / 'S2027'
  linkedin text,
  photo_url text,                          -- Supabase Storage public URL
  show_on_website boolean not null default true,
  setup_completed_at timestamptz,          -- set when they finish account setup
  created_at timestamptz not null default now(),
  constraint exec_title_only_for_exec check (exec_title is null or role = 'Executive Board'),
  constraint has_an_email check (coalesce(btrim(personal_email), '') <> '' or coalesce(btrim(school_email), '') <> '')
);
create unique index members_school_email_uq on members (lower(btrim(school_email))) where school_email is not null;
create unique index members_personal_email_uq on members (lower(btrim(personal_email))) where personal_email is not null;

-- Access helpers for the views and policies below. A signed-in account belongs
-- to the member whose school or personal email it uses.
create or replace function member_for_email(e text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from members
  where lower(btrim(school_email)) = lower(btrim(e)) or lower(btrim(personal_email)) = lower(btrim(e))
  limit 1
$$;

create or replace function current_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select member_for_email(auth.jwt() ->> 'email')
$$;

-- Executive board access ends at graduation; alumni keep the role for the record only.
create or replace function is_exec() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from members
    where id = current_member_id() and role = 'Executive Board' and now() < make_date(grad_year, 6, 1)
  )
$$;

-- ---------------------------------------------------------------- sign-in
-- Only emails on the roster can create an account or switch to a new email.
-- Supabase shows the sign-up as failed; the app explains why.
create or replace function auth_roster_only() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is null
     or (member_for_email(new.email) is null and not exists (select 1 from invites where email = lower(btrim(new.email)))) then
    raise exception 'This email is not on the Graphite roster. Ask the executive board to add it.';
  end if;
  return new;
end $$;
create trigger auth_users_roster_only
  before insert or update of email on auth.users
  for each row execute function auth_roster_only();

-- Members can't promote themselves. During account setup they may set their
-- role once (anything but Executive Board); after that only exec changes
-- role, exec title and website visibility.
create or replace function guard_member_self_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if is_exec() then return new; end if;
  if new.exec_title is distinct from old.exec_title or new.show_on_website is distinct from old.show_on_website then
    raise exception 'Only the executive board can change titles or website visibility';
  end if;
  if new.role is distinct from old.role and (old.setup_completed_at is not null or new.role = 'Executive Board') then
    raise exception 'Only the executive board can change your role';
  end if;
  if old.setup_completed_at is not null and new.setup_completed_at is distinct from old.setup_completed_at then
    raise exception 'Account setup is already complete';
  end if;
  return new;
end $$;
create trigger members_guard_self_update before update on members for each row execute function guard_member_self_update();

-- Private fields live in their own table so row-level security can hide them.
create table member_private (
  member_id uuid primary key references members (id) on delete cascade,
  phone text
);

-- Emails exec has approved to join. The person fills in their own name,
-- school and class during setup, and join_from_invite turns the invite into
-- a member then, so the roster never holds placeholder people.
create table invites (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  role member_role not null default 'Associate Consultant' check (role <> 'Executive Board'),
  added_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table invites enable row level security;
create policy "exec manage invites" on invites for all using (is_exec()) with check (is_exec());
-- An invited person, signed in but not a member yet, sees their own invite.
create policy "read own invite" on invites for select using (email = lower(btrim(auth.jwt() ->> 'email')));


-- Setup for an invited person: creates their member row from the details
-- they enter and removes the invite. They must keep the email they signed
-- in with, and can't make themselves exec.
create or replace function join_from_invite(
  p_first_name text,
  p_last_name text,
  p_school_email text,
  p_personal_email text,
  p_school school,
  p_grad_year int,
  p_joined_term text,
  p_practice practice,
  p_role member_role,
  p_phone text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  e text := lower(btrim(auth.jwt() ->> 'email'));
  s text := nullif(lower(btrim(p_school_email)), '');
  p text := nullif(lower(btrim(p_personal_email)), '');
  new_id uuid;
begin
  if coalesce(e, '') = '' then
    raise exception 'Sign in first';
  end if;
  if member_for_email(e) is not null then
    raise exception 'This account is already on the roster';
  end if;
  if not exists (select 1 from invites where email = e) then
    raise exception 'This email is not on the Graphite roster. Ask the executive board to add it.';
  end if;
  if e is distinct from s and e is distinct from p then
    raise exception 'Keep the email you signed up with as your school or personal email';
  end if;
  if coalesce(btrim(p_first_name), '') = '' or coalesce(btrim(p_last_name), '') = '' then
    raise exception 'Enter your first and last name';
  end if;
  if p_role = 'Executive Board' then
    raise exception 'Only the executive board can assign Executive Board roles';
  end if;
  insert into members (first_name, last_name, school_email, personal_email, school, grad_year, joined_term, practice, role, setup_completed_at)
  values (btrim(p_first_name), btrim(p_last_name), s, p, p_school, p_grad_year, p_joined_term, p_practice, p_role, now())
  returning id into new_id;
  if nullif(btrim(p_phone), '') is not null then
    insert into member_private (member_id, phone) values (new_id, btrim(p_phone));
  end if;
  delete from invites where email in (e, s, p);
  return new_id;
end $$;

revoke execute on function join_from_invite from public, anon;
grant execute on function join_from_invite to authenticated;

-- Alumni status and class standing are derived, never stored.
create view member_status as
select
  m.*,
  now() >= make_date(m.grad_year, 6, 1) as is_alum,
  case
    when now() >= make_date(m.grad_year, 6, 1) then 'Alumni'
    else (array['Senior', 'Junior', 'Sophomore', 'First-year'])[
      m.grad_year - (extract(year from now())::int + case when extract(month from now()) >= 7 then 1 else 0 end) + 1
    ]
  end as standing
from members m;

create table role_changes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  from_role member_role not null,
  to_role member_role not null,
  term text not null,
  approved_by uuid references members (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- tasks
-- Due dates are relative to the semester calendar exec sets each year
-- (settings 'calendar'), and land on the Friday of the chosen week.
create table task_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  audience_kind text not null check (audience_kind in ('all', 'role', 'title')),
  audience_role member_role,
  audience_title exec_title,
  semester text not null check (semester in ('Fall', 'Spring', 'Every semester')),
  -- before: n weeks before classes start; week: week n; end: n weeks before the last week
  when_anchor text not null check (when_anchor in ('before', 'week', 'end')),
  when_weeks int not null check (when_weeks between 0 and 30),
  created_by uuid references members (id),
  created_at timestamptz not null default now()
);

create table task_completions (
  template_id uuid references task_templates (id) on delete cascade,
  term text not null check (term ~ '^[FS][0-9]{4}$'),  -- 'F2026', 'S2027'
  member_id uuid references members (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (template_id, term, member_id)
);

-- ---------------------------------------------------------------- recruiting
-- An application is private to its member until it reaches a first round.
-- From then on members see it through applications_visible (below), by name
-- or as "Anonymous member". Notes on the process show to every member right
-- away through application_notes_visible, named unless notes_anonymous.
-- Effort and fit never show one by one.
create table applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  company text not null,
  position text not null,
  cycle text not null,
  stage app_stage not null default 'Applied',
  -- How far it got, so a rejection after a final still shows the final. Kept by
  -- applications_track_furthest (below); never Rejected or Withdrew.
  furthest app_stage not null default 'Applied' check (furthest not in ('Rejected', 'Withdrew')),
  anonymous boolean not null default false,
  -- Asked when you apply: how much work it took, and how well it fits your interests.
  effort int check (effort between 1 and 5),
  fit int check (fit between 1 and 5),
  notes text not null default '',
  notes_anonymous boolean not null default false,
  -- Only the member reads this table, so private notes can live here.
  private_notes text not null default '',
  updated_at timestamptz not null default now()
);
create index applications_company_idx on applications (lower(btrim(company)));
create index applications_member_idx on applications (member_id);

-- Moving between Researching and Offer sets how far it got; nobody moves
-- backwards in a process, so a lower stage is a correction. Rejected and
-- Withdrew keep the stage it ended at.
create or replace function applications_track_furthest() returns trigger
language plpgsql as $$
begin
  if new.stage not in ('Rejected', 'Withdrew') then
    new.furthest := new.stage;
  elsif tg_op = 'UPDATE' then
    new.furthest := old.furthest;
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger applications_track_furthest before insert or update of stage, furthest on applications
  for each row execute function applications_track_furthest();

-- The overview half of an interview log: named or anonymous. The questions
-- half goes to the question bank (below) with nothing linking it here.
create table interview_reports (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  member_id uuid references members (id) on delete set null,
  year int not null,
  position text not null,
  round text not null,
  format text,
  overview text,
  tips text,
  difficulty int check (difficulty between 1 and 5),
  outcome text check (outcome in ('Advanced', 'Offer', 'Rejected', 'Unknown')),
  anonymous boolean not null default false,
  created_at timestamptz not null default now()
);
create index interview_reports_company_idx on interview_reports (lower(btrim(company)));

-- Question bank. A question keeps the firm, a broad round and its text: no
-- timestamps, year, position or link to a report. Anonymous by default, and
-- then member_id is null, so no author is stored at all.
create type question_round as enum ('Online assessment', 'First round', 'Final round', 'Other');
create table interview_questions (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  round question_round not null,
  question text not null check (length(btrim(question)) between 1 and 1000),
  -- Set only when the member chose to show their name.
  member_id uuid references members (id) on delete set null
);
create index interview_questions_company_idx on interview_questions (lower(btrim(company)));

create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  title text,
  email text,
  linkedin text,
  is_alum boolean not null default false,
  alum_class int,
  -- Went to one of the Claremont Colleges.
  is_school_alum boolean not null default false,
  alum_school school,
  school_class int check (school_class between 1900 and 2100),
  preferences text,
  added_by uuid references members (id) on delete set null,
  -- Earlier roles, newest first: [{company, title, until}]. Any member can move a contact.
  history jsonb not null default '[]',
  updated_by uuid references members (id) on delete set null,
  updated_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index contacts_linkedin_uq on contacts (lower(regexp_replace(linkedin, '^https?://(www\.)?|/+$', '', 'g'))) where coalesce(linkedin, '') <> '';

create table outreach (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  date date not null default current_date,
  channel text not null check (channel in ('Email', 'LinkedIn', 'Referral', 'In person')),
  responded boolean not null default false,
  response_days int,
  chatted boolean not null default false,
  helpfulness int check (helpfulness between 1 and 5),
  referred boolean not null default false,
  notes text not null default '',
  anonymous boolean not null default false,  -- hidden from other members; self and exec still see it
  follow_ups date[] not null default '{}',   -- follow-up messages after the first
  responded_on date,                         -- response_days is counted from date to this
  thanked boolean not null default false     -- sent a thank-you after the chat
);

-- Private notes on your own outreach. Exec can read outreach rows, so these
-- live in their own table that only the author can read.
create table outreach_private_notes (
  outreach_id uuid primary key references outreach (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  notes text not null default ''
);

create view contact_stats as
select
  c.id as contact_id,
  count(o.*) as outreach,
  avg(o.responded::int)::numeric(4, 2) as response_rate,
  percentile_cont(0.5) within group (order by o.response_days) as median_response_days,
  avg(o.helpfulness)::numeric(3, 1) as avg_helpfulness,
  count(*) filter (where o.referred) as referrals
from contacts c
left join outreach o on o.contact_id = c.id
where current_member_id() is not null       -- aggregates are members-only too
group by c.id;

-- Notes on contacts and projects. Company discussion lives in the forum.
create table comments (
  id uuid primary key default gen_random_uuid(),
  subject text not null,                    -- 'contact:<uuid>', 'project:<uuid>'
  member_id uuid references members (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_subject_idx on comments (subject);

-- ---------------------------------------------------------------- grades
-- Members grade each firm's recruiting process, once per firm and cycle. The
-- letter is computed in the app (src/portal/logic.ts, firmGradeSummary) and
-- only shown once 3 different members have graded a firm.
create type stage_reached as enum ('Applied', 'Online Assessment', 'First Round', 'Superday / Final');
create type grade_outcome as enum ('Offer', 'Rejected', 'No response', 'Withdrew', 'Still in process');

create table firm_grades (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  member_id uuid references members (id) on delete set null,
  cycle text not null,                      -- 'Summer 2027 Internship'
  stage_reached stage_reached not null,
  outcome grade_outcome not null,
  communication int not null check (communication between 1 and 5),
  speed int not null check (speed between 1 and 5),
  fairness int check (fairness between 1 and 5),
  interviewers int check (interviewers between 1 and 5),
  recommend boolean not null,
  review text not null default '',
  anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  -- Someone who was never assessed can't grade fairness; never interviewed, can't grade interviewers.
  constraint dims_match_stage check (
    (stage_reached = 'Applied') = (fairness is null)
    and (stage_reached in ('Applied', 'Online Assessment')) = (interviewers is null)
  )
);
create unique index firm_grades_one_per_cycle on firm_grades (member_id, lower(btrim(company)), lower(btrim(cycle)));
create index firm_grades_company_idx on firm_grades (lower(btrim(company)));

-- ---------------------------------------------------------------- firms and experience
-- The type of each firm, set or corrected by any member, for filtering firms and people.
create type company_type as enum (
  'Consulting', 'Investment banking', 'Asset management', 'Private equity and venture capital',
  'Quant and trading', 'Technology', 'Startups', 'Corporate', 'Nonprofit and government', 'Other'
);
create table firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type company_type not null,
  updated_by uuid references members (id) on delete set null,
  updated_at timestamptz not null default now()
);
create unique index firms_name_uq on firms (lower(btrim(name)));

-- Where members have worked, shared with every member so younger ones can see
-- where Graphite has been hired and in which year of school. Applications stay
-- private; this is what a member chooses to share.
create type job_kind as enum ('Summer internship', 'Full-time', 'Part-time');
-- For a summer internship, the year just finished (sophomore summer = Sophomore).
create type class_level as enum ('Freshman', 'Sophomore', 'Junior', 'Senior', 'Alum');
create table jobs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  company text not null,
  role text not null check (length(btrim(role)) > 0),
  kind job_kind not null,
  year int not null check (year between 1990 and 2100),  -- the summer, or the start year
  class_at_time class_level not null,
  created_at timestamptz not null default now()
);
create index jobs_company_idx on jobs (lower(btrim(company)));
create index jobs_level_idx on jobs (class_at_time);

-- ---------------------------------------------------------------- forum
create type forum_channel as enum ('recruiting', 'interview-prep', 'referrals', 'opportunities', 'offers', 'general');
-- Who a thread is for. Every member and alum can read every space.
create type forum_space as enum ('everyone', 'members', 'alumni');

create table forum_posts (
  id uuid primary key default gen_random_uuid(),
  space forum_space not null default 'everyone',
  channel forum_channel not null default 'general',
  member_id uuid references members (id) on delete set null,
  title text not null check (length(btrim(title)) between 1 and 140),
  body text not null check (length(btrim(body)) > 0),
  company text,                             -- the thread also shows on this firm's page
  pinned boolean not null default false,    -- exec only, enforced by forum_guard_pin
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index forum_posts_company_idx on forum_posts (lower(btrim(company))) where company is not null;
create index forum_posts_created_idx on forum_posts (created_at desc);

create table forum_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references forum_posts (id) on delete cascade,
  member_id uuid references members (id) on delete set null,
  body text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);
create index forum_replies_post_idx on forum_replies (post_id, created_at);

-- One "helpful" vote per member per post or reply; exactly one target is set.
create table forum_votes (
  member_id uuid not null references members (id) on delete cascade,
  post_id uuid references forum_posts (id) on delete cascade,
  reply_id uuid references forum_replies (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint one_target check (num_nonnulls(post_id, reply_id) = 1)
);
create unique index forum_votes_post_uq on forum_votes (member_id, post_id) where post_id is not null;
create unique index forum_votes_reply_uq on forum_votes (member_id, reply_id) where reply_id is not null;

-- ---------------------------------------------------------------- projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  client text not null,
  year int not null,
  term text not null check (term in ('Fall', 'Spring')),
  practice practice not null,
  sector text,
  categories text[] not null default '{}',
  summary text not null default '',
  deliverables jsonb not null default '[]',  -- [{label, url}]
  lead uuid references members (id) on delete set null,
  drive_folder_id text,                      -- source folder for automated summaries
  search tsvector generated always as (
    to_tsvector('english', coalesce(client, '') || ' ' || coalesce(sector, '') || ' ' || coalesce(summary, ''))
  ) stored
);
create index projects_search_idx on projects using gin (search);

-- What project teams learned, tagged by topic so later teams can search across projects.
create table lessons (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  member_id uuid references members (id) on delete set null,
  body text not null check (length(btrim(body)) > 0),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  -- Text search on the lesson; topics have their own array index (array_to_string isn't immutable).
  search tsvector generated always as (to_tsvector('english', body)) stored
);
create index lessons_search_idx on lessons using gin (search);
create index lessons_tags_idx on lessons using gin (tags);

create table templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text,
  source_project_id uuid references projects (id) on delete set null,
  url text not null
);

-- ---------------------------------------------------------------- settings + public site
create table settings (
  key text primary key,
  value jsonb not null
);
-- settings: 'calendar' -> {year, fall: {start, weeks}, spring: {start, weeks}}, set by exec each year

-- One row: the JSON shape of SiteContent (src/lib/site-content.ts).
create table site_content (
  id int primary key default 1 check (id = 1),
  content jsonb not null,
  updated_by uuid references members (id),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- access rules
alter table members enable row level security;
alter table member_private enable row level security;
alter table role_changes enable row level security;
alter table task_templates enable row level security;
alter table task_completions enable row level security;
alter table applications enable row level security;
alter table interview_reports enable row level security;
alter table interview_questions enable row level security;
alter table contacts enable row level security;
alter table outreach enable row level security;
alter table outreach_private_notes enable row level security;
alter table comments enable row level security;
alter table firm_grades enable row level security;
alter table firms enable row level security;
alter table jobs enable row level security;
alter table forum_posts enable row level security;
alter table forum_replies enable row level security;
alter table forum_votes enable row level security;
alter table projects enable row level security;
alter table templates enable row level security;
alter table lessons enable row level security;
alter table settings enable row level security;
alter table site_content enable row level security;

-- Any signed-in member can read the shared knowledge base.
create policy "members read" on members for select using (current_member_id() is not null);
create policy "self or exec update" on members for update using (id = current_member_id() or is_exec());
create policy "exec insert members" on members for insert with check (is_exec());

-- Phone and student ID: only the member and exec.
create policy "private self or exec" on member_private for all
  using (member_id = current_member_id() or is_exec())
  with check (member_id = current_member_id() or is_exec());

create policy "exec manage roles" on role_changes for all using (is_exec()) with check (is_exec());
create policy "read role history" on role_changes for select using (current_member_id() is not null);

create policy "read tasks" on task_templates for select using (current_member_id() is not null);
create policy "exec manage tasks" on task_templates for all using (is_exec()) with check (is_exec());
create policy "own completions" on task_completions for all
  using (member_id = current_member_id() or is_exec())
  with check (member_id = current_member_id());

-- Each member reads and writes only their own rows here. Everyone, exec
-- included, sees other members' through applications_visible and
-- application_notes_visible (below).
create policy "own applications" on applications for all
  using (member_id = current_member_id())
  with check (member_id = current_member_id());

-- Reports can be anonymous, so members read them through interview_reports_visible
-- (below). They're written through log_interview, which also files the questions.
create policy "own reports or exec" on interview_reports for select using (member_id = current_member_id() or is_exec());
create policy "edit own reports" on interview_reports for update using (member_id = current_member_id()) with check (member_id = current_member_id());
create policy "delete own reports or exec" on interview_reports for delete using (member_id = current_member_id() or is_exec());

-- The bank: every member reads, exec removes. Questions arrive only through
-- log_interview, so an anonymous one never records who added it.
create policy "read question bank" on interview_questions for select using (current_member_id() is not null);
create policy "exec removes questions" on interview_questions for delete using (is_exec());
create policy "read contacts" on contacts for select using (current_member_id() is not null);
create policy "add contacts" on contacts for insert with check (current_member_id() is not null);
create policy "members update contacts" on contacts for update using (current_member_id() is not null) with check (current_member_id() is not null);
-- Outreach rows can be anonymous, so members read them through outreach_visible (below).
create policy "own outreach or exec" on outreach for select using (member_id = current_member_id() or is_exec());
create policy "log own outreach" on outreach for insert with check (member_id = current_member_id());
create policy "update own outreach" on outreach for update using (member_id = current_member_id()) with check (member_id = current_member_id());
create policy "delete own outreach" on outreach for delete using (member_id = current_member_id());
create policy "own private notes" on outreach_private_notes for all
  using (member_id = current_member_id())
  with check (
    member_id = current_member_id()
    and exists (select 1 from outreach o where o.id = outreach_id and o.member_id = current_member_id())
  );
create policy "read comments" on comments for select using (current_member_id() is not null);
create policy "post own comments" on comments for insert with check (member_id = current_member_id());
create policy "read projects" on projects for select using (current_member_id() is not null);
create policy "exec manage projects" on projects for all using (is_exec()) with check (is_exec());
create policy "read templates" on templates for select using (current_member_id() is not null);
create policy "exec manage templates" on templates for all using (is_exec()) with check (is_exec());
create policy "read lessons" on lessons for select using (current_member_id() is not null);
create policy "write own lessons" on lessons for insert with check (member_id = current_member_id());
create policy "edit own lessons or exec" on lessons for update using (member_id = current_member_id() or is_exec()) with check (member_id = current_member_id() or is_exec());
create policy "delete own lessons or exec" on lessons for delete using (member_id = current_member_id() or is_exec());
create policy "read settings" on settings for select using (current_member_id() is not null);
create policy "exec manage settings" on settings for all using (is_exec()) with check (is_exec());

-- Grades: members write their own; everyone reads through firm_grades_visible.
create policy "own grades or exec" on firm_grades for select using (member_id = current_member_id() or is_exec());
create policy "write own grades" on firm_grades for insert with check (member_id = current_member_id());
create policy "edit own grades" on firm_grades for update using (member_id = current_member_id()) with check (member_id = current_member_id());
create policy "delete own grades or exec" on firm_grades for delete using (member_id = current_member_id() or is_exec());

-- Firm types: any member reads, sets or corrects them.
create policy "read firms" on firms for select using (current_member_id() is not null);
create policy "members set firm types" on firms for insert with check (current_member_id() is not null and updated_by = current_member_id());
create policy "members correct firm types" on firms for update using (current_member_id() is not null) with check (updated_by = current_member_id());

-- Experience: every member reads; members manage their own; exec can remove any.
create policy "read jobs" on jobs for select using (current_member_id() is not null);
create policy "add own jobs" on jobs for insert with check (member_id = current_member_id());
create policy "edit own jobs" on jobs for update using (member_id = current_member_id()) with check (member_id = current_member_id());
create policy "delete own jobs or exec" on jobs for delete using (member_id = current_member_id() or is_exec());

-- Per-firm totals over every application, shared or not.
create view company_application_stats with (security_invoker = false) as
select
  lower(btrim(company)) as company_key,
  min(company) as company,
  count(distinct member_id) as applicants,
  count(distinct member_id) filter (where stage = 'Offer') as offers,
  count(distinct member_id) filter (where effort is not null) as effort_ratings,
  round(avg(effort), 1) as avg_effort
from applications
where current_member_id() is not null
group by lower(btrim(company));

-- Applications other members can see: from a first round on, with the member
-- blanked out if they chose anonymous. Exec sees every application this way.
-- Notes are left out because this view can carry a name; they show in
-- application_notes_visible instead. Effort and fit are left out too.
create view applications_visible with (security_invoker = false) as
select
  a.id, a.company, a.position, a.cycle, a.stage, a.furthest, a.anonymous, a.updated_at,
  case when not a.anonymous or a.member_id = current_member_id() or is_exec() then a.member_id end as member_id
from applications a
where current_member_id() is not null
  and (a.furthest in ('First Round', 'Superday / Final', 'Offer') or a.member_id = current_member_id() or is_exec());

-- Every member's notes on the process, as soon as they're written. The name
-- shows once the application itself is shared (a first round) unless the
-- notes were posted anonymously; the author and exec always see it. No
-- application id or date, so an anonymous note can't be joined back.
create view application_notes_visible with (security_invoker = false) as
select
  a.company, a.cycle, a.notes,
  (a.notes_anonymous or a.furthest not in ('First Round', 'Superday / Final', 'Offer')) as anonymous,
  case
    when (not a.notes_anonymous and a.furthest in ('First Round', 'Superday / Final', 'Offer')) or a.member_id = current_member_id() or is_exec()
    then a.member_id
  end as member_id
from applications a
where current_member_id() is not null and btrim(a.notes) <> '';

-- Log an interview: the notes under the member (named or anonymous), and the
-- questions straight into the bank, with no author at all unless the member
-- chose to show their name on them.
create or replace function log_interview(
  p_company text,
  p_year int,
  p_position text,
  p_round text,
  p_format text,
  p_overview text,
  p_tips text,
  p_difficulty int,
  p_outcome text,
  p_anonymous boolean,
  p_question_round question_round,
  p_questions text[],
  p_questions_anonymous boolean default true
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  me uuid := current_member_id();
  report_id uuid;
begin
  if me is null then
    raise exception 'Only members can log interviews';
  end if;
  insert into interview_reports (company, member_id, year, position, round, format, overview, tips, difficulty, outcome, anonymous)
  values (btrim(p_company), me, p_year, p_position, p_round, p_format, p_overview, p_tips, p_difficulty, p_outcome, coalesce(p_anonymous, false))
  returning id into report_id;

  insert into interview_questions (company, round, question, member_id)
  select btrim(p_company), coalesce(p_question_round, 'Other'), btrim(q), case when coalesce(p_questions_anonymous, true) then null else me end
  from unnest(coalesce(p_questions, '{}')) as q
  where btrim(q) <> '';
  return report_id;
end $$;

revoke execute on function log_interview from public, anon;
grant execute on function log_interview to authenticated;

-- Members whose shared, named applications look most like yours: the same
-- firms (60%) and the same kinds of firm they rate a 4 or 5 for fit (40%;
-- every kind they applied to if they haven't rated fit). Runs here so other
-- members' fit ratings never leave the database. Mirrors similarMembers in
-- src/portal/logic.ts.
create or replace function similar_members(max_results int default 5)
returns table (member_id uuid, score numeric, shared_firms text[], shared_types company_type[])
language sql stable security definer set search_path = public as $$
  with me as (select current_member_id() as id),
  apps as (
    select a.member_id, lower(btrim(a.company)) as firm, min(btrim(a.company)) as company, max(a.fit) as fit, max(f.type) as type,
      bool_or(a.member_id = (select id from me)) as mine
    from applications a
    left join firms f on lower(btrim(f.name)) = lower(btrim(a.company))
    where a.member_id = (select id from me)
       or (a.furthest in ('First Round', 'Superday / Final', 'Offer') and not a.anonymous)
    group by a.member_id, lower(btrim(a.company))
  ),
  interests as (
    select member_id, array_agg(distinct type) filter (where type is not null) as types
    from apps x
    where fit >= 4 or not exists (select 1 from apps y where y.member_id = x.member_id and y.fit is not null)
    group by member_id
  ),
  firms_of as (select member_id, array_agg(firm) as firms from apps group by member_id),
  scored as (
    select o.member_id,
      (select coalesce(array_agg(distinct c.company), '{}') from apps c where c.member_id = o.member_id and c.firm = any (mf.firms)) as shared_firms,
      (select coalesce(array_agg(t), '{}') from unnest(oi.types) t where t = any (mi.types)) as shared_types,
      cardinality(array(select unnest(o.firms) intersect select unnest(mf.firms)))::numeric
        / nullif(cardinality(array(select unnest(o.firms) union select unnest(mf.firms))), 0) as firm_overlap,
      cardinality(array(select unnest(oi.types) intersect select unnest(mi.types)))::numeric
        / nullif(cardinality(array(select unnest(oi.types) union select unnest(mi.types))), 0) as type_overlap
    from firms_of o
    cross join (select firms from firms_of where member_id = (select id from me)) mf
    left join interests oi on oi.member_id = o.member_id
    left join (select types from interests where member_id = (select id from me)) mi on true
    where o.member_id <> (select id from me)
  )
  select member_id, round(0.6 * coalesce(firm_overlap, 0) + 0.4 * coalesce(type_overlap, 0), 3) as score, shared_firms, shared_types
  from scored
  where (select id from me) is not null and 0.6 * coalesce(firm_overlap, 0) + 0.4 * coalesce(type_overlap, 0) > 0
  order by score desc
  limit max_results
$$;

revoke execute on function similar_members from public, anon;
grant execute on function similar_members to authenticated;

-- Forum: every member reads; authors edit and delete their own; exec moderates.
create policy "read posts" on forum_posts for select using (current_member_id() is not null);
create policy "write own posts" on forum_posts for insert with check (member_id = current_member_id() and (not pinned or is_exec()));
create policy "edit own posts or exec" on forum_posts for update
  using (member_id = current_member_id() or is_exec())
  with check (member_id = current_member_id() or is_exec());
create policy "delete own posts or exec" on forum_posts for delete using (member_id = current_member_id() or is_exec());

create policy "read replies" on forum_replies for select using (current_member_id() is not null);
create policy "write own replies" on forum_replies for insert with check (member_id = current_member_id());
create policy "delete own replies or exec" on forum_replies for delete using (member_id = current_member_id() or is_exec());

create policy "read votes" on forum_votes for select using (current_member_id() is not null);
create policy "vote as yourself, not for yourself" on forum_votes for insert with check (
  member_id = current_member_id()
  and not exists (select 1 from forum_posts p where p.id = post_id and p.member_id = current_member_id())
  and not exists (select 1 from forum_replies r where r.id = reply_id and r.member_id = current_member_id())
);
create policy "remove own votes" on forum_votes for delete using (member_id = current_member_id());

-- RLS can't tell an author's edit from a pin, so a trigger keeps pinning to exec.
create or replace function forum_guard_pin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.pinned is distinct from old.pinned and not is_exec() then
    raise exception 'Only the executive board can pin threads';
  end if;
  return new;
end $$;
create trigger forum_posts_guard_pin before update on forum_posts for each row execute function forum_guard_pin();

-- Anonymous rows: RLS works per row, not per column, so members read these
-- views instead of the tables. They run with the owner's rights and blank out
-- the author of anonymous rows unless the reader wrote it or is exec. Supabase's
-- linter flags owner-rights views; these two are deliberate.
create view firm_grades_visible with (security_invoker = false) as
select
  g.id, g.company, g.cycle, g.stage_reached, g.outcome,
  g.communication, g.speed, g.fairness, g.interviewers,
  g.recommend, g.review, g.anonymous, g.created_at,
  case when not g.anonymous or g.member_id = current_member_id() or is_exec() then g.member_id end as member_id,
  -- Computed here because members can't read each other's applications.
  exists (select 1 from applications a where a.member_id = g.member_id and lower(btrim(a.company)) = lower(btrim(g.company)))
    or exists (select 1 from interview_reports r where r.member_id = g.member_id and lower(btrim(r.company)) = lower(btrim(g.company)))
    as tracked
from firm_grades g
where current_member_id() is not null;

create view outreach_visible with (security_invoker = false) as
select
  o.id, o.contact_id, o.date, o.channel, o.responded, o.response_days, o.chatted,
  o.helpfulness, o.referred, o.notes, o.anonymous, o.follow_ups, o.responded_on, o.thanked,
  case when not o.anonymous or o.member_id = current_member_id() or is_exec() then o.member_id end as member_id
from outreach o
where current_member_id() is not null;

create view interview_reports_visible with (security_invoker = false) as
select
  r.id, r.company, r.year, r.position, r.round, r.format, r.overview, r.tips, r.difficulty, r.outcome, r.anonymous, r.created_at,
  case when not r.anonymous or r.member_id = current_member_id() or is_exec() then r.member_id end as member_id
from interview_reports r
where current_member_id() is not null;

-- The public website reads site_content anonymously; only exec can change it.
create policy "public read site" on site_content for select using (true);
create policy "exec edit site" on site_content for all using (is_exec()) with check (is_exec());
