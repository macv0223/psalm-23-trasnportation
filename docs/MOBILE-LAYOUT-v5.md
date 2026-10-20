# Mobile layout and publication — Version 5.0

This release preserves the approved black-and-gold desktop design and existing editable CMS while addressing the mobile layout issues shown in the client screenshots.

## Changes

- Mobile hero: panoramic truck scene is displayed immediately under the header, fully visible rather than below a tall black area. Editable heading, intro and action buttons follow. Desktop hero retains its original split composition.
- Mobile header: appropriately sized transparent logo, menu and quote button; shortened utility text; accessible 44px menu links.
- Mobile commitments and service/process cards: consistent spacing and tighter alignment.
- Mobile quote form: one-column locations, larger input text and touch-friendly controls.
- Mobile footer: dedicated logo row, flexible navigation row and clearly separated contact links.
- Custom-domain support: `public/CNAME` ensures a custom-domain CNAME file is present in the GitHub Pages artifact.
- Existing cache fix: the generated homepage embeds its matching stylesheet and JavaScript, preventing old green styling from being loaded.

## How to publish

The ZIP has no enclosing folder. Upload all extracted contents at the repository root in `macv0223/psalm-23-trasnportation` on `main`, preserving `.github` and `public` directories.

Under GitHub Settings > Pages, use `GitHub Actions`; check deployment under Actions. It should publish to https://psalm23transportation.com once DNS and custom domain HTTPS are configured.

Editing page content still requires the existing Decap CMS GitHub OAuth setup.
