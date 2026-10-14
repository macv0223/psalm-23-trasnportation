# Content provenance and quality checklist

Original page: https://psalm-23-transportation.igarza5652.chatgpt.site/

Reviewed 2026-10-14. The source was a single-page site titled "Psalm 23 Transportation — Truck Logo Version | Anything. Anywhere." with `What we haul`, `Our story`, and `Request a quote` sections. The recreated page updates service descriptions and CTAs to avoid double meanings, while retaining the family story, scripture, phone and email in `content/site.json` and the original text-based quote initiation. No unsupported licensing, service-area or load-capacity assertions were added.

The approved site logo is now the client's selected bronze-and-forest-green Christian puzzle cross, bundled with the repo as `public/assets/uploads/psalm23-puzzle-cross.webp` and `public/assets/uploads/psalm23-puzzle-cross-original.png`. The existing gold and green illustration of a hauling vehicle remains illustrative only; it is not a verified likeness of a business vehicle. No source-site hotlink is used in the rendered page.

## Checks before going live

- [ ] Confirm the family story wording with the business owner.
- [ ] Confirm that `281-766-1320` is the correct SMS and voice contact number.
- [ ] Confirm that `Psalm23Transportation@yahoo.com` receives quote requests.
- [ ] Obtain final approval for the bronze-and-green puzzle-cross branding; its image assets are already hosted locally.
- [ ] Verify the exact destinations/routes, trailer specifications and regulatory status independently before adding any claims.
- [ ] Verify contrast, keyboard focus, mobile navigation, and form validation on the deployed site.
- [ ] Confirm quote form SMS behaviour on iOS and Android, and email fallback on desktop.
- [ ] Confirm unapproved GitHub accounts cannot sign in.
- [ ] Confirm draft, publish and GitHub workflow execution end to end.
- [ ] Confirm correct domain/HTTPS after DNS propagation.

## Local verification completed for the draft

`npm run verify` exercises schema validation, HTML escaping, media URL restrictions, contact data consistency, CMS collection wiring, a valid Worker OAuth authorization redirect, signed cookie checks, and rejection of invalid state/unconfigured access. The local environment cannot certify the final GitHub/Cloudflare live configuration without the new repository and OAuth credentials.
