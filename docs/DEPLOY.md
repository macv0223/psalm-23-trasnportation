# Publish the new Psalm 23 Transportation site

Target repository: **https://github.com/macv0223/psalm-23-trasnportation**  
Target website: **https://macv0223.github.io/psalm-23-trasnportation/**

## Publish the complete website

1. Download and **extract** the ZIP named `Psalm23-Reference-Layout-GitHub-READY.zip`.
2. Sign in as `macv0223` and open the repository above.
3. Switch to the `main` branch. Choose **Add file → Upload files**.
4. Upload the **contents** of the extracted folder, not the enclosing folder or the ZIP itself. Include the hidden `.github/` folder. Your repository root should contain `index.html`, `assets/`, `content/`, `public/`, `admin/`, `scripts/`, `dist/`, `cms/`, `.github/`, and `package.json`.
5. Commit the changes directly to `main`.
6. For the quickest initial deployment, go to **Settings → Pages → Build and deployment** and choose **Deploy from a branch** with `main` / `/(root)`.
7. Give GitHub Pages time to publish. Open the website above and, if needed, hard-refresh with **Ctrl + Shift + R**.

**For ongoing CMS publishing:** Switch the Pages source to **GitHub Actions**, then run the **Publish Psalm 23 Transportation website** workflow from the repository's **Actions** tab. The included `.github/workflows/pages.yml` rebuilds all pages from `content/site.json` and publishes `dist/` after each push to `main`. If you stay with branch deployment, edited JSON alone cannot update the static homepage; rebuild locally with `npm run build` and commit the generated files.

Do not upload the site to `macv0223/Psalm23` or the Thrive PTO repository. They are separate projects.

## Connect the editor when ready

The editor is at `/admin/`. **Uploading the files does not automatically enable sign-in.** To enable authorized publishing:

1. Create a GitHub OAuth application with its callback URL pointing to the Cloudflare authentication Worker `/callback` endpoint.
2. Deploy `cms/oauth/worker.mjs` using `cms/oauth/wrangler.toml`. Use the actual `https://macv0223.github.io` origin and repository `macv0223/psalm-23-trasnportation`, and list approved GitHub usernames in `ALLOWED_USERS`.
3. Configure Worker secrets `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` and `SESSION_SECRET` without committing them to GitHub. Set `AUTH_ORIGIN` to the exact worker HTTPS origin.
4. Set `CMS_OAUTH_ORIGIN` in the GitHub repository's **Settings → Secrets and variables → Actions → Variables** to the exact HTTPS worker origin, or set `cms/setup.json` → `oauthOrigin` and rebuild.
5. Configure Pages source to GitHub Actions, run the workflow, then verify that approved editors can sign in and publish a test content change.

The CMS intentionally ships with an empty `oauthOrigin`. Do not interpret the presence of `/admin/` as proof that login is already enabled.

## Contact behaviour

The live number is **281-766-1320** and the email is **Psalm23Transportation@yahoo.com**. Visitors may call, text, email, or prepare a quote request. The form opens their messaging app with a draft, not a stored or automatically transmitted message.
