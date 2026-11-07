-- Graphite portal: semester teams and headshot storage (November 2026).
-- Run once in the Supabase SQL editor after 002_invites.sql. Safe to run
-- twice. A new project runs schema.sql and then every migration in order;
-- photo storage is set up only here, since it needs Supabase's storage schema.

-- ---------------------------------------------------------------- teams
-- Who's on each project's team for the semester it runs. A project's lead
-- (projects.lead) is on its team without a row here.
create table if not exists project_members (
  project_id uuid not null references projects (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  added_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_id, member_id)
);

-- Tasks a project's lead sets week by week, for the whole team (no assignee)
-- or one person. Due the Friday of that week of the semester.
create table if not exists project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  body text not null default '',
  week int not null check (week between 1 and 30),
  assignee_id uuid references members (id) on delete set null,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists project_tasks_project_idx on project_tasks (project_id);

-- Each person checks off their own copy of a team task.
create table if not exists project_task_done (
  task_id uuid not null references project_tasks (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (task_id, member_id)
);

create or replace function leads_project(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects where id = p and lead = current_member_id())
$$;

create or replace function on_project(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select leads_project(p) or exists (select 1 from project_members where project_id = p and member_id = current_member_id())
$$;

alter table project_members enable row level security;
alter table project_tasks enable row level security;
alter table project_task_done enable row level security;

-- Every member can see the teams and their tasks; exec runs every team, a
-- project's lead runs theirs.
drop policy if exists "read teams" on project_members;
create policy "read teams" on project_members for select using (current_member_id() is not null);
drop policy if exists "exec or lead staff the team" on project_members;
create policy "exec or lead staff the team" on project_members for all
  using (is_exec() or leads_project(project_id))
  with check (is_exec() or leads_project(project_id));

drop policy if exists "read team tasks" on project_tasks;
create policy "read team tasks" on project_tasks for select using (current_member_id() is not null);
drop policy if exists "exec or lead set team tasks" on project_tasks;
create policy "exec or lead set team tasks" on project_tasks for all
  using (is_exec() or leads_project(project_id))
  with check (is_exec() or leads_project(project_id));

-- Leads see who's done what; you can only check off a task on your own team.
drop policy if exists "read check-offs" on project_task_done;
create policy "read check-offs" on project_task_done for select using (current_member_id() is not null);
drop policy if exists "check off your own team tasks" on project_task_done;
create policy "check off your own team tasks" on project_task_done for insert with check (
  member_id = current_member_id()
  and exists (select 1 from project_tasks t where t.id = task_id and on_project(t.project_id) and (t.assignee_id is null or t.assignee_id = current_member_id()))
);
drop policy if exists "uncheck your own" on project_task_done;
create policy "uncheck your own" on project_task_done for delete using (member_id = current_member_id());

-- ---------------------------------------------------------------- headshots
-- Photos live in Supabase Storage, so loading the roster doesn't carry every
-- image. Each file sits in a folder named after its member, under a random
-- name. The bucket is public, like the photos on the club's website: anyone
-- with a file's exact address can open it, and addresses aren't listed.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('headshots', 'headshots', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "headshots: members read" on storage.objects;
create policy "headshots: members read" on storage.objects for select to authenticated
  using (bucket_id = 'headshots' and public.current_member_id() is not null);
drop policy if exists "headshots: upload your own" on storage.objects;
create policy "headshots: upload your own" on storage.objects for insert to authenticated
  with check (bucket_id = 'headshots' and ((storage.foldername(name))[1] = public.current_member_id()::text or public.is_exec()));
drop policy if exists "headshots: remove your own" on storage.objects;
create policy "headshots: remove your own" on storage.objects for delete to authenticated
  using (bucket_id = 'headshots' and ((storage.foldername(name))[1] = public.current_member_id()::text or public.is_exec()));
