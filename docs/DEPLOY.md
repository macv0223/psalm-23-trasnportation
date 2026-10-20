# Publish the new Psalm 23 Transportation site

Target repository: **https://github.com/macv0223/psalm-23-trasnportation**  
Target website: **https://psalm23transportation.com/** (GitHub Pages custom domain)

## Publish the complete website

1. Download and **extract** the ZIP named `Psalm23-v7-Mobile-Hero-Overlay-FULL-GitHub-READY.zip`.
2. Sign in as `macv0223` and open the repository above.
3. Switch to the `main` branch. Choose **Add file → Upload files**.
4. Upload the **contents** of the extracted folder, not the enclosing folder or the ZIP itself. Include the hidden `.github/` folder. Your repository root should contain `index.html`, `assets/`, `content/`, `public/`, `admin/`, `scripts/`, `dist/`, `cms/`, `.github/`, and `package.json`.
5. Commit the changes directly to `main`.
6. Go to **Settings → Pages → Build and deployment** and select **GitHub Actions** as the publishing source. The included `.github/workflows/pages.yml` rebuilds the whole website from `content/site.json` and publishes the `dist/` output on each push to `main`.
7. Monitor **Actions** for the completed publishing workflow. Open **https://psalm23transportation.com/** and refresh after deployment.

**Important:** Never upload the ZIP itself, a parent folder, or an incomplete selection. The previous 404 was caused by the branch containing only `CNAME` after a commit that removed the website files. Before committing, verify that `index.html`, `assets/`, `content/`, `public/`, `admin/`, `scripts/`, `dist/`, and `.github/workflows/pages.yml` all appear at the repo root.

If you deliberately choose **Deploy from a branch → main / (root)** instead, keep the generated root `index.html`, `assets/`, and `admin/` files intact: editing only `content/site.json` will not refresh the deployed HTML until `npm run build` regenerates and commits it.

Do not upload the site to `macv0223/Psalm23` or the Thrive PTO repository. They are separate projects.

## Connect the editor when ready

The editor is at `/admin/`. **Uploading the files does not automatically enable sign-in.** To enable authorized publishing:

1. Create a GitHub OAuth application with its callback URL pointing to the Cloudflare authentication Worker `/callback` endpoint.
2. Deploy `cms/oauth/worker.mjs` using `cms/oauth/wrangler.toml`. Use the deployed website origin `https://psalm23transportation.com` and repository `macv0223/psalm-23-trasnportation`, and list approved GitHub usernames in `ALLOWED_USERS`.
3. Configure Worker secrets `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `SESSION_SECRET` without committing them to GitHub. Set `AUTH_ORIGIN` to the exact worker HTTPS origin.
4. Set `CMS_OAUTH_ORIGIN` in the GitHub repository's **Settings → Secrets and variables → Actions → Variables** to the exact HTTPS worker origin, or set `cms/setup.json` → `oauthOrigin` and rebuild.
5. Configure Pages source to GitHub Actions, run the workflow, then verify that approved editors can sign in and publish a test content change.

The CMS intentionally ships with an empty `oauthOrigin`. Do not interpret the presence of `/admin/` as proof that login is already enabled.

## Contact behaviour

The live number is **281-766-1320** and the email is **Psalm23Transportation@yahoo.com**. Visitors may call, text, email, or prepare a quote request. The form opens their messaging app with a draft, not a stored or automatically transmitted message.


## v8 — Direct online quote requests (email only)

See [ONLINE-QUOTE-NOTIFICATIONS.md](ONLINE-QUOTE-NOTIFICATIONS.md) for the separate Cloudflare notification Worker, Resend email, Turnstile protection, and activation instructions. The form button stays disabled until the public endpoint and site key are set; credentials belong only in Worker secrets.
