# Psalm 23 Transportation - EMAIL-ONLY online quote notifications (v9)

No Twilio, SMS sender, or paid text messaging account is needed. Yahoo Mail mobile push notifications can alert the recipient when the message arrives.

## Services and current configuration

- Public website: `https://psalm23transportation.com` hosted on GitHub Pages (unchanged).
- Secure quote Cloudflare Worker: `https://psalm23-quote-notifications.macv0223.workers.dev`.
- Email delivery: Resend, already verified for `psalm23transportation.com`.
- Recipient: `Psalm23Transportation@yahoo.com`.
- Cloudflare Turnstile: validates form submissions. Keep secret key private.
- Existing CMS OAuth Worker: `cms/oauth/worker.mjs` (untouched).

## Step 1: replace the existing quote Worker code

1. In Cloudflare Dashboard open **Workers & Pages** > `psalm23-quote-notifications` > **Edit code**.
2. Open `cms/quotes/worker.mjs` from this package, copy all text and replace the contents of Cloudflare's `worker.js` editor tab.
3. Click **Deploy** and wait for it to show Active/Ready.
4. Visit `https://psalm23-quote-notifications.macv0223.workers.dev/health`.
5. Expected response: `{"service":"psalm23-quotes","channel":"email","ready":true}` when the five required settings are present. `ready:true` verifies the configuration, not a test delivery.

Existing Cloudflare Worker settings:

| Key | Type | Value | Keep? |
|---|---|---|---|
| `ALLOWED_ORIGINS` | Variable | `https://psalm23transportation.com,https://www.psalm23transportation.com,https://macv0223.github.io` | Yes |
| `QUOTE_TO_EMAIL` | Variable | `Psalm23Transportation@yahoo.com` | Yes |
| `RESEND_FROM` | Variable | `Psalm 23 Transportation <quotes@psalm23transportation.com>` | Yes |
| `RESEND_API_KEY` | Secret | Existing Resend key, kept private | Yes |
| `TURNSTILE_SECRET_KEY` | Secret | Private Turnstile key | Yes |

`QUOTE_TO_PHONE` can remain as an unused ordinary variable, or you may delete it; it is ignored by v9. **Do not create any Twilio settings.**

If using Wrangler rather than the Cloudflare browser editor, deploy with `npx wrangler deploy --config cms/quotes/wrangler.toml` and ensure secrets and runtime variables are preserved.

## Step 2: activate the front-end form

After the new Worker returns `ready:true`, add two *public* values to `content/site.json` under `settings` (or to the CMS editor if it is working):

```json
"quoteApiEndpoint": "https://psalm23-quote-notifications.macv0223.workers.dev/api/quote",
"turnstileSiteKey": "YOUR_ACTUAL_PUBLIC_TURNSTILE_SITE_KEY"
```

These are public integration details, not secrets. **Never** include the Resend API key or Turnstile secret in the website repo. If the Turnstile secret was shown in a screenshot, rotate it in Cloudflare and update the Worker Secret.

Publish the updated website files to the `macv0223/psalm-23-trasnportation` GitHub repo (preserve folder structure). GitHub Pages uses the root homepage and GitHub Actions; do not publish only the README. The new site shows the quote form directly and stays on the page when customers submit it.

## Step 3: test end to end

1. On the live site, submit one real test with your email or phone, pickup/delivery and a clear test note. Complete the Turnstile security widget.
2. Confirm the site reports acceptance by the email service. It does **not** claim inbox delivery is guaranteed.
3. Check `Psalm23Transportation@yahoo.com`, including its Spam folder, and check Resend's email logs.
4. On the client's mobile device, install/login to the **Yahoo Mail app** and allow app notifications at both Yahoo settings and phone operating-system settings. An app notification is **not** a traditional SMS.
5. Test the site on a second mobile browser and desktop. The **Prepare email** and **Copy request** backups remain available.
6. If email sending fails, the form displays an error and advises using the email backup or calling.

No customer submissions are stored in the GitHub repository. Credentials are kept on the Worker. Rate limits depend on current Cloudflare and Resend free plans; monitor usage in their dashboards.
