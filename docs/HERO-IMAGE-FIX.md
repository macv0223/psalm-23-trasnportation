# Homepage hero image correction

## Correct asset

The homepage hero uses `assets/uploads/psalm23-quote-section-bg.webp`.

This image already existed in the prior repository. It shows a white flatbed hauling truck, illuminated mountains, a cross, and an orange sunset, with deliberately empty dark space for the headline on the left. It contains **no text** baked into the image.

## Where the code is updated

- `content/site.json` -> `hero.heroImage`: the editable single source of truth
- `public/assets/render.js`: fallback image and preload hint use the same asset
- `index.html` and `dist/index.html`: generated homepage references the clean scene
- `data/site.json` and `dist/data/site.json`: generated content for previews
- `scripts/check.mjs` and `tests/site.test.mjs`: prevent a regression to the text-bearing artwork

The older `psalm23-home-hero-banner.webp` remains in assets for reference but is **not used** as the hero image. Do not use the original client banner with the business name and tagline baked into the pixels behind live HTML headings.

The same background asset is also used subtly in the contact/quote section. This deliberate reuse does not add another truck to the hero.

## Publish

Upload the contents of the **GitHub-ready ZIP** (not the enclosing ZIP file) to `macv0223/psalm-23-trasnportation`, keeping `index.html` at the repository root. GitHub Pages can publish from `main` > `/(root)`, or the included GitHub Actions workflow can rebuild and publish the site. The CMS requires separate Cloudflare OAuth configuration before remote editing is available.
