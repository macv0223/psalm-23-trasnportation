# Source notes & launch checks — truck-logo alternative

This second website is an alternative branding direction for **Psalm 23 Transportation**.
Business details and the family story were carried over from the first website.
The primary image is the client's selected green-and-bronze puzzle-pattern flatbed
truck, stored at `public/assets/uploads/psalm23-truck-logo.png`. The road is drawn
with CSS. There are no other truck or cross graphics used in the public site.

The puzzle-themed copy has intentionally been retained: “Moving. With purpose.”
and “Putting the pieces together, from pickup to delivery.” The Story paragraph
now refers to the puzzle pieces on the truck. No capacity, permit, insurance,
service-area guarantee or fixed-price claims are implied.

## Check before publication

- [ ] The owner approves the artwork, description of the family, and list of services.
- [ ] Confirm the business phone `281-766-1320` and email `Psalm23Transportation@yahoo.com`.
- [ ] Confirm the exact routes, transport limitations, cargo conditions and fees directly with the owner.
- [ ] Check mobile layout, contrast, alt text and links on the deployed website.
- [ ] Confirm SMS opens a draft the visitor must send, and the email/copy fallbacks work.
- [ ] Activate and test GitHub OAuth, Cloudflare Worker and approved editor permissions.
- [ ] Confirm GitHub Pages Actions rebuild the public site after an authorized CMS publish.

`npm run verify` tests local build and CMS structure, not live GitHub/Cloudflare authentication.
