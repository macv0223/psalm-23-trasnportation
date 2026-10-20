# Psalm 23 Transportation — automatic quote email + SMS setup

## What changes for customers

When activated, **Send Quote Request** sends the form to a secure Cloudflare Worker. The Worker verifies a Cloudflare Turnstile challenge, then sends the detailed quote to **Psalm23Transportation@yahoo.com** (Resend) and queues a concise SMS alert to **+1 281-766-1320** (Twilio). Visitors no longer need to open their phone's Messages app to submit a quote. They can still use *Prepare email instead*, *Copy request*, or the direct call/text links as alternatives.

**Important:** This package contains the code, not the private service accounts. The online submit button is intentionally disabled until its Cloudflare Worker URL and public Turnstile site key are configured. Never claim an email or SMS was sent until the Worker has been deployed and provider responses were confirmed.

## Required services

- A Cloudflare account for the **new quote-notifications Worker**, plus **Turnstile**. This worker is separate from the *existing* `cms/oauth/worker.mjs` that handles editor login. Do not overwrite the login worker.
- **Resend** to send the email. Verify `psalm23transportation.com` with Resend and create an API key. Use a verified sender such as `Psalm 23 Transportation <quotes@psalm23transportation.com>`. The destination remains the client's Yahoo address; it does **not** require moving their Yahoo mailbox to a new provider. Add only the DNS records Resend specifically requests, without deleting GitHub Pages or Yahoo-related DNS records.
- **Twilio** for the business SMS alert. You need Twilio account credentials and an approved SMS sender number or Messaging Service. The sender number is **not** the client's existing `281-766-1320` unless that number is separately provisioned for programmable SMS. The client's existing number is the **recipient**. US A2P 10DLC registration (or suitable verified toll-free option) may be required before SMS is delivered. SMS and sender-number charges apply.

## Step 1 — Deploy the separate notification Worker

From the **repository root**, with Node installed and Cloudflare authenticated:

```bash
npx wrangler login
npx wrangler deploy --config cms/quotes/wrangler.toml
```

The output will include a URL similar to:

`https://psalm23-quote-notifications.YOUR-CLOUDFLARE-SUBDOMAIN.workers.dev`

The API URL for the website will end in `/api/quote`, for example:

`https://psalm23-quote-notifications.YOUR-CLOUDFLARE-SUBDOMAIN.workers.dev/api/quote`

No GoDaddy nameserver or GitHub Pages change is needed to use a `workers.dev` endpoint. Do not create an invented URL — use the URL Cloudflare actually gives you.

## Step 2 — Store private API credentials securely in Cloudflare

Run these commands one at a time. Each command prompts you for a value. Do not add keys to GitHub files, the CMS, or public client JavaScript.

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --config cms/quotes/wrangler.toml
npx wrangler secret put RESEND_API_KEY --config cms/quotes/wrangler.toml
npx wrangler secret put RESEND_FROM --config cms/quotes/wrangler.toml
npx wrangler secret put TWILIO_ACCOUNT_SID --config cms/quotes/wrangler.toml
npx wrangler secret put TWILIO_AUTH_TOKEN --config cms/quotes/wrangler.toml
npx wrangler secret put TWILIO_FROM_NUMBER --config cms/quotes/wrangler.toml
```

For Twilio Messaging Services, you can instead set `TWILIO_MESSAGING_SERVICE_SID` rather than `TWILIO_FROM_NUMBER`.

The non-secret destination values are in `cms/quotes/wrangler.toml`:

- `QUOTE_TO_EMAIL = "Psalm23Transportation@yahoo.com"`
- `QUOTE_TO_PHONE = "+12817661320"`

`ALLOWED_ORIGINS` already includes the canonical domain, `www`, and the GitHub Pages preview hostname. Update only if you change the site host.

After secrets are set, check `https://<your-worker>.workers.dev/health`. It should return `{"service":"psalm23-quotes","ready":true}` when the required credentials are present. This reports **configuration only**, not that emails/SMS have been tested or delivered.

## Step 3 — Cloudflare Turnstile

In Cloudflare **Turnstile**, create a widget for:

- `psalm23transportation.com`
- `www.psalm23transportation.com`
- `macv0223.github.io` (only if also testing on the GitHub Pages URL)

Copy the **site key** (public) into your website's editable content. The **secret key** belongs **only** in the Cloudflare Worker secret set in Step 2. The server validates every token against Cloudflare Siteverify and checks its hostname and `quote_request` action. Expired/duplicate tokens are rejected.

## Step 4 — Activate the website form

The same two public values can be edited in `/admin/` if the existing GitHub CMS login is configured. Otherwise, edit `content/site.json` directly:

```json
"quoteApiEndpoint": "https://YOUR-REAL-WORKER.workers.dev/api/quote",
"turnstileSiteKey": "YOUR_PUBLIC_TURNSTILE_SITE_KEY"
```

These fields are nested under `"settings"`, alongside the business phone and email. Save, commit to `main`, then allow GitHub Pages to rebuild and republish. The online **Send Quote Request** button automatically becomes active when *both* fields are filled in correctly. Its server credentials are never present in the website or GitHub repository.

## Step 5 — Test before announcing it is live

1. Visit `https://psalm23transportation.com` after GitHub Pages publishes. Load an incognito window if you previously cached old pages.
2. Complete the form with a real return email address or phone number. Fill name, pickup, delivery and items. Complete the Turnstile challenge.
3. Click **Send Quote Request**. It should remain on the website, show `Sending securely…`, then confirm the gateway results. It should **not** open the phone's SMS app.
4. Check the Yahoo mailbox for the full quote and the business phone for the SMS alert. Check the Resend and Twilio provider logs as needed. An accepted gateway response does not guarantee eventual inbox/carrier delivery.
5. Test on a phone and desktop. Check `Prepare email instead` and `Copy request` as backups.

If one channel fails, the site reports a **partial delivery** instead of claiming full success. It asks the visitor not to resubmit the same quote blindly, avoiding duplicates. A server-side Turnstile check, strict allowlist, honeypot, input limits and provider credential storage help protect against spam and billing abuse.

## Developer notes

- Frontend: `public/assets/render.js` and `public/assets/app.js`. The build embeds CSS and JS in `index.html` to avoid the previous cached-style mismatch.
- Worker: `cms/quotes/worker.mjs`, deployed with `cms/quotes/wrangler.toml`.
- Existing CMS OAuth Worker: `cms/oauth/worker.mjs` — unchanged.
- Build: `npm run verify`. Test browser layout and interactive quote form with `python scripts/e2e-local.py`.
- Direct SMS `/sms:` URL remains a normal **contact link**, not the form submission handler.
- No visitor submissions are stored in the public repo. The email and SMS providers process the fields to deliver them to the client.
