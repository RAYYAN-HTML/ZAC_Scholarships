# ZAC Scholarship Portal

A responsive scholarship discovery portal for students in Pakistan. The MVP uses Svelte 5, SvelteKit 2, TypeScript, Tailwind CSS 4, Drizzle ORM, MySQL, Zod, and Lucide Svelte.

## Current project status

- Public homepage, scholarship directory, scholarship details, About, FAQ, Contact, and Feedback pages are implemented. Feedback offers common question topics and an optional follow-up email.
- Directory search, country/degree/category/funding filters, sorting, and pagination use URL query parameters.
- Public scholarship queries require both `verification_status = 'verified'` and `publication_status = 'published'`.
- Admin login uses scrypt password hashes and HTTP-only, SameSite=strict, eight-day session cookies. A request-level server hook protects all `/admin` routes and actions except the public sign-in page; SvelteKit also enforces same-origin form submissions.
- Admin scholarship review, duplicate warnings, publication guard, dashboard, and feedback moderation are implemented.
- Controlled importers add researched opportunities as unpublished drafts. The 362 names in the user-provided international and Asia lists are retained as unverified candidates; missing facts and official URLs are not invented. Candidates remain private until an administrator researches and verifies them.
- A persistent MySQL database is required for listings, admin login, and feedback. No database credentials are included. Without `DATABASE_URL`, the public site shows a clear empty/setup state and admin/database features cannot be used.
- SvelteKit is configured with `adapter-node` and `pnpm start` runs the generated Node server. The Railway production app and MySQL connection are live at `https://www.zacscholarships.info`; admin sign-in has been verified.

## Local setup

Requirements: Node.js 22.12 or newer, pnpm, and MySQL 8.0+. This workspace has verified portable Node.js 24.22.1 and MySQL 8.4.13 Windows distributions under ignored `tools/`; no machine-wide runtime or database installation is required for the local setup script.

1. Install dependencies: `pnpm install`
2. The local `.env` is configured with randomly generated credentials and is ignored by Git. To initialize the local database, run from Windows PowerShell or Windows Terminal outside Codex: `powershell -ExecutionPolicy Bypass -File scripts/setup-local-mysql.ps1`. It initializes the database under `%LOCALAPPDATA%\CCE\MySQL-8.4`, starts MySQL on `127.0.0.1` only, sets a root password, creates the least-privilege app database account, applies migrations, and imports the researched listings as drafts. Codex's isolated terminal cannot give the MySQL process the required writable database directory or local TCP access.
3. Start the site: `pnpm dev`
4. Run static checks: `pnpm check`
5. Run focused regression tests: `pnpm test`
6. Create the first administrator from PowerShell. The script prompts twice for a masked password and does not write it to a file:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/create-admin.ps1 -Email "you@example.com"
   ```

   The display name defaults to “ZAC Administrator”; pass `-Name "Your Name"` to change it. Use a unique password of at least 14 characters. The account is inserted into MySQL; the password is not stored in plaintext.

7. Open `/admin/login` and sign in.

## Continuous integration

The GitHub Actions workflow in `.github/workflows/ci.yml` runs on pushes and pull requests to `main` or `master`. It installs from the frozen pnpm lockfile, then runs the regression tests, Svelte/TypeScript checks, and production build with read-only repository permissions. Check the repository’s Actions tab for the latest hosted workflow result.

The MySQL server is a local process, not a Windows service. Start it again after restarting Windows by running `mysqld.exe --defaults-file="tools/my.ini" --console` from a project PowerShell window. Keep the terminal open while using ZAC. The local database files and downloaded server binaries are in ignored `tools/` and must not be committed.

The readiness endpoint `/healthz` returns HTTP 200 only when the application can connect to MySQL; it returns a generic HTTP 503 response otherwise. It never returns database credentials or internal error details.

## Database and migrations

`src/lib/server/schema.ts` defines:

- `scholarships`: source/application URLs, dates, eligibility and award details, verification state, publication state, review note, and timestamps. Pending drafts may lack an official source URL; verification and publication require one. Indexes cover public status/deadline, country, and category.
- `admins`: unique email, scrypt hash, role, and active state.
- `sessions`: expiring server-side sessions linked to an admin.
- `feedback`: message, category, optional email for administrator follow-up, public-sharing consent and approval, optional administrator reply, moderation status, and timestamp. Email is not required and is never displayed publicly.
- `daily_page_views`: aggregate daily counts for public page paths and scholarship slugs. It stores no visitor identities or IP addresses.

Schema changes should be made in `schema.ts`, then reviewed with `pnpm db:generate`. Commit generated migration SQL under `drizzle/`, inspect it before running `pnpm db:migrate`, and back up production data before applying schema changes.

Migration `0003_perpetual_korg.sql` adds a nullable email field to feedback. It preserves existing submissions and should be applied via Railway's `pnpm db:migrate` pre-deploy command.

Migration `0004_strange_madame_hydra.sql` adds opt-in public feedback, administrator approval, and a reply field. Existing feedback stays private because new consent and visibility fields default to false.

## Scholarship research and verification

Research is separate from page rendering. Normal page visits do not scrape external websites.

1. Research public official/provider sources and record the source URL and retrieval time.
2. Normalize known values; leave unknown information blank or explicitly “Not specified”.
3. Check for provider/title/application URL duplicates.
4. Import researched opportunities with `pnpm research:import` (manually researched rows are in `scripts/import-research.ts`). Import the user-provided candidate lists with `pnpm research:import-candidates`; candidates have no official source URL until one is found. The candidate importer skips likely title duplicates and never publishes.
5. Add newly located official source URLs to eligible source-less candidate drafts with `pnpm research:update-candidate-sources`. The curated mapping is `data/candidate-source-urls-2026-11-16.json`; the updater only fills a NULL source URL when the exact title is still pending verification and draft. It never changes verification or publication state. Re-run the command as more provider URLs are researched.
6. Admin reviews source/application links, deadline, eligibility, benefits and document requirements; record conflicting or missing details in verification notes.
7. Check the scholarship’s existence, eligibility, current application status, and details before marking it Verified. Publishing is enabled only for Verified listings with an official source URL.
8. Revisit expired/uncertain listings and mark them Needs re-verification or Expired.

Sample official sources (researched 2026-11-15; all remain drafts until review):

- [HEC Balochistan/FATA undergraduate Batch V](https://www.hec.gov.pk/english/scholarshipsgrants/BF-III/Pages/default.aspx) — deadline shown as 14 December 2026; eligibility is limited by domicile/local certificate.
- [HEC Chinese Government Scholarship 2027–28](https://www.hec.gov.pk/english/scholarshipsgrants/lao/CGSP/Pages/default.aspx) — HEC portal deadline shown as 5 January 2027.
- [HEC announcement for BUP SAARC scholarships](https://www.hec.gov.pk/english/HECAnnouncements/Pages/SAARC-Scholarship.aspx) — HEC page has a seat-count discrepancy that must be resolved with BUP before verification.

The controlled import is not a recurring scraper. Provider scans and opportunity statuses are recorded in [docs/research/pakistan-scholarship-scan-2026-11-16.md](docs/research/pakistan-scholarship-scan-2026-11-16.md) and [docs/research/international-scholarship-scan-2026-11-16.md](docs/research/international-scholarship-scan-2026-11-16.md). Their coverage is a starting inventory, not a claim to include every scholarship organization worldwide. If automated extraction is added later, keep it as a separate scheduled/admin-invoked process with timeouts, retry limits, robots/terms checks, retrieval logging, change detection, duplicate detection, and manual review. It must never publish directly.

## Admin use

- `/admin/login`: sign in; unauthenticated admin routes redirect here.
- `/admin`: scholarship status counts, recent updates, public page views for today and the last seven days, and the most-viewed public scholarships for the last 30 days.
- `/admin/scholarships`: search, select multiple listings, mark them verified in one confirmed action, publish verified selections publicly, or move selections back to drafts. Bulk publishing is rejected if any selected record is unverified.
- `/admin/scholarships/new`: create a draft from an official source.
- `/admin/scholarships/[id]/edit`: edit, record review notes, set statuses, preview the official source, and publish only after verification.
- `/admin/feedback`: review student questions and suggestions, contact submitters who supplied an email, post a team reply, approve public visibility only when the submitter opted in, and mark feedback New, Reviewed, or Resolved.
- Sign out from the admin navigation to invalidate the server-side session.

## Site activity analytics

The public site sends one first-party page-view event after client-side navigation. The server accepts only known public pages and slugs that belong to published, verified scholarships. Daily totals use the `Asia/Karachi` calendar date. The dashboard shows page views today, a daily view graph for the last 14 days, the last seven days total, and the five most viewed published scholarships over the last 30 days.

These are page-view counts, not unique visitors. ZAC does not persist cookies, visitor identities, or IP addresses for analytics. The endpoint uses the existing in-memory rate-limit helper briefly keyed by request IP to limit abuse; that counter is bounded, resets, and is not written to MySQL. The analytics table was added in migration `0001_stale_dormammu.sql`; run `pnpm db:migrate` before expecting dashboard counts to load. Existing views are not backfilled.

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Private MySQL connection string. Server-only; never expose through public Vite variables. |
| `PUBLIC_SITE_URL` | Canonical site origin for sitemap and robots output. |
| `ADMIN_INITIAL_PASSWORD` | Set temporarily in process memory by `scripts/create-admin.ps1`; do not put in `.env` or commit it. |

## Deployment and recovery

The deployment target is Railway. SvelteKit uses `@sveltejs/adapter-node` and `pnpm start` runs `node build`. Railway service/database setup and production deployment are not yet verified.

1. Push the project to `https://github.com/RAYYAN-HTML/ZAC_Scholarships`, then create a Railway service from that GitHub repository using Railpack. Set the build command to `pnpm build` and start command to `pnpm start` if Railway does not detect them.
2. Add Railway's MySQL service. In the app service, set `DATABASE_URL` to a private Railway variable reference for the MySQL service's `MYSQL_URL` (for example `${{MySQL.MYSQL_URL}}`, using the actual service name). Keep the database private; the app does not need `MYSQL_PUBLIC_URL`.
   A new Railway database starts with an empty schema and data. `pnpm db:migrate` creates tables but does not copy scholarship rows, admins, feedback, or analytics from local MySQL; plan and verify a separate database transfer before switching users to the hosted site.
3. Set `PUBLIC_SITE_URL` to the deployed HTTPS domain. Configure Railway's healthcheck path as `/healthz`; this endpoint returns 200 only when MySQL is reachable.
4. Set the app service's Pre-deploy Command to `pnpm db:migrate` and set a reasonable timeout. Railway runs it with the service's variables and private networking before starting a deployment; migration failure blocks the deployment. To create the first administrator, temporarily add `ADMIN_INITIAL_PASSWORD` to the app service variables, then run `railway run --no-local --service <app-service-name> --environment production pnpm admin:create admin@example.com "ZAC Administrator"` from the project folder. `--no-local` prevents the local `.env` from overriding Railway's production database URL. Remove `ADMIN_INITIAL_PASSWORD` after the admin is created. Deploy and verify public routes, login/logout, admin guard, scholarship CRUD/publication, filters, feedback, sitemap, and mobile layouts.
5. Configure database backups and test a restore before relying on them. Keep an encrypted backup outside the app host. Example manual backup and restore:

   ```sh
   mysqldump --single-transaction --routines --triggers "$DATABASE_NAME" > cce-backup.sql
   mysql "$DATABASE_NAME" < cce-backup.sql
   ```

   Restrict backup file access, encrypt off-host copies, and test restores before relying on them. Never commit backups.

Production database connectivity and hosting are configured. Automated backups and restore verification, production mobile/browser verification, and the remaining launch checklist are still outstanding, so ZAC is not launch-ready yet.

## Package licenses

Direct dependency package metadata lists MIT for Svelte, SvelteKit, `@sveltejs/adapter-node`, `@sveltejs/vite-plugin-svelte`, Vite, Tailwind CSS and its Vite plugin, Drizzle Kit, MySQL2, Zod, tsx, and svelte-check; ISC for Lucide Svelte; Apache-2.0 for Drizzle ORM and TypeScript; and BSD-2-Clause for dotenv. The portable Node.js runtime uses MIT; the MySQL server uses GPL-2.0 with Oracle’s FOSS License Exception. Review bundled license notices and package metadata before redistribution. No third-party source files were copied into this project.

## Known limitations

- MySQL must be configured before any records persist; no local demo scholarship is fabricated or auto-published.
- Research-import examples are manually curated drafts, not a live scraper. Extraction-failure history is currently written to server logs/admin review notes, not to a dedicated import-audit table.
- Login and feedback use bounded, process-local rate-limit counters suitable only for a single-process MVP. Use a shared store before horizontal scaling.
- Admin roles are stored, but the MVP treats authenticated admins/editors alike. Add permission-specific role checks before onboarding non-admin editors.
- No hosted database, backup scheduler, or deployment has been configured. Analytics are implemented but still need a migrated database and live verification.
- Bulk move-to-draft is available; bulk publishing is intentionally not supported. Automated scholarship re-verification is not implemented.
- No AI attribution or invented contributor credits are included.
