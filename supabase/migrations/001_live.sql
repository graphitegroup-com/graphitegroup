-- Graphite portal: changes since the first run of schema.sql (November 2026).
-- Run once in the Supabase SQL editor on a project that already has the
-- original schema. Safe to run twice. A new project only needs schema.sql,
-- which already includes all of this.

-- Executive board access ends at graduation; alumni keep the role for the record only.
create or replace function is_exec() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from members
    where id = current_member_id() and role = 'Executive Board' and now() < make_date(grad_year, 6, 1)
  )
$$;

-- Private notes on your own applications. The table is already readable only by its owner.
alter table applications add column if not exists private_notes text not null default '';

-- Contacts who went to one of the Claremont Colleges.
alter table contacts add column if not exists is_school_alum boolean not null default false;
alter table contacts add column if not exists alum_school school;
alter table contacts add column if not exists school_class int check (school_class between 1900 and 2100);

-- Private notes on your own outreach. Exec can read outreach rows, so these
-- live in their own table that only the author can read.
create table if not exists outreach_private_notes (
  outreach_id uuid primary key references outreach (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  notes text not null default ''
);
alter table outreach_private_notes enable row level security;
drop policy if exists "own private notes" on outreach_private_notes;
create policy "own private notes" on outreach_private_notes for all
  using (member_id = current_member_id())
  with check (
    member_id = current_member_id()
    and exists (select 1 from outreach o where o.id = outreach_id and o.member_id = current_member_id())
  );
