# Ashu Website — Advocate Ashutosh Saini

A bilingual (English/Hindi) Next.js starter for a professional informational website and PWA.

## Included
- `/en/` and `/hi/` locale routes and language switch
- Dark-luxury visual system, responsive navigation, dark/light toggle, reduced-motion CSS
- Home, About, Experience, Qualifications, Practice Areas, Courts, Blog, Contact, Disclaimer, Privacy, FAQs
- Blog search/category filter UI with clearly labelled sample placeholders
- SEO metadata, sitemap, robots, manifest and A-monogram app icon
- Basic offline cache for public pages; admin and API routes are excluded
- Server-side chatbot API scaffold, disabled by default
- Contact API disabled by default
- Supabase schema starter for articles, roles, enquiries, newsletter and push subscriptions

## Run locally
1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. `npm install`
4. `npm run dev`
5. Open http://localhost:3000/en/

## Deploy to a temporary URL
1. Create a GitHub repository and push this folder.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SITE_URL` as the Vercel deployment URL.
4. Deploy. Purchase/connect your domain later in Vercel project settings and update `NEXT_PUBLIC_SITE_URL`.

## Supabase and administration
Create a Supabase project and run `sql/schema.sql`. The SQL deliberately enables RLS without permissive policies. Before using the admin dashboard, implement Supabase Auth, role checks on every server action/API route, secure session handling, audit logs, backup/retention, and advocate-only approval/publishing controls. The `/admin` page is an instructional placeholder, not a functioning secure admin portal.

## AI
Set `OPENAI_API_KEY` only in Vercel server-side environment variables. Never place it in a `NEXT_PUBLIC_` variable or commit it. The chatbot route is disabled unless `ENABLE_CHATBOT=true`. Review provider terms, privacy notices, prompt behaviour, abuse limits and logging before enabling. Current route provides general legal education only and rejects data collection.

## Compliance-first feature flags
Keep all flags false until professional and privacy review is complete:
- `ENABLE_CONTACT_SUBMISSIONS`
- `ENABLE_CHATBOT`
- `ENABLE_WHATSAPP`
- `ENABLE_NEWSLETTER`
- `ENABLE_PUSH_NOTIFICATIONS`

The contact endpoint intentionally does not store data yet. No WhatsApp widget, newsletter capture, push subscription flow or visitor lead collection is active in this starter. Implement them only after consent, security, retention, deletion, vendor and BCI review.

## Required before public launch
- Verify BCI/State Bar Council website requirements and any intimation/approval needed under applicable rules, including Rule 36 and its Schedule.
- Confirm enrolment number/date, State Bar Council, Bar Association membership and truth declaration.
- Verify all work dates, court descriptions and each listed practice area; remove anything not accurate.
- Confirm whether the professional profile and all contact/website features are permissible in their final presentation.
- Add verified office address only if approved for public display; then configure the map.
- Replace monogram with approved logo and photograph.
- Have Indian privacy counsel review the final policy and all collection/analytics/vendor flows under applicable data-protection law.
- Add real bilingual blog content only after source checking and advocate approval. No AI draft should auto-publish.
- Set up authenticated admin with least privilege, MFA, backups, rate limits, monitoring and security testing.
- Configure Search Console, analytics and consent/notice requirements before tracking.

## Important limitations
This is a complete starter codebase and visual website foundation, not a deployed production service. It does not include a production-ready admin authentication system, article-generation scheduler/research pipeline, persistent contact storage, newsletter provider, push delivery service, Google Maps pin, or future client portal. Those require provider accounts, credentials, verified data and security/legal review. Do not treat the placeholder admin route or database schema as production-secure.
