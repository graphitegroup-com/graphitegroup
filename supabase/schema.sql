-- Graphite Group member portal: production schema (Supabase / Postgres).
-- Mirrors src/portal/types.ts and src/lib/site-content.ts. Run in the Supabase
-- SQL editor, then enable Google sign-in restricted to 5C domains.

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
  auth_user_id uuid unique references auth.users (id) on delete set null,
  first_name text not null,
  last_name text not null,
  personal_email text,
  school_email text not null unique,
  school school not null,
  grad_year int not null check (grad_year between 2015 and 2100),
  practice practice not null default 'Strategy',
  role member_role not null default 'Associate Consultant',
  exec_title exec_title,
  joined_term text not null,               -- 'F2026' / 'S2027'
  linkedin text,
  photo_url text,                          -- Supabase Storage public URL
  show_on_website boolean not null default true,
  created_at timestamptz not null default now(),
  constraint exec_title_only_for_exec check (exec_title is null or role = 'Executive Board')
);

-- Access helpers for the views and policies below.
create or replace function current_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from members where auth_user_id = auth.uid()
$$;

create or replace function is_exec() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where auth_user_id = auth.uid() and role = 'Executive Board')
$$;

-- Private fields live in their own table so row-level security can hide them.
create table member_private (
  member_id uuid primary key references members (id) on delete cascade,
  phone text,
  student_id text
);

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
create table task_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  audience_kind text not null check (audience_kind in ('all', 'role', 'title')),
  audience_role member_role,
  audience_title exec_title,
  due_month int not null check (due_month between 1 and 12),
  due_day int not null check (due_day between 1 and 31),
  created_by uuid references members (id),
  created_at timestamptz not null default now()
);

create table task_completions (
  template_id uuid references task_templates (id) on delete cascade,
  academic_year int not null,               -- starting year, e.g. 2026 for 2026-27
  member_id uuid references members (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (template_id, academic_year, member_id)
);

-- ---------------------------------------------------------------- recruiting
create table applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  company text not null,
  position text not null,
  cycle text not null,
  stage app_stage not null default 'Researching',
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create table interview_reports (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  member_id uuid references members (id) on delete set null,
  year int not null,
  position text not null,
  round text not null,
  format text,
  questions text,
  tips text,
  difficulty int check (difficulty between 1 and 5),
  outcome text check (outcome in ('Advanced', 'Offer', 'Rejected', 'Unknown')),
  created_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  title text,
  email text,
  linkedin text,
  is_alum boolean not null default false,
  alum_class int,
  preferences text,
  added_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

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
  anonymous boolean not null default false   -- hidden from other members; self and exec still see it
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

-- ---------------------------------------------------------------- forum
create type forum_channel as enum ('recruiting', 'interview-prep', 'referrals', 'opportunities', 'offers', 'general');

create table forum_posts (
  id uuid primary key default gen_random_uuid(),
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
-- settings: 'archive' -> {deckUrl, note}

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
alter table contacts enable row level security;
alter table outreach enable row level security;
alter table comments enable row level security;
alter table firm_grades enable row level security;
alter table forum_posts enable row level security;
alter table forum_replies enable row level security;
alter table forum_votes enable row level security;
alter table projects enable row level security;
alter table templates enable row level security;
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

-- Applications are personal; exec can see aggregate outcomes through the companies view.
create policy "own applications" on applications for all
  using (member_id = current_member_id() or is_exec())
  with check (member_id = current_member_id());

create policy "read shared" on interview_reports for select using (current_member_id() is not null);
create policy "write own reports" on interview_reports for insert with check (member_id = current_member_id());
create policy "read contacts" on contacts for select using (current_member_id() is not null);
create policy "add contacts" on contacts for insert with check (current_member_id() is not null);
-- Outreach rows can be anonymous, so members read them through outreach_visible (below).
create policy "own outreach or exec" on outreach for select using (member_id = current_member_id() or is_exec());
create policy "log own outreach" on outreach for insert with check (member_id = current_member_id());
create policy "read comments" on comments for select using (current_member_id() is not null);
create policy "post own comments" on comments for insert with check (member_id = current_member_id());
create policy "read projects" on projects for select using (current_member_id() is not null);
create policy "exec manage projects" on projects for all using (is_exec()) with check (is_exec());
create policy "read templates" on templates for select using (current_member_id() is not null);
create policy "exec manage templates" on templates for all using (is_exec()) with check (is_exec());
create policy "read settings" on settings for select using (current_member_id() is not null);
create policy "exec manage settings" on settings for all using (is_exec()) with check (is_exec());

-- Grades: members write their own; everyone reads through firm_grades_visible.
create policy "own grades or exec" on firm_grades for select using (member_id = current_member_id() or is_exec());
create policy "write own grades" on firm_grades for insert with check (member_id = current_member_id());
create policy "edit own grades" on firm_grades for update using (member_id = current_member_id()) with check (member_id = current_member_id());
create policy "delete own grades or exec" on firm_grades for delete using (member_id = current_member_id() or is_exec());

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
  o.helpfulness, o.referred, o.notes, o.anonymous,
  case when not o.anonymous or o.member_id = current_member_id() or is_exec() then o.member_id end as member_id
from outreach o
where current_member_id() is not null;

-- The public website reads site_content anonymously; only exec can change it.
create policy "public read site" on site_content for select using (true);
create policy "exec edit site" on site_content for all using (is_exec()) with check (is_exec());
