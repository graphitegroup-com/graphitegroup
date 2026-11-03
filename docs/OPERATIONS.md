# Running the portal

How the portal is published and kept safe, on free services only. Written for whoever is Managing Director; no coding needed. The two recurring MD tasks on the portal ("Check the portal's jobs and save a backup" each semester, "Hand over the portal accounts" each spring) point here.

## What runs on its own

| Job (GitHub, Actions tab) | When | What it does | Needs |
| --- | --- | --- | --- |
| **Deploy portal** | Every change merged into `main` | Builds the portal and publishes it to GitHub Pages | Pages switched on (below) |
| **Keep Supabase awake** | Daily | One small read so Supabase's free plan doesn't pause the project after 7 quiet days. If the repo has had no commits for 50 days, it also records a one-line heartbeat commit, because GitHub switches off scheduled jobs in public repos after 60 quiet days | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` |
| **Back up database** | Sundays | Dumps the database, encrypts it, and keeps it on the run for 90 days | `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE` |

Until the settings in the last column exist, the keep-awake and backup jobs finish with a note saying they skipped. Until the portal is connected to Supabase, Deploy publishes the sample-data demo.

The jobs live in `.github/workflows/`; their logic is in `scripts/ops/`, so it can be tested locally.

## One-time setup

Do this after the repo is in the club's GitHub organization and public.

1. **Turn on Pages.** Repo Settings → Pages → Build and deployment → Source: **GitHub Actions**. The next merge into `main` publishes the site; its address appears on that page (something like `https://<club-org>.github.io/graphitegroup/`). Link to it from the Webflow site's navigation as "Members".
2. **Add the settings.** Repo Settings → Secrets and variables → Actions.
   - **Variables** tab (visible to anyone, and that's fine):
     - `SUPABASE_URL`: Supabase → Project Settings → API → Project URL.
     - `SUPABASE_PUBLISHABLE_KEY`: the key starting `sb_publishable_` (older projects call it "anon"). Safe to publish: it can only do what the database's access rules allow.
   - **Secrets** tab (encrypted, never shown again, not visible to the public):
     - `SUPABASE_DB_URL`: Supabase → **Connect** → **Session pooler** connection string, with the database password filled in. Use the session pooler, not the direct connection: GitHub's machines can't reach Supabase's direct address.
     - `BACKUP_PASSPHRASE`: a long random phrase. Save it in the club's password manager too. **Without it, no backup can ever be opened.**
   - Never add the Supabase **secret key** (`sb_secret_`, older name "service_role") anywhere in GitHub. It ignores every access rule.
3. **Check each job once.** Actions → pick the job → **Run workflow**. All three should go green.
4. **Get failure emails.** GitHub emails a scheduled job's failures to whoever last edited its schedule line. These files were written by Claude, which isn't a GitHub user, so nobody would hear about failures. Have the MD open `.github/workflows/backup.yml` and `.github/workflows/keep-awake.yml` on GitHub, change the minute in each `cron:` line by one, and commit. Repeat when a new MD takes over.

## Each semester (MD task)

1. Actions tab: confirm the last runs of all three jobs are green.
2. Open the latest **Back up database** run, download its file (`graphite-backup-YYYY-MM-DD`), and put it in the club Drive's backups folder. GitHub deletes run files after 90 days; the Drive copy is the long-term record.

## If something goes wrong

- **Keep Supabase awake failed with HTTP 503 or "didn't answer":** the project paused. Supabase dashboard → the project → Restore. Then run the job again.
- **It failed with HTTP 401:** `SUPABASE_PUBLISHABLE_KEY` is wrong or was rotated. Paste the current one into the variable.
- **Back up database failed:** usually `SUPABASE_DB_URL` (wrong password, or the direct connection string instead of the session pooler).
- **Jobs stopped running altogether:** GitHub switched them off. Actions → the job → **Enable workflow**.

## Restoring a backup

Into a new, empty Supabase project, from a computer with `gpg` and `psql` (or ask Claude to do it in a session):

```bash
BACKUP_PASSPHRASE='the passphrase' bash scripts/ops/restore.sh graphite-backup-2026-11-08.tar.gz.gpg 'postgresql://...session pooler string of the new project...'
```

It restores roles, then the schema, then the data, in the order Supabase documents. Then point `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_DB_URL` at the new project.

## Handing over (MD task, each spring)

Every account the portal depends on should be owned by the club, with at least two owners, so nothing leaves with one person:

- **GitHub organization:** add the incoming MD as an owner.
- **Supabase organization:** add them as an owner.
- **Club Gmail** that sends sign-in and password-reset emails: share the login.
- **`BACKUP_PASSPHRASE`:** share it through the password manager.
- Redo step 4 of the setup (failure emails) as the new MD.
