# Layout reference and quality checks

Design implemented from `reference-layout.png` (the approved concept from the conversation). It is a functional, responsive translation rather than a static screenshot.

## Section order

`Utility bar → Navigation → Hero → Four commitments → Three services → Built on faith → Three planning steps → Quote form → Footer`

## Visual principles

- Near-black backgrounds, thin bronze borders, gold-gradient primary buttons, and matte-gold circular icon links.
- Gold-and-white editorial serif headlines with smaller uppercase sans-serif labels.
- Header and footer use the approved transparent wordmark, not the old black rectangular version.
- The hero places the real approved truck-and-cross artwork to the right of editable copy, with a fade so no text is printed over other text.
- Background scenery remains subtle in the story and process sections.
- Three cards per row on desktop; all cards become single-column on mobile.
- One-column mobile page with a collapsible navigation menu and contact actions.

## Verified behaviour

- All required logo and scene images load from the site itself.
- The form validates name, pickup point, destination and description.
- The form prepares an SMS, with alternative email and copy controls.
- `index.html` at repository root is identical to `dist/index.html`, preventing stale Pages deployments.
- The CMS uses `content/site.json`, correctly identifies `macv0223/psalm-23-trasnportation` and lets the editor revise the new four-value strip.
- Automated and visual checks cover 1440px, 834px, 390px and 320px widths.

The live editor requires the user's separately configured Cloudflare OAuth Worker and authorized GitHub credentials. No secret values are included.
