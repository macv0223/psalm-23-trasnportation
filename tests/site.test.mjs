import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateSite,renderPage,renderDocument,esc,media,phoneDigits} from '../public/assets/render.js';
import {cmsConfig,isConfigured} from '../scripts/cms-config.mjs';
const data=JSON.parse(readFileSync(new URL('../content/site.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(data);
test('revised customer-facing copy and verified contact details',()=>{
  assert.equal(validateSite(data),true);
  const html=renderDocument(data);
  assert.match(html,/Moving\./);
  assert.match(html,/With purpose\./);
  assert.match(html,/281-766-1320/);
  assert.match(html,/Psalm23Transportation@yahoo.com/);
  assert.match(html,/Isabella, her boyfriend, and her dad/);
  assert.match(html,/Putting the pieces together/i);
  assert.match(html,/Like the interlocking pieces on our truck/i);
  assert.doesNotMatch(html,/pieces of our cross/i);
  assert.match(html,/What needs transporting\?/);
  assert.doesNotMatch(html,/Your load|We.take your load/i);
  assert.doesNotMatch(html,/psalm-23-transportation\.igarza5652\.chatgpt\.site/);
  assert.match(html,/assets\/uploads\/psalm23-truck-logo\.png/);
  assert.match(html,/id="quote-form"/);
  assert.match(html,/Text us directly/);
  assert.match(html,/sms:2817661320/);
});
test('text from CMS fields is HTML escaped',()=>{
  const x=clone();x.hero.headline1='<img src=x onerror=alert(1)>';
  const html=renderPage(x);
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.equal(esc('a&"\''),'a&amp;&quot;&#39;');
});
test('malicious asset URLs are rejected and uploaded assets remain relative',()=>{
  assert.equal(media('javascript:alert(1)'),'');
  assert.equal(media('data:text/html,<script>hi</script>'),'');
  assert.equal(media('assets/uploads/photo.webp'),'assets/uploads/photo.webp');
  assert.equal(media('/assets/uploads/photo.png'),'assets/uploads/photo.png');
  assert.equal(media('assets/uploads/../../secret'),'');
  assert.equal(media('https://example.com/logo.jpeg'),'https://example.com/logo.jpeg');
  const x=clone();x.settings.logo='javascript:alert(1)';assert.throws(()=>validateSite(x),/Invalid image URL/);
  x.settings.logo='blob:https://example.com/1234';assert.throws(()=>validateSite(x),/Invalid image URL/);
});
test('invalid content fails at build-time instead of silently publishing',()=>{
  const x=clone();x.services.cards=[];assert.throws(()=>validateSite(x),/Add 1 to 12/);
  x.services.cards=clone().services.cards;x.settings.primaryColor='expression(bad)';assert.throws(()=>validateSite(x),/Brand colors/);
});
test('CMS enables editorial workflow and edits single source content file',()=>{
  const settings={repository:'owner/repo',branch:'main',oauthOrigin:'https://auth.example.workers.dev',siteUrl:'https://example.com'};
  const cfg=cmsConfig(settings);
  assert.equal(cfg.backend.name,'github');
  assert.equal(cfg.backend.base_url,settings.oauthOrigin);
  assert.equal(cfg.publish_mode,'editorial_workflow');
  assert.equal(cfg.collections[0].files[0].file,'content/site.json');
  assert.equal(cfg.media_folder,'public/assets/uploads');
  assert.equal(isConfigured(settings),true);
  assert.equal(isConfigured({...settings,repository:'YOUR-GITHUB-USERNAME/psalm-23-transportation'}),false);
  assert.equal(isConfigured({...settings,oauthOrigin:''}),false);
});
test('phone number normalization is fit for tel: and sms: links',()=>assert.equal(phoneDigits('(281) 766-1320'),'2817661320'));

test('alternative truck branding uses a single truck image and restores puzzle messaging',()=>{
  const html=renderDocument(data);
  assert.equal(data.settings.logo,'assets/uploads/psalm23-truck-logo.png');
  assert.match(html,/hero-road/);
  assert.match(html,/psalm23-truck-logo\.png/);
  assert.match(html,/PUTTING THE PIECES TOGETHER/);
  assert.doesNotMatch(html,/psalm23-puzzle-cross|hauling-scene\.svg|story-cross-image|brand-cross/);
  assert.equal(data.story.paragraph2.includes('interlocking pieces on our truck'),true);
});
