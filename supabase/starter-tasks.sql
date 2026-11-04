-- Starter recurring tasks for the Graphite portal. Optional: run once in the
-- Supabase SQL editor after the schema. Exec can edit or delete any of them in
-- Recurring tasks afterwards; due dates follow the semester calendar.
insert into task_templates (title, body, audience_kind, audience_role, audience_title, semester, when_anchor, when_weeks) values
  ('Complete your member profile', 'Confirm your school, class year, phone and emails so the directory stays accurate.', 'all', null, null, 'Fall', 'week', 2),
  ('Book rooms for recruiting info sessions', 'Reserve info session and interview rooms at CMC and Pomona for recruiting.', 'title', null, 'Director of Recruiting & Engagement', 'Every semester', 'before', 1),
  ('Update the PD curriculum', 'Refresh the Excel, market sizing and slide workshops before new members start.', 'title', null, 'Director of Professional Development', 'Every semester', 'before', 2),
  ('Staff this semester''s engagements', 'Confirm clients, scopes and team assignments for the semester.', 'title', null, 'Director of Strategy & Client Relations', 'Every semester', 'before', 3),
  ('Prepare the board meeting', 'Agenda, budget update and semester review for the RLCIE board meeting.', 'title', null, 'Managing Director', 'Fall', 'week', 8),
  ('Final deck review with your team', 'Dry-run the final client presentation with your project lead and one exec member.', 'role', 'Team Lead', null, 'Every semester', 'end', 2),
  ('Log your recruiting outcomes', 'Update My Recruiting with every application''s final stage and add your interviews.', 'all', null, null, 'Spring', 'end', 1),
  ('Write your transition document', 'Document your role''s recurring work, contacts and lessons for your successor.', 'role', 'Executive Board', null, 'Spring', 'end', 3),
  ('Check the portal''s jobs and save a backup', 'On GitHub, open Actions and confirm Deploy portal, Keep Supabase awake and Back up database all ran green. Download the newest backup from the latest Back up database run and save it to the club Drive. Steps are in docs/OPERATIONS.md.', 'title', null, 'Managing Director', 'Every semester', 'end', 0),
  ('Hand over the portal accounts', 'Make the incoming Managing Director an owner of the club''s GitHub organization and Supabase organization, give them the club Gmail login that sends sign-in emails, and share the backup passphrase. Steps are in docs/OPERATIONS.md.', 'title', null, 'Managing Director', 'Spring', 'end', 0),
  ('Complete the Graphite curriculum', 'Finish the four onboarding workshops and submit the practice case.', 'role', 'Associate Consultant', null, 'Every semester', 'week', 6);
