# Ashu Website — Advocate Ashutosh Saini

Bilingual (English/Hindi) Next.js website and private editorial workflow.

## Stack

- Next.js App Router, TypeScript and Tailwind CSS
- Vercel hosting and scheduled jobs
- Supabase Auth, Postgres and Row Level Security
- OpenAI API called only from server routes
- English/Hindi public article publishing with advocate approval

## Core routes

- Public website: \`/en/\` and \`/hi/\`
- Blog: \`/[lang]/blog\` and \`/[lang]/blog/[slug]\`
- Admin: \`/[lang]/admin\`
- Admin sign-in: \`/[lang]/admin/login\`
- Auth callback: \`/auth/callback\`

## Admin and roles

- No public registration. Administrators are invited in Supabase Auth.
- Each admin API verifies the authenticated user with Supabase Auth and reads the server-controlled \`profiles.role\`.
- \`owner\`: full admin access.
- \`advocate\`: edit, approve, publish, schedule and delete articles; view enquiries.
- \`editor\`: prepare/edit drafts and submit them for review; cannot approve or publish.
- Only the advocate/owner can approve. Publication requires a previously approved article.
- The privileged Supabase secret is isolated in server-only modules.

Run \`sql/production_schema.sql\` in a newly created Supabase project, then follow \`sql/ADMIN_SETUP.md\` to invite and assign the two administrator accounts.

## Bilingual editorial workflow

- Supply URLs from the allowlisted official primary-source domains.
- The server fetches source text and asks OpenAI for an English/Hindi draft pair.
- Both entries are saved with source URLs and verification notes in \`draft\` status.
- The admin can edit, send to review, approve, publish now, schedule or archive/delete.
- A daily Vercel Cron job can read explicitly configured official RSS/Atom feeds and create one draft pair. A second daily job publishes only articles that were approved by an advocate and whose scheduled time has passed.
- AI research is not a substitute for checking original judgments, statutory text, dates and citations. Advocate review remains mandatory.

## Enquiries and chatbot

- Contact submissions are disabled by default.
- If deliberately enabled after privacy and professional-conduct review, the server validates consent and fields, rate-limits requests and stores submissions with a 90-day retention timestamp.
- Enquiries have no public Data API policy. Only an authenticated owner/advocate endpoint can read them.
- A daily retention job deletes expired enquiries.
- Chatbot responses are not persisted. The API is rate-limited and warns against sharing personal/confidential information. It provides general legal information only.
- OpenAI and Supabase secrets are server-only; never use a \`NEXT_PUBLIC_\` prefix for secret keys.

## Required environment variables

See \`.env.example\`. In Vercel, configure Supabase URL, publishable key, server secret, OpenAI key, CRON_SECRET and verified official feed URLs. Keep \`ENABLE_CONTACT_SUBMISSIONS=false\` and \`ENABLE_CHATBOT=false\` until the required review and testing are complete.

## Local development

1. Use Node.js 20 or newer.
2. Install dependencies with \`npm install\`.
3. Copy \`.env.example\` to \`.env.local\` and fill in test project values.
4. Run \`npm run dev\`.
5. Run \`npm run typecheck\` and \`npm run build\` before deployment.

## Not yet operational until configured

The code is committed as an implementation foundation. It is not a live connected service until a Supabase project exists, schema is applied, administrator UUIDs are assigned, Vercel secrets and cron feeds are configured, and builds/security checks pass. The current connected Supabase account did not expose a project when inspected.

## Professional and privacy compliance

This is an informational site, not legal clearance. BCI Rule 36 and applicable requirements must be reviewed before public launch. A disclaimer does not make otherwise prohibited advertising or solicitation permissible. Confirm enrolment and Bar Council details, allowed website information, approved content, exact office location, privacy notice, consent, retention and vendor terms before enabling data collection or outreach.
