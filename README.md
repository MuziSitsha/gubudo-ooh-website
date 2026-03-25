# gubudo-ooh-website

Landing page and admin dashboard for converting delivery riders into GUBUDO OOH participants.

## Files

- index.html: Vite entry for the React landing page.
- admin.html: Simple admin dashboard that remains a standalone panel.
- config.js: Public configuration for Typeform, Supabase, OTP, admin allow-list, optional localhost admin bypass, notifications, and Supabase Storage.
- src/: React landing page source code.
- supabase/schema.sql: Database schema with protected admin read/update policies, traffic-potential tagging, and minimum-standard fields.
- supabase/functions/notify-signup/index.ts: Edge Function relay for outbound email, webhook, SMS, and WhatsApp notifications.

## Setup

1. Run `npm install`.
2. Edit `config.js` and add your real Typeform form ID.
3. Create a Supabase project, enable Phone Auth for OTP, and create a public storage bucket for rider photos.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Create at least one admin user in Supabase Auth and add that email to `config.js` under `admin.allowedEmails`.
6. Deploy the `notify-signup` Edge Function and configure its provider secrets if you want outbound alerts.
7. For dedicated SMS or WhatsApp alerts, add Twilio secrets and sender/recipient values to the function environment.
8. Copy your Supabase project URL, anon key, and storage bucket name into `config.js`.
9. Start the React frontend with `npm run dev`.
10. Open `admin.html` and sign in with the approved admin account.

## Local Admin Bypass

For local development only, `config.js` includes `admin.localDevBypass`. When it is `true`, the admin dashboard opens on `localhost` without Supabase auth so you can inspect the UI quickly. This bypass does not activate on non-local hosts.

## Important Note

The public website now runs in React while preserving the established color system and layout. The landing page verifies rider phone numbers with OTP before opening Typeform, enforces a minimum bike standard before submission, stores bike images in Supabase Storage, and syncs the admin dashboard through Supabase.

## Security Note

The included Supabase SQL policies now allow inserts from the public site but restrict reads and updates to authenticated admins. For production, also tighten storage access, create dedicated admin roles, and keep the notification provider secrets only inside the deployed Edge Function.
