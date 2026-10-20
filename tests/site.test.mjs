import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSite,renderPage,renderDocument,esc,media,phoneDigits} from '../public/assets/render.js';
import {cmsConfig,isConfigured} from '../scripts/cms-config.mjs';
const data=JSON.parse(readFileSync(new URL('../content/site.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(data);
test('faithful black-and-gold layout with real editable sections',()=>{
  assert.equal(validateSite(data),true);
  const html=renderDocument(data);
  for(const fragment of ['HE LEADS.','WE HAUL.','BUILT ON FAITH.','DRIVEN BY CARE.','From pickup.','To delivery.','PUTTING THE PIECES TOGETHER','id="quote-form"','psalm23-quote-section-bg.webp','psalm23-wordmark-gold.png','psalm23-faith-emblem.webp','psalm23-story-section-bg.webp','psalm23-process-section-bg.webp','psalm23-quote-section-bg.webp'])assert.ok(html.includes(fragment),fragment);
  for(const cls of ['utility-bar','site-header','hero-darkener','value-strip','service-grid','story-grid','steps-grid','quote-grid','footer-top'])assert.ok(html.includes(cls),cls);
  for(const id of ['top','services','story','process','quote'])assert.ok(html.includes(`id="${id}"`),id);
  assert.equal((html.match(/class="value-card"/g)||[]).length,4);
  assert.equal((html.match(/class="service-card"/g)||[]).length,3);
  assert.equal((html.match(/class="step-card"/g)||[]).length,3);
  assert.doesNotMatch(html,/psalm23-truck-logo\.png|psalm23-puzzle-cross\.webp|Your load|We.take your load/i);
});
test('hero uses the existing clean, text-free truck scene instead of the text-bearing banner',()=>{
  assert.equal(data.hero.heroImage,'assets/uploads/psalm23-quote-section-bg.webp');
  const html=renderDocument(data);
  assert.match(html, /class="hero-backdrop" src="assets\/uploads\/psalm23-quote-section-bg\.webp"/);
  assert.doesNotMatch(html, /class="hero-backdrop" src="assets\/uploads\/psalm23-home-hero-banner\.webp"/);
});
test('verified customer details and direct contact links are present',()=>{
  const html=renderPage(data);
  assert.match(html,/281-766-1320/);
  assert.match(html,/Psalm23Transportation@yahoo.com/);
  assert.match(html,/tel:2817661320/);
  assert.match(html,/sms:2817661320/);
  assert.match(html,/mailto:Psalm23Transportation@yahoo.com/);
  assert.match(html,/Isabella, her boyfriend, and her dad/);
  assert.match(html,/The Lord is my shepherd/);
});
test('HTML and values from CMS are escaped',()=>{
  const x=clone(); x.hero.headline1='<img src=x onerror=alert(1)>';
  const html=renderPage(x);
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  assert.equal(esc('a&"\''),'a&amp;&quot;&#39;');
});
test('image upload URLs are validated to prevent unsafe injection',()=>{
  assert.equal(media('javascript:alert(1)'),'');
  assert.equal(media('data:text/html,<script>evil</script>'),'');
  assert.equal(media('assets/uploads/brand.png'),'assets/uploads/brand.png');
  assert.equal(media('assets/uploads/../../secret'),'');
  const x=clone();x.settings.logo='javascript:alert(1)';assert.throws(()=>validateSite(x),/Invalid image URL/);
});
test('invalid data and missing promises are rejected',()=>{
  const x=clone();x.values=[];assert.throws(()=>validateSite(x),/Four service values/);
  x.values=clone().values;x.services.cards=[];assert.throws(()=>validateSite(x),/Invalid services/);
  x.services.cards=clone().services.cards;x.settings.primaryColor='not a color';assert.throws(()=>validateSite(x),/Brand colours/);
});
test('Decap CMS edits the correct file including navigation, promises and images',()=>{
  const setup={repository:'macv0223/psalm-23-trasnportation',branch:'main',oauthOrigin:'https://auth.example.workers.dev',siteUrl:'https://macv0223.github.io/psalm-23-trasnportation/'};
  const config=cmsConfig(setup);
  assert.equal(config.backend.name,'github');
  assert.equal(config.backend.repo,setup.repository);
  assert.equal(config.publish_mode,'editorial_workflow');
  assert.equal(config.collections[0].files[0].file,'content/site.json');
  const fields=config.collections[0].files[0].fields;
  assert.ok(fields.find(f=>f.name==='values'));
  assert.ok(fields.find(f=>f.name==='hero').fields.find(f=>f.name==='heroImage'));
  assert.ok(fields.find(f=>f.name==='settings').fields.find(f=>f.name==='logo'));
  assert.equal(isConfigured(setup),true);
  assert.equal(isConfigured({...setup,oauthOrigin:''}),false);
});
test('phone number is safe for tel and sms links',()=>assert.equal(phoneDigits('(281) 766-1320'),'2817661320'));

test('generated homepage includes self-contained CSS and JS to prevent stale-cache layout failures',()=>{
  const page=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
  assert.match(page,/psalm23-critical-site-css/);
  assert.match(page,/page\.replace\(styleLink/);
  assert.match(page,/psalm23-matching-app-js/);
  assert.match(page,/readFileSync\(path\.join\(root,'public','assets','site\.css'\)/);
  assert.match(page,/readFileSync\(path\.join\(root,'public','assets','app\.js'\)/);
});

test('mobile layout includes a separate hero image and safe footer spacing',()=>{
  const css=readFileSync(new URL('../public/assets/site.css',import.meta.url),'utf8');
  assert.match(css,/Mobile-first refinements/);
  assert.match(css,/\.hero-art\s*\{[\s\S]*?order:\s*0;/);
  assert.match(css,/\.hero-inner\s*\{[\s\S]*?order:\s*1;/);
  assert.match(css,/\.footer-logo\s*\{[\s\S]*?height:\s*135px;/);
  assert.match(css,/\.field-row\s*\{\s*grid-template-columns:\s*1fr;/);
  const html=renderDocument(data);
  assert.match(html,/utility-reliability/);
});
