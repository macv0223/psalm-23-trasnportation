# Psalm 23 Transportation — Black & Gold Website (v8.0 — Online Quote Notifications)

A complete, responsive implementation of the approved **black-and-gold reference layout**. The cards, headings, text, navigation, images, quote form and editor are actual website elements rather than a flattened screenshot.

**Repository:** `macv0223/psalm-23-trasnportation`  
**Site:** https://macv0223.github.io/psalm-23-trasnportation/  
**Editor path:** `/admin/` (requires Cloudflare/GitHub OAuth setup).

> The spelling `trasnportation` is intentional: it matches the repository that already exists. Do not correct it without renaming the repository and updating all site settings.

## Layout recreated

1. Narrow gold-divider information bar with faith statement, telephone and email.
2. Black masthead with the **new transparent gold Logo 1** and a gold quote button.
3. Scenic truck-and-mountains hero with **HE LEADS. / WE HAUL.**, a call button and a quote button.
4. Four commitment tiles, including support for the autism community.
5. Three independently editable, gold-bordered services cards.
6. The circular Logo 2 emblem in the **Built on faith / Driven by care** section.
7. **From pickup / To delivery** with three boxed process steps.
8. Secure direct quote request integration with email + SMS business alerts (requires provider setup); phone, email and copy alternatives remain available.
9. Compact brand/navigation/contact footer.

The scenic hero backdrop is a cleaned, right-side crop of the approved reference image, so the old banner's embedded wordmark **does not appear underneath the editable hero heading**. The full original five artwork files remain inside `client-artwork-originals/` and the web-ready source assets remain in `public/assets/uploads/`.

## Important files

- `content/site.json`: single authoritative content file, edited by the Decap CMS.
- `public/assets/render.js`: accessible HTML template and CMS content validation.
- `public/assets/site.css`: all responsive styling.
- `public/assets/app.js`: navigation, direct secure quote submission, and backup email/copy actions.
- `public/assets/uploads/`: logo, hero, circular faith emblem, original and supplementary graphics.
- `public/admin/`: browser CMS/preview.
- `cms/oauth/`: Cloudflare Worker authentication source (no secrets included).
- `cms/quotes/`: separate Cloudflare notification Worker using Resend and Twilio; credentials are **never committed**.
- `.github/workflows/pages.yml`: deployment workflow.
- `index.html` and `dist/`: generated, GitHub Pages-ready website.
- `docs/DEPLOY.md`: deployment and admin setup instructions.
- `docs/ARTWORK.md`: image attribution and layout mapping.
- `docs/REFERENCE-LAYOUT.md`: layout specifications and fidelity notes.

## Verify before uploading

Requires **Node.js 22 or later**, with no npm dependencies:

```bash
npm run verify
```

This checks the CMS schema, business contact details, safety, the GitHub repo configuration, and the built homepage. To preview locally:

```bash
python -m http.server --directory dist 8000
```

The ZIP also comes with an **offline HTML preview** and desktop/mobile screenshots.

## Publishing and editing

Extract the ZIP and upload its **contents** to the root of `macv0223/psalm-23-trasnportation` on branch `main`, replacing old files. For simple branch deployment choose **Settings → Pages → Deploy from a branch → main → /(root)**. For automatic rebuilds whenever an editor publishes content, use **Settings → Pages → GitHub Actions**, and ensure the workflow file was uploaded (including the hidden `.github` directory).

The editor page is included, **but live sign-in is not connected** until the owner deploys the Cloudflare OAuth Worker and supplies credentials as explained in `docs/DEPLOY.md`. The site is functional without that editor connection.

## Contact and quote expectations

The website displays **281-766-1320** and **Psalm23Transportation@yahoo.com**. Once the separate notification Worker, providers, and Turnstile are configured, **Send Quote Request** submits directly to the business email and queues a text alert. Without that setup, the submit button is explicitly disabled and the email/copy backups remain available. The form does **not** open an SMS app on submission. See `docs/ONLINE-QUOTE-NOTIFICATIONS.md` for activation.

The owner should review and approve the family narrative, all service claims, and the commitment wording before launch.


## Latest artwork update

This build uses the approved Psalm 23 website banner in the hero section and includes three labeled supporting background images for the story, process, and quote sections. See `docs/ARTWORK.md` for the asset map.


### Hero image fix
The homepage now references the existing text-free `psalm23-quote-section-bg.webp` for the hero (the previous text-bearing banner is not used). The headline remains editable and the rest of the layout is unchanged.


## Styling regression fix (v4)

The public HTML now embeds its complete matching CSS and JavaScript to prevent outdated browser-cached `assets/site.css` from collapsing the layout. See `docs/LIVE-STYLESHEET-FIX.md`.


## Version 5 mobile refinement

Mobile header, hero, contact form and footer were rebuilt to prevent cramped text, excessive hero height and overlapping footer links. See `docs/MOBILE-LAYOUT-v5.md`. The built site embeds its own CSS and JavaScript to avoid stale-cache styling failures. The GitHub Pages artifact includes `CNAME` for `psalm23transportation.com`.

<<<<<<< HEAD

## v8 — Direct online quote requests (email + SMS)

See [ONLINE-QUOTE-NOTIFICATIONS.md](docs/ONLINE-QUOTE-NOTIFICATIONS.md) for the separate Cloudflare notification Worker, Resend email, Twilio SMS, Turnstile protection, and activation instructions. The form button stays disabled until the public endpoint and site key are set; credentials belong only in Worker secrets.
=======
>>>>>>> c996adfff251fda4a58a609dd80941e1e45aca19
