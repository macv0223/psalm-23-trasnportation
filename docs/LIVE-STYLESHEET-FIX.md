# Broken website styling — cause and fix

The previously published black-and-gold HTML could be paired with an obsolete **green** `assets/site.css` from the earlier website.
That mismatch reproduces the owner's screenshot: huge telephone, mail, shield, cross, arrow, and truck SVGs; pale backgrounds; tiny unstyled text; and distorted content.

## How this release prevents recurrence

`npm run build` embeds **the current** `public/assets/site.css` and `public/assets/app.js` into `index.html` and `dist/index.html`. Both GitHub Pages publishing modes receive exactly the same self-contained page. The browser no longer needs to download the formerly collision-prone CSS and JavaScript from their old URL paths.

The original standalone CSS/JS files remain in the repository as sources, for maintenance and future changes. CSS background fallbacks have been updated to reflect the new inline-stylesheet URL resolution.

## Publish

1. Extract the GitHub-ready ZIP and upload the **contents** to the root of `macv0223/psalm-23-trasnportation`. Include `scripts/build.mjs`, `public/assets/site.css`, `index.html`, and the corresponding source files.
2. Commit to `main`. Under GitHub Actions, confirm **Publish Psalm 23 Transportation website** completes successfully.
3. Open the Pages URL in a fresh/incognito browser tab. A hard refresh (Ctrl+Shift+R) can help if an older HTML page is still cached.
4. Verify the page stays black and gold and all icons are regular-sized.

The editor's Cloudflare OAuth setup is independent from this fix and remains unconfigured unless the owner has since connected it.
