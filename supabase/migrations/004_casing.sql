-- Graphite portal: Casing (November 2026). Casebooks, the cases in them, and
-- members' reviews of each case. Run once in the Supabase SQL editor after
-- 003_teams_headshots.sql. Safe to run twice.

-- A casebook opens in Google Drive; any member can add one.
create table if not exists casebooks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  source text not null default '',
  drive_url text not null check (drive_url ~* '^https?://\S+$'),
  description text not null default '',
  added_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Each case sits in one casebook. A casebook can't be removed while it has cases.
create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  casebook_id uuid not null references casebooks (id) on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 200),
  page text not null default '',
  case_type text not null default 'Other'
    check (case_type in ('Profitability', 'Market entry', 'Market sizing', 'Growth', 'Pricing', 'M&A', 'Operations', 'New product', 'Turnaround', 'Other')),
  format text not null default 'Interviewer-led' check (format in ('Interviewer-led', 'Candidate-led')),
  industry text not null default '',
  summary text not null default '',
  added_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists cases_casebook_idx on cases (casebook_id);

-- One review per member per case; saving it is what marks the case done.
-- Ratings are 1 to 5 and can be filled in after marking it done.
create table if not exists case_reviews (
  case_id uuid not null references cases (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  completed_at timestamptz not null default now(),
  role text not null default 'Candidate' check (role in ('Candidate', 'Interviewer')),
  difficulty smallint check (difficulty between 1 and 5),
  math smallint check (math between 1 and 5),
  exhibits smallint check (exhibits between 1 and 5),
  structure smallint check (structure between 1 and 5),
  creativity smallint check (creativity between 1 and 5),
  quality smallint check (quality between 1 and 5),
  minutes smallint check (minutes between 1 and 600),
  notes text not null default '' check (length(notes) <= 5000),
  updated_at timestamptz not null default now(),
  primary key (case_id, member_id)
);
create index if not exists case_reviews_member_idx on case_reviews (member_id);

-- Whether the signed-in member has done a case. Security definer, so the
-- reviews policy below can ask without checking itself again.
create or replace function has_done_case(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from case_reviews where case_id = c and member_id = current_member_id())
$$;

alter table casebooks enable row level security;
alter table cases enable row level security;
alter table case_reviews enable row level security;

-- Every member reads casebooks and cases and can add them; whoever added one,
-- or exec, can change or remove it.
drop policy if exists "read casebooks" on casebooks;
create policy "read casebooks" on casebooks for select using (current_member_id() is not null);
drop policy if exists "members add casebooks" on casebooks;
create policy "members add casebooks" on casebooks for insert with check (added_by = current_member_id());
drop policy if exists "adder or exec edit casebooks" on casebooks;
create policy "adder or exec edit casebooks" on casebooks for update
  using (added_by = current_member_id() or is_exec()) with check (added_by = current_member_id() or is_exec());
drop policy if exists "adder or exec remove casebooks" on casebooks;
create policy "adder or exec remove casebooks" on casebooks for delete using (added_by = current_member_id() or is_exec());

drop policy if exists "read cases" on cases;
create policy "read cases" on cases for select using (current_member_id() is not null);
drop policy if exists "members add cases" on cases;
create policy "members add cases" on cases for insert with check (added_by = current_member_id());
drop policy if exists "adder or exec edit cases" on cases;
create policy "adder or exec edit cases" on cases for update
  using (added_by = current_member_id() or is_exec()) with check (added_by = current_member_id() or is_exec());
drop policy if exists "adder or exec remove cases" on cases;
create policy "adder or exec remove cases" on cases for delete using (added_by = current_member_id() or is_exec());

-- No spoilers: you see other members' reviews of a case only once you've
-- done it yourself. Exec included. Your own review is yours to change.
drop policy if exists "read reviews of cases you've done" on case_reviews;
create policy "read reviews of cases you've done" on case_reviews for select
  using (member_id = current_member_id() or has_done_case(case_id));
drop policy if exists "mark a case done" on case_reviews;
create policy "mark a case done" on case_reviews for insert with check (member_id = current_member_id());
drop policy if exists "edit your review" on case_reviews;
create policy "edit your review" on case_reviews for update
  using (member_id = current_member_id()) with check (member_id = current_member_id());
drop policy if exists "remove your review, or exec" on case_reviews;
create policy "remove your review, or exec" on case_reviews for delete using (member_id = current_member_id() or is_exec());

-- Totals over every review, which everyone sees before doing a case: how many
-- have done it and the average of each rating. No names, no thoughts.
create or replace view case_stats with (security_invoker = false) as
select
  case_id,
  count(*)::int as done,
  count(difficulty)::int as rated,
  count(*) filter (where btrim(notes) <> '')::int as written,
  round(avg(difficulty), 2) as difficulty,
  round(avg(math), 2) as math,
  round(avg(exhibits), 2) as exhibits,
  round(avg(structure), 2) as structure,
  round(avg(creativity), 2) as creativity,
  round(avg(quality), 2) as quality
from case_reviews
where current_member_id() is not null
group by case_id;
