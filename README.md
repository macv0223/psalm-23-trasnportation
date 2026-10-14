# Psalm 23 Transportation — Truck Logo Edition (fixed)

This is the **truck-logo version** for the **existing** GitHub repository
[`macv0223/psalm-23-trasnportation`](https://github.com/macv0223/psalm-23-trasnportation).

Live website: https://macv0223.github.io/psalm-23-trasnportation/

The spelling `trasnportation` matches the live GitHub repository exactly.

## Corrected

The repository previously had a stale cross-based `index.html` in its root even though `dist/index.html` and `content/site.json` were truck-based. `npm run build` now keeps `index.html`, `assets/`, `admin/`, and `data/` in sync with `dist/`.

- Your supplied transparent bronze and forest-green jigsaw truck is the only vehicle graphic.
- The hero places the truck over a simple road made with CSS (no other truck picture).
- The header, footer, story panel and favicon all use the truck image.
- The restored puzzle-themed wording includes **“Putting the pieces together, from pickup to delivery.”**
- The business's Christian family values, contact details, and message-based quote form are retained.
- The editable backend's repository and site URL now match the actual repo.
- Unused cross assets and the generic truck illustration are removed.

## Publishing and editing

Follow [the exact upload instructions](docs/UPLOAD-FIX.md).

`npm run verify` runs tests, builds the site, synchronizes the root website, and validates the resulting files.

For ongoing CMS publishing, upload `.github/workflows/pages.yml` and switch
**Settings → Pages → Source** to **GitHub Actions**. GitHub OAuth / Cloudflare Worker
editor sign-in still needs administrator configuration; merely uploading the
files does not activate authenticated editing.

This version does not change the original cross-logo repository (`macv0223/Psalm23`).
