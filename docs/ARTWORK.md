# Approved artwork and rendering notes

| Asset | Website position / role | Current location |
|---|---|---|
| `psalm23-wordmark-gold.png` | Transparent primary logo used in the header, footer and admin/header branding | `public/assets/uploads/` |
| `psalm23-home-hero-banner.webp` | **Hero section background** — the owner's approved Psalm 23 website banner | `public/assets/uploads/` |
| `psalm23-story-section-bg.webp` | **Our Story / Built on Faith background** | `public/assets/uploads/` |
| `psalm23-process-section-bg.webp` | **How It Works / Process background** | `public/assets/uploads/` |
| `psalm23-quote-section-bg.webp` | **Contact / Request a Quote background** | `public/assets/uploads/` |
| `psalm23-faith-emblem.webp` | Circular Christian emblem shown inside the story section | `public/assets/uploads/` |
| `psalm23-truck-graphic.webp` | Supplementary stored truck graphic for future sections | `public/assets/uploads/` |
| `psalm23-hauling-graphic.webp` | Supplementary stored hauling graphic for future sections | `public/assets/uploads/` |

**Labeled source files:** the full-size source PNGs used for the new backgrounds are stored in `client-artwork-originals/background-concepts/` so it is obvious which image belongs to which section.

**Hero update:** the website now uses the same approved banner image in the hero area instead of the earlier mockup scene.

All live images can be replaced later through `content/site.json` or, after GitHub OAuth is connected, through `/admin/`.

## Hero image correction
The homepage hero uses `assets/uploads/psalm23-quote-section-bg.webp` (the text-free white truck, cross and mountain road image, with clear space for editable heading on the left). The same existing file is also used as a subtle background for the quote section. The previous `psalm23-home-hero-banner.webp` has baked-in logo text, and is retained only as a reference asset rather than used in the live hero. Do not place the text-bearing banner beneath HTML headings.
