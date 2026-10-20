# v7: Mobile hero headline positioning

The single CMS-editable headline (the eyebrow, HE LEADS., WE HAUL.) is displayed over the **left dark region** of the existing truck-and-cross hero photograph on screens up to 640px.

The introductory paragraph, quote and call buttons, and puzzle-themed tagline stay immediately below the artwork. Screens wider than 640px keep their existing positioning.

Implementation: CSS-only positioning in `public/assets/site.css`, compiled into the root and `dist/index.html` by `npm run build` to protect against stale browser stylesheets. **Do not edit only the generated `index.html`: edit the CSS source and rebuild.**

Publishing: upload **all contents** of the GitHub ZIP to the root of the existing `macv0223/psalm-23-trasnportation` repository on `main`; preserve `.github/workflows/pages.yml`, `CNAME`, and the `public`, `content`, `scripts`, and `tests` directories. Never upload an enclosing folder in place of the root files.
