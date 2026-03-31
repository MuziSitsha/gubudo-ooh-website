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
3. Create a Supabase project, enable Phone Auth for OTP, connect Twilio Verify inside Supabase Auth, and create a public storage bucket for rider photos.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Create at least one admin user in Supabase Auth and add that email to `config.js` under `admin.allowedEmails`.
6. Deploy the `notify-signup`, `typeform-webhook`, and `sync-photo-uploads` Edge Functions and configure their provider secrets if you want outbound alerts and the Typeform-plus-upload flow to sync fully into Supabase.
7. For dedicated SMS or WhatsApp alerts, add Twilio secrets and sender/recipient values to the function environment.
8. Copy your Supabase project URL, anon key, and storage bucket name into `config.js`.
9. Start the React frontend with `npm run dev`.
10. Open `admin.html` and sign in with the approved admin account.

## Free Test Deployment

The simplest free shared test link for this project is Netlify because it supports Vite static sites well and can publish both pages from one URL.

1. Push the latest code to GitHub.
2. In Netlify, choose **Add new site** > **Import an existing project**.
3. Connect the `MuziSitsha/gubudo-ooh-website` repository.
4. Keep the default build command as `npm run build`.
5. Keep the publish directory as `dist`.
6. Deploy the site.

After deploy:

- User test link: `https://YOUR-SITE.netlify.app/`
- Admin test link: `https://YOUR-SITE.netlify.app/admin.html`
- Friendly admin shortcut: `https://YOUR-SITE.netlify.app/admin`

`config.js` is now copied into the production build automatically, so the deployed site keeps the same public Typeform and Supabase settings used locally.

## Local Admin Bypass

For local development only, `config.js` includes `admin.localDevBypass`. When it is `true`, the admin dashboard opens on `localhost` without Supabase auth so you can inspect the UI quickly. This bypass does not activate on non-local hosts.

## Important Note

The public website now runs in React while preserving the established color system and layout. The landing page now requires SMS OTP verification before the Typeform application opens, then shows a short upload-only step for bike photos. Those uploads are saved to Supabase and can be linked to the Typeform submission by response ID.

## OTP Setup

1. In Supabase, open Authentication > Providers > Phone.
2. Choose Twilio Verify as the SMS provider and add the Twilio Account SID, Auth Token, Verify Service SID, and sender configuration.
3. Keep `otp.enabled` set to `true` in `config.js` so the website enforces phone verification before opening Typeform.
4. Test one full cycle locally: request OTP, verify the code, submit Typeform, then confirm the resulting `rider_applications` row has `verified_phone = true` and `verified_at` populated.

For the edge functions in this repo, set these custom secrets before deploying:

`npx supabase@latest secrets set PROJECT_URL=https://telwshdnaaofhrsifjnk.supabase.co SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY`

## Email Notes

Disable Typeform email notifications if you do not want Typeform-generated response emails. The included `notify-signup` Edge Function is intended to handle the real operational email flow by sending the admin copy to the GUBUDO inbox and a confirmation email to the applicant.

## Typeform Upload Flow

The intended production flow is:

1. User opens the Typeform application from the website.
2. The website passes the verified phone metadata into Typeform hidden fields.
3. After Typeform submission, the website collects only the required bike photos.
4. The website stores those uploads in `application_photo_uploads` using the Typeform response ID.
5. The `typeform-webhook` function writes the main application into `rider_applications` and marks the phone as verified when the hidden OTP values are present.
6. The `sync-photo-uploads` function links the queued uploads into the matching `rider_applications` row.

## Security Note

The included Supabase SQL policies now allow inserts from the public site but restrict reads and updates to authenticated admins. For production, also tighten storage access, create dedicated admin roles, and keep the notification provider secrets only inside the deployed Edge Function.
