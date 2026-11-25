# Secure administrator setup

1. Create a Supabase project and configure its URL, publishable key and server-only secret key in Vercel.
2. In Supabase Auth, invite the two intended administrators individually. Disable public sign-ups and configure SMTP for reliable magic-link delivery. Enable MFA for administrator accounts where available. The current application verifies the email session and role but does not yet enforce AAL2 on every request; add and test an AAL2 gate before making MFA a mandatory control.
3. Copy each invited user's UUID from Authentication > Users.
4. Run `sql/production_schema.sql` in the SQL Editor.
5. Assign roles using the real UUIDs (never user-editable user_metadata):

```sql
insert into public.profiles (id, display_name, role)
values ('OWNER_AUTH_USER_UUID', 'Website administrator', 'owner'),
       ('ADVOCATE_AUTH_USER_UUID', 'Advocate Ashutosh Saini', 'advocate')
on conflict (id) do update set display_name=excluded.display_name, role=excluded.role;
```

6. Add additional users as `editor`; only `advocate` or `owner` can approve and publish.
7. Set the Supabase URL, publishable key, server-only secret, OpenAI key, CRON_SECRET and verified LEGAL_SOURCE_FEEDS in Vercel. Never commit secrets.
8. Add the deployed `/auth/callback` URL to Supabase Auth's allowed redirect URLs and test magic-link delivery from the configured SMTP provider.
9. Keep contact submissions and chatbot disabled until privacy, retention, provider and advocate/BCI reviews are complete.

## Scheduling note

To remain compatible with low-cost Vercel cron limits, scheduled publication is checked once each morning (08:15 India time), rather than continuously. A scheduled article is published on the first daily run after its approved scheduled time. Change the cron frequency only after confirming the Vercel plan supports it.

The daily job reads only configured official feeds on the allowlist, creates unpublished English/Hindi drafts and never publishes automatically. Contact messages are personal data; review the 90-day retention and deletion process before enabling. A disclaimer alone does not establish BCI compliance.
