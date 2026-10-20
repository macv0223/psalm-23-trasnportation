# Launching Psalm 23 Transportation — Truck Logo Version

This guide is designed for the site owner. **The website is already built locally.** Follow these steps to put it online and enable a separate, password-protected-by-GitHub editor. This is a new, standalone website; it will not change the Thrive PTO website.

## Before you start

You need a GitHub account, a Cloudflare account for its free Worker, and access to a dedicated domain if you want a custom address. Every person who edits the site must have an approved GitHub account. You do **not** need a credit card for GitHub Pages hosting or to build this website; provider eligibility and limits may change, so confirm the current free-tier terms at setup time.

## Part 1 — Create a separate GitHub repository for this version

1. Sign in to GitHub as `macv0223`. Open your EXISTING public repository with default branch `main` at `https://github.com/macv0223/psalm-23-trasnportation`. Leave the original `Psalm23` cross-logo repository unchanged.
2. Extract `Psalm23-Truck-v1.1-Puzzle-Copy-GitHub.zip` **before** uploading. Use **Add file → Upload files** and upload the files and folders inside the ZIP into the repository **root**. confirm that `index.html`, `assets/`, `public/`, `content/`, `scripts/`, `cms/`, and the hidden `.github/workflows/pages.yml` have been included. If the GitHub web uploader cannot replace a file, commit its replacement through GitHub Desktop instead. Do not upload the ZIP file itself as a lone file.
3. Commit the files on `main`. Leave both the original `macv0223/Psalm23` and Thrive PTO repositories untouched.
4. To publish the mirrored root site immediately, open **Settings → Pages → Build and deployment → Source**, select **Deploy from a branch**, choose `main` and `/(root)`, then save. Check `https://macv0223.github.io/psalm-23-trasnportation/` after GitHub Pages finishes publishing.
5. **For CMS edits to publish automatically**, change **Settings → Pages → Source** to **GitHub Actions**, open **Actions → Publish Psalm 23 Transportation — Truck Logo Version website**, and run the workflow (or allow it to run on push). This method rebuilds the website from `content/site.json` after each published edit. The Workflow only works if `.github/workflows/pages.yml` was successfully uploaded.
6. Check desktop/mobile rendering, the puzzle-pattern truck artwork, phone and email links, and the quote form. The admin workspace at `/admin/` remains disconnected until Parts 2–4 have been completed.

The included config targets the existing truck-logo repository (`macv0223/psalm-23-trasnportation`) and the approved logo is included locally; no previous external logo URL is needed.

## Part 2 — Make a secure login endpoint on Cloudflare

1. Sign in to Cloudflare. Open **Workers & Pages → Create → Worker** (wording may vary).
2. Choose a name such as `psalm-23-transportation-auth` and deploy the blank worker to get its exact public **`https://...workers.dev`** URL.
3. Replace the worker's JavaScript with the complete code from `cms/oauth/worker.mjs`, or deploy using Wrangler from the `cms/oauth/` directory. **If using the Cloudflare dashboard, copy the Worker source, not the public website HTML.**
4. Set Worker **Variables** (not secrets):

   | Variable | Example | Notes |
   | --- | --- | --- |
   | `CMS_ORIGIN` | `https://macv0223.github.io` | Exact origin of the *live editor*, without `/repo/` or a trailing slash. Use your custom domain origin if the editor lives there. |
   | `AUTH_ORIGIN` | `https://psalm-23-transportation-auth.YOURSUBDOMAIN.workers.dev` | Exact Cloudflare Worker origin, no trailing slash. |
   | `REPOSITORY` | `macv0223/psalm-23-trasnportation` | Your real GitHub repository. |
   | `PRIVATE_REPOSITORY` | `false` | Set `true` only for private repository installations supported by your GitHub Pages plan. |

5. Add your editor allowlist as **Worker Secrets**:
   - `ALLOWED_USERS` — comma-separated GitHub usernames, for example `siteowner,assistant`.
   - Optionally `ALLOWED_ADMIN_EMAILS` — comma-separated **verified email addresses associated with GitHub accounts**. Use this instead of usernames when matching a verified email matters. If you use email-based approval, GitHub will ask for email-reading permission.
   - At least one allowlist must be configured. Keep all approved accounts narrow.

6. Save and deploy the Worker. It is **expected** to report a not-configured error until its OAuth app credentials are added in Part 3.

**Important:** `workers.dev` is the API/login domain; your public GitHub Pages site is normally hosted at `github.io`, *not* `pages.dev`. Do not substitute one address for another. The two origins are separate by design.

## Part 3 — Create a GitHub OAuth app

1. On GitHub select your profile photo → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Choose `Psalm 23 Transportation — Truck Logo Version Website Editor` as the application name.
3. Set **Homepage URL** to your live site, e.g. `https://macv0223.github.io/psalm-23-trasnportation/`.
4. Set **Authorization callback URL** to your exact Cloudflare Worker URL **plus `/callback`**, e.g. `https://psalm-23-transportation-auth.YOURSUBDOMAIN.workers.dev/callback`.
5. Create the app. Copy **Client ID** and generate a **Client Secret**.
6. In Cloudflare, add these as **Worker Secrets**, never directly in the repository:
   - `GITHUB_CLIENT_ID` — the OAuth app's client ID.
   - `GITHUB_CLIENT_SECRET` — the OAuth app's client secret.
   - `SESSION_SECRET` — a long, random, unique value **at least 32 characters** (for example, created with a password generator). Do not reuse an account password.
7. Save and deploy the Worker. GitHub tokens are checked against the explicit user allowlist *and* the user's permission to push to this repository.

### Allow editors to make changes

In your new repository, open **Settings → Collaborators and teams** and grant each approved editor appropriate repository write access. They must also appear in the Worker's allowlist. If someone is on only one of those two lists, they cannot edit.

The Decap CMS editor uses an **editorial workflow**: changes can be drafted and reviewed before publication. To enforce *admin-only publishing*, configure GitHub branch protections or a `main` branch ruleset that restricts who can merge. Without a rule, anyone with repository write access may be able to push directly to `main` outside the CMS.

## Part 4 — Connect the website editor to the Worker

1. On the GitHub repository, open **Settings → Secrets and variables → Actions → Variables → New repository variable**.
2. Create `CMS_OAUTH_ORIGIN` with **only** the Worker origin, e.g. `https://psalm-23-transportation-auth.YOURSUBDOMAIN.workers.dev` (**no** `/auth`, **no** `/callback`).
3. Go to **Actions** and rerun the website publish workflow. The GitHub Actions build automatically fills in the repository name and site URL. It does not store any client secrets in the published site.
4. Visit `https://macv0223.github.io/psalm-23-trasnportation/admin/` or `https://YOURDOMAIN/admin/` when a custom domain is active.
5. Select **Sign in to edit with GitHub**, grant the requested access, and check that the editor shows **Edit website → All website content**.
6. Make a small test change and save it as a draft. Preview it, then publish. Confirm the GitHub action succeeds and the public website updates.
7. Test an **unapproved** GitHub account too. It should be denied access.

**If OAuth fails:** Confirm the GitHub callback URL matches the Worker URL exactly; Worker `AUTH_ORIGIN` matches the Worker host; `CMS_ORIGIN` matches the website address's origin; `CMS_OAUTH_ORIGIN` is set in GitHub Actions variables; the editor has a correct GitHub account, approved username or verified email, and write access; and all three secrets were configured on the Cloudflare Worker.

## Part 5 — Confirm the puzzle-pattern truck and check the quote form

1. The approved bronze-and-forest-green jigsaw-pattern truck artwork is bundled locally and displayed in the navigation, homepage, story panel, footer, favicon, and editor. It does not link to the original site.
2. If the owner later changes the brand, open **Branding & contact details → Primary jigsaw-pattern truck logo** in the CMS and upload the approved replacement. Include an accessible image description.
3. Update the telephone, email, and any wording the business owner approves. Do not invent insurance, licenses, capacity, or routes.
4. Make a test quote request on a phone, review that it opens the messaging app with the correct number and details, and **send only a deliberate test message**. On a desktop, use the **Copy request** or **Email instead** options.
5. Confirm the business actually receives the message and responds. The website itself does not store quote submissions.

## Optional — Add a custom domain and HTTPS

1. Obtain the business's domain and connect it using **GitHub → Settings → Pages → Custom domain**.
2. Follow GitHub's current DNS instructions at your domain registrar. Use appropriate `A`/`AAAA` records for an apex domain or `CNAME` for `www`. Never copy DNS values from another business's setup without checking them.
3. Once DNS propagates and a certificate is issued, enable **Enforce HTTPS** in GitHub Pages.
4. Set the Worker's `CMS_ORIGIN` to the **custom domain origin** (for example `https://www.example.com`) and redeploy.
5. Add GitHub Actions repository variable `SITE_URL` as the complete public site URL, including `https://` (and a trailing slash if appropriate), then rerun the publisher.
6. Update the GitHub OAuth app Homepage URL if needed. Its callback URL remains your **Worker URL plus `/callback`** unless you deliberately change that Worker host.
7. Retest sign-in and editor publishing after the domain changes. The browser's effective origin must agree with `CMS_ORIGIN`.

GitHub Pages cannot host your Cloudflare OAuth Worker for you; this is intentionally a separate service. You may optionally place the Worker behind a custom domain, but update `AUTH_ORIGIN`, GitHub OAuth callback and GitHub variable together if you do.

## Editing after launch

Visit `/admin/editor-guide.html` for everyday instructions. Version history is available in GitHub for `content/site.json` and via `/admin/history.html`; restoring an earlier published version requires a GitHub revert/merge performed by an authorized repository administrator (not a fictional one-click restore).

## Security and maintenance

- Every editor account needs its own GitHub login; do not share passwords or tokens.
- Delete access for former editors in both the GitHub repository and Cloudflare Worker allowlist.
- Never embed `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, private email lists, or tokens in source files.
- GitHub's OAuth `public_repo` scope is broader than this single repository; the Worker checks the approved target repository before allowing sign-in, but the resulting OAuth token retains its GitHub scope. Review authorization implications with editors.
- Keep dependencies and Worker's SDK/current browser behaviour under review as services update. The CMS editor currently loads a pinned Decap build from the unpkg CDN.
- Restore from GitHub commit history or pull request review if a content update introduces a mistake.
- The build tests do not substitute for an end-to-end test of the live GitHub OAuth, Cloudflare permissions, CDN availability, or a real visitor's SMS application.


## v8 — Direct online quote requests (email + SMS)

See [ONLINE-QUOTE-NOTIFICATIONS.md](ONLINE-QUOTE-NOTIFICATIONS.md) for the separate Cloudflare notification Worker, Resend email, Twilio SMS, Turnstile protection, and activation instructions. The form button stays disabled until the public endpoint and site key are set; credentials belong only in Worker secrets.
