# Fix the live truck-logo site

**Exact repository:** https://github.com/macv0223/psalm-23-trasnportation  
**Exact website:** https://macv0223.github.io/psalm-23-trasnportation/

The existing live root `index.html` still refers to the old cross logo. The
existing `dist/index.html` already includes the truck. GitHub Pages is serving
the outdated root copy. This package fixes both copies.

## The quick fix (fewest steps)

1. Download the separate **`Psalm23-TRUCK-HOMEPAGE-HOTFIX.zip`** file.
2. Extract it. It includes the updated `index.html`, the matching `assets/site.css`, the truck image and favicon under `assets/`, and the corrected admin and CMS settings.
3. Open the repo on GitHub, on its **main** branch. Choose **Add file → Upload files**,
   and upload **all extracted files and folders**, including `index.html`, `assets/`, `admin/`, `content/`, and `cms/`, **to the repository root**.
   Confirm the resulting files are `index.html` (not `dist/index.html`) and
   `assets/uploads/psalm23-truck-logo.png`. Commit to main.
4. Open **Settings → Pages**. If publishing from a branch, choose **main / (root)**.
   Wait for publishing, then check the website in a fresh tab.

## Full update (recommended)

1. Extract **`Psalm23-Truck-Corrected-FULL-Repository.zip`** on your computer.
2. Go to the same existing repo (`psalm-23-trasnportation`, with the typo).
3. Upload **the files and folders inside the extracted ZIP to the repo root**,
   allowing the new files to replace their old versions. Do **not** create a
   second repo or put everything inside another folder.
4. Confirm that GitHub shows the **root** `index.html` and
   `assets/uploads/psalm23-truck-logo.png`. Don't confuse this with
   the `dist/index.html` copy.
5. Existing cross pictures can be safely deleted from `assets/uploads/`,
   `public/assets/uploads/`, and `dist/assets/uploads/` if they remain online;
   the site no longer references them.
6. Publish via **Settings → Pages → main / (root)** to verify the fix.
7. For future auto-publishing after CMS edits, the file
   `.github/workflows/pages.yml` must actually exist on GitHub.
   Hidden folders sometimes do not upload via drag-and-drop. If necessary,
   on GitHub choose **Add file → Create new file** and enter the path
   `.github/workflows/pages.yml`, then paste the included workflow file content.
   After that, set **Settings → Pages → Source → GitHub Actions**.
8. The CMS login still requires a configured Cloudflare OAuth Worker and GitHub
   OAuth app. `cms/setup.json` and `cms/oauth/wrangler.toml` target the correct
   GitHub repository but the OAuth endpoint is intentionally not invented.

### How to confirm

- The homepage header, hero panel and Story section display the jigsaw-pattern truck.
- The hero includes the words “Moving. With purpose.”
- The ribbon says “PUTTING THE PIECES TOGETHER, FROM PICKUP TO DELIVERY.”
- Neither the old puzzle cross artwork nor the generic illustration appear.

GitHub Pages may take a few minutes after a commit; Ctrl+Shift+R can refresh.
This file fixes code on disk only; it does not claim the repository is already updated.
