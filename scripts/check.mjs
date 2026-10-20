import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const full=p=>path.join(root,p);
const file=p=>{if(!existsSync(full(p)))throw new Error(`Missing required file: ${p}`)};
for(const p of ['index.html','dist/index.html','assets/site.css','dist/assets/site.css','assets/app.js','dist/assets/app.js','admin/index.html','dist/admin/index.html','dist/admin/config.json','dist/data/site.json','dist/assets/favicon.png','.github/workflows/pages.yml'])file(p);
const images=['psalm23-wordmark-gold.png','psalm23-quote-section-bg.webp','psalm23-story-section-bg.webp','psalm23-process-section-bg.webp','psalm23-quote-section-bg.webp','psalm23-faith-emblem.webp','psalm23-truck-graphic.webp','psalm23-hauling-graphic.webp'];
for(const image of images)for(const prefix of ['public','dist','.'])file(`${prefix}/assets/uploads/${image}`);
const html=readFileSync(full('dist/index.html'),'utf8');
if(readFileSync(full('index.html'),'utf8')!==html)throw new Error('Published root index.html differs from build: stale homepage risk');
// Regression: cached v1 green CSS must never be applied to new HTML.
if(!html.includes('<style id="psalm23-critical-site-css">')||!html.includes('.value-card')||!html.includes('.service-grid{'))throw new Error('Homepage must contain matching inline black-and-gold CSS');
if(!html.includes('name="psalm23-build" content="v9-secure-email-only-quotes"'))throw new Error('Wrong release is being published');
if(!html.includes('<script type="module" id="psalm23-matching-app-js">'))throw new Error('Homepage must contain matching inline JavaScript');
if(html.includes('<link rel="stylesheet" href="assets/site.css">')||html.includes('<script type="module" src="assets/app.js"></script>'))throw new Error('Homepage still loads old cacheable CSS/JS');
if(!html.includes('class="icon value-icon"')||!html.includes('.icon{width:22px;height:22px'))throw new Error('SVG sizing CSS missing; icons could render huge');

for(const expected of ['HE LEADS.','WE HAUL.','BUILT ON FAITH.','From pickup.','To delivery.','PUTTING THE PIECES TOGETHER','id="quote-form"','class="value-strip"','class="steps-grid"','psalm23-wordmark-gold.png','psalm23-quote-section-bg.webp','psalm23-faith-emblem.webp','psalm23-story-section-bg.webp','psalm23-process-section-bg.webp','psalm23-quote-section-bg.webp'])if(!html.includes(expected))throw new Error(`Missing reference-layout content: ${expected}`);
if(!html.includes('class="hero-backdrop" src="assets/uploads/psalm23-quote-section-bg.webp"'))throw new Error('Hero still uses a logo/text-bearing banner rather than the clean truck scene');
if((html.match(/class="value-card"/g)||[]).length!==4)throw new Error('Reference layout needs four values');
if((html.match(/class="service-card"/g)||[]).length!==3)throw new Error('Reference layout needs three service cards');
if((html.match(/class="step-card"/g)||[]).length!==3)throw new Error('Reference layout needs three process cards');
if(!html.includes('v7: Keep the single, CMS-editable hero heading'))throw new Error('Missing mobile-on-image headline styling');
if((html.match(/<h1 id="hero-title"/g)||[]).length!==1)throw new Error('Hero must have exactly one semantic heading');
const cfg=JSON.parse(readFileSync(full('dist/admin/config.json'),'utf8'));
if(cfg.backend.repo!=='macv0223/psalm-23-trasnportation'||cfg.publish_mode!=='editorial_workflow')throw new Error('Wrong CMS repository or editorial workflow');
if(cfg.collections[0].files[0].file!=='content/site.json')throw new Error('CMS must point to source JSON');
const data=JSON.parse(readFileSync(full('dist/data/site.json'),'utf8'));
if(data.settings.phone!=='281-766-1320'||data.settings.email!=='Psalm23Transportation@yahoo.com')throw new Error('Client contact details changed unexpectedly');
for(const fileName of ['cms/quotes/worker.mjs','cms/quotes/wrangler.toml','docs/ONLINE-QUOTE-NOTIFICATIONS.md'])file(fileName);
// The quote form must be disabled until configured, but enabled after the
// production endpoint and public Turnstile site key are added to site.json.
// An earlier release incorrectly insisted it was always disabled, preventing
// a live site from deploying after its legitimate configuration was saved.
const configuredQuoteForm = Boolean(data.settings.quoteApiEndpoint && data.settings.turnstileSiteKey);
const expectedEnabled = configuredQuoteForm ? 'true' : 'false';
if(!html.includes('name="customerEmail"')||!html.includes('name="customerPhone"')||!html.includes(`data-enabled="${expectedEnabled}"`))throw new Error(`Secure quote form is missing or in the wrong state (expected enabled=${expectedEnabled})`);
if(configuredQuoteForm && (!html.includes('class="cf-turnstile"')||!html.includes('data-action="quote_request"')||!html.includes('https://challenges.cloudflare.com/turnstile/v0/api.js')||!html.includes(`data-endpoint="${data.settings.quoteApiEndpoint}"`)))throw new Error('Live quote form is missing its public Turnstile widget or API endpoint');
if(!configuredQuoteForm && (!html.includes('disabled aria-disabled="true"')||html.includes('class="cf-turnstile"')))throw new Error('Unconfigured quote form should be disabled and not present a widget');
if(!html.includes('name="companyWebsite"'))throw new Error('Honeypot protection missing');
if(html.includes('window.location.href=uri')||html.includes('openSms('))throw new Error('Old SMS app submission handler remains');
console.log('Reference layout, updated artwork, contacts, CMS, and root deployment files verified.');
