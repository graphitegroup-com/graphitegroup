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
group by c.id;

-- Discussion threads on companies, contacts and projects.
create table comments (
  id uuid primary key default gen_random_uuid(),
  subject text not null,                    -- 'company:goldman-sachs', 'contact:<uuid>', 'project:<uuid>'
  member_id uuid references members (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);
create index comments_subject_idx on comments (subject);

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
create or replace function current_member_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from members where auth_user_id = auth.uid()
$$;

create or replace function is_exec() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where auth_user_id = auth.uid() and role = 'Executive Board')
$$;

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
create policy "read outreach" on outreach for select using (current_member_id() is not null);
create policy "log own outreach" on outreach for insert with check (member_id = current_member_id());
create policy "read comments" on comments for select using (current_member_id() is not null);
create policy "post own comments" on comments for insert with check (member_id = current_member_id());
create policy "read projects" on projects for select using (current_member_id() is not null);
create policy "exec manage projects" on projects for all using (is_exec()) with check (is_exec());
create policy "read templates" on templates for select using (current_member_id() is not null);
create policy "exec manage templates" on templates for all using (is_exec()) with check (is_exec());
create policy "read settings" on settings for select using (current_member_id() is not null);
create policy "exec manage settings" on settings for all using (is_exec()) with check (is_exec());

-- The public website reads site_content anonymously; only exec can change it.
create policy "public read site" on site_content for select using (true);
create policy "exec edit site" on site_content for all using (is_exec()) with check (is_exec());
