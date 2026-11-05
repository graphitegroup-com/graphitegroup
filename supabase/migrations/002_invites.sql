-- Graphite portal: invite many members at once by email (November 2026).
-- Run once in the Supabase SQL editor after 001_live.sql. Safe to run twice.
-- A new project only needs schema.sql, which already includes this.

-- Emails exec has approved to join. The person fills in their own name,
-- school and class during setup, and join_from_invite turns the invite into
-- a member then, so the roster never holds placeholder people.
create table if not exists invites (
  email text primary key check (email = lower(btrim(email)) and email like '%_@_%'),
  role member_role not null default 'Associate Consultant' check (role <> 'Executive Board'),
  added_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table invites enable row level security;
drop policy if exists "exec manage invites" on invites;
create policy "exec manage invites" on invites for all using (is_exec()) with check (is_exec());
-- An invited person, signed in but not a member yet, sees their own invite.
drop policy if exists "read own invite" on invites;
create policy "read own invite" on invites for select using (email = lower(btrim(auth.jwt() ->> 'email')));

-- Sign-up now accepts invited emails as well as members'.
create or replace function auth_roster_only() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email is null
     or (member_for_email(new.email) is null and not exists (select 1 from invites where email = lower(btrim(new.email)))) then
    raise exception 'This email is not on the Graphite roster. Ask the executive board to add it.';
  end if;
  return new;
end $$;

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
