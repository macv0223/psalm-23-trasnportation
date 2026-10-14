// Isomorphic, dependency-free templates shared by the public build and CMS preview.
export const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const phoneDigits=phone=>String(phone??'').replace(/[^+\d]/g,'');
export const color=(value,otherwise)=>/^#[0-9a-f]{6}$/i.test(String(value))?value:otherwise;
export function media(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  // Decap previews newly uploaded files with ephemeral blob URLs.
  if(/^blob:https?:\/\/[^\s<>"']+$/i.test(raw))return raw;
  if(/^\/?assets\/uploads\/[a-z0-9_\-./% ()]+$/i.test(raw)&&!raw.includes('..')&&!/%2f|%5c/i.test(raw))return raw.replace(/^\//,'');
  try {const url=new URL(raw);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
  return '';
}
const siteRequired=[
  ['settings',['businessName','brandTop','brandBottom','phone','email','logoAlt','tagline','verseReference','copyrightYear','primaryColor','accentColor']],
  ['navigation',['services','story','quote']],
  ['hero',['eyebrow','headline1','headline2','intro','primaryButton','secondaryButton','ribbon']],
  ['services',['eyebrow','headline1','headline2','intro']],
  ['story',['eyebrow','headline1','headline2','paragraph1','paragraph2','verse','verseCitation']],
  ['quote',['eyebrow','headline1','headline2','intro','nameLabel','pickupLabel','destinationLabel','loadLabel','dateLabel','submitButton','emailButton','copyButton','disclaimer']]
];
export function validateSite(data){
  if(!data||typeof data!=='object')throw new Error('content/site.json must be an object');
  for(const [section,fields] of siteRequired){
    if(!data[section]||typeof data[section]!=='object')throw new Error(`Missing ${section} section`);
    for(const field of fields)if(typeof data[section][field]!=='string'||!data[section][field].trim())throw new Error(`Missing ${section}.${field}`);
  }
  const s=data.settings;
  if(!/^#[0-9a-f]{6}$/i.test(s.primaryColor)||!/^#[0-9a-f]{6}$/i.test(s.accentColor))throw new Error('Brand colors must be six-digit hex codes');
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s.email))throw new Error('Email address invalid');
  if(phoneDigits(s.phone).replace(/\D/g,'').length<10)throw new Error('Phone number invalid');
  if(!Array.isArray(data.services.cards)||data.services.cards.length<1||data.services.cards.length>12)throw new Error('Add 1 to 12 hauling services');
  for(const [i,c] of data.services.cards.entries())if(!c||!['number','title','description'].every(k=>typeof c[k]==='string'&&c[k].trim()))throw new Error(`Service ${i+1} must have number, title, description`);
  for(const [part,alt] of [[data.settings,'logoAlt'],[data.hero,'heroImageAlt'],[data.story,'storyImageAlt']]) {
    const key=part===data.settings?'logo':part===data.hero?'heroImage':'storyImage';
    if(part[key]&&(!media(part[key])||String(part[key]).startsWith('blob:')))throw new Error(`Invalid image URL in ${key}; use HTTPS or uploaded image`);
    if(part[key]&&!String(part[alt]||'').trim())throw new Error(`Add image description for ${key}`);
  }
  return true;
}
function picture(path,description,cls,fallBack='assets/uploads/psalm23-truck-logo.png',eager=false){
  const url=media(path)||fallBack;
  return `<img class="${esc(cls)}" src="${esc(url)}" data-image-fallback="${esc(fallBack)}" alt="${esc(description)}" loading="${eager?'eager':'lazy'}" decoding="async">`;
}
export function renderPage(data){
  const {settings:s,navigation:n,hero:h,services:v,story:y,quote:q}=data;
  const phone=phoneDigits(s.phone),link=`tel:${encodeURIComponent(phone)}`;
  const style=`--brand-primary:${color(s.primaryColor,'#12312f')};--brand-accent:${color(s.accentColor,'#db9d46')}`;
  const logo=picture(s.logo,s.logoAlt,'brand-cross','assets/uploads/psalm23-truck-logo.png',true);
  const mark=picture(s.logo,'','brand-symbol','assets/uploads/psalm23-truck-logo.png',true);
  const scene=media(h.heroImage)?`<div class="hero-scene">${picture(h.heroImage,h.heroImageAlt,'hero-picture','assets/uploads/psalm23-truck-logo.png')}</div>`:'';
  const storyImage=media(y.storyImage)?`<div class="story-upload">${picture(y.storyImage,y.storyImageAlt,'story-upload-image')}</div>`:'';
  const cards=v.cards.map((item,i)=>`<article class="service-card"><span class="service-no">${esc(item.number||String(i+1).padStart(2,'0'))}</span><div class="service-icon" aria-hidden="true">${['↗','▦','→'][i%3]}</div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><span class="service-stroke" aria-hidden="true"></span></article>`).join('');
  return `<div class="site" style="${style}">
  <a class="skip-link" href="#main">Skip to main content</a>
  <header class="site-header"><div class="container header-inner">
    <a class="brand" href="#top" aria-label="${esc(s.businessName)} — home"><span class="brand-icon">${mark}</span><span class="brand-wordmark"><strong>${esc(s.brandTop)}</strong><span>${esc(s.brandBottom)}</span></span></a>
    <button type="button" class="menu-toggle" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded="false"><span></span><span></span><span></span></button>
    <nav class="nav" id="primary-navigation" aria-label="Main navigation"><a href="#services">${esc(n.services)}</a><a href="#story">${esc(n.story)}</a><a href="#quote" class="nav-quote">${esc(n.quote)} <span aria-hidden="true">↗</span></a></nav>
    <a class="header-phone" href="${esc(link)}" aria-label="Call ${esc(s.phone)}">${esc(s.phone)}</a>
  </div></header>
  <main id="main"><section class="hero" id="top" aria-labelledby="hero-title"><div class="hero-grid container">
    <div class="hero-copy"><p class="eyebrow eyebrow-light"><span class="eyebrow-line"></span>${esc(h.eyebrow)}</p>
      <h1 id="hero-title">${esc(h.headline1)}<br><em>${esc(h.headline2)}</em></h1>
      <p class="hero-intro">${esc(h.intro)}</p>
      <div class="hero-actions"><a class="btn btn-primary" href="#quote">${esc(h.primaryButton)} <span aria-hidden="true">↗</span></a><a class="btn btn-text" href="${esc(link)}">${esc(h.secondaryButton)} <span aria-hidden="true">↗</span></a></div>
      <p class="hero-verse"><span aria-hidden="true">✝</span> ${esc(s.tagline.toUpperCase())} <span class="hero-verse-ref">${esc(s.verseReference)}</span></p>
    </div>
    <div class="hero-media"><div class="hero-visual" aria-label="Transportation truck logo on a road"><div class="hero-road" aria-hidden="true"></div>${scene}<div class="hero-logo-panel">${logo}</div><div class="visual-corner"><span>23</span><small>FLATBED SERVICE</small></div></div><span class="vertical-label" aria-hidden="true">READY TO ROLL</span></div>
  </div><div class="hero-ribbon"><div class="container"><span class="ribbon-icon" aria-hidden="true">✳</span><p>${esc(h.ribbon)}</p><span class="ribbon-icon" aria-hidden="true">✳</span></div></div></section>
  <section class="services-section" id="services" aria-labelledby="services-title"><div class="container">
    <div class="section-heading"><div><p class="eyebrow">${esc(v.eyebrow)}</p><h2 id="services-title">${esc(v.headline1)}<br><em>${esc(v.headline2)}</em></h2></div><p class="section-intro">${esc(v.intro)}</p></div>
    <div class="service-grid">${cards}</div><a class="section-link" href="#quote">Tell us what you need moved <span aria-hidden="true">↗</span></a>
  </div></section>
  <section class="story-section" id="story" aria-labelledby="story-title"><div class="container story-grid"><div class="story-art"><div class="story-frame">${picture(s.logo,'','story-cross-image','assets/uploads/psalm23-truck-logo.png')}<div class="story-orbit orbit-one"></div><div class="story-orbit orbit-two"></div><div class="story-lightbox"><span>23</span><small>FAITH, FAMILY<br>&amp; HAULING</small></div>${storyImage}</div><div class="art-caption">READY TO SERVE <span>•</span> READY TO ROLL</div></div>
    <div class="story-copy"><p class="eyebrow eyebrow-light">${esc(y.eyebrow)}</p><h2 id="story-title">${esc(y.headline1)}<br><em>${esc(y.headline2)}</em></h2><p>${esc(y.paragraph1)}</p><p>${esc(y.paragraph2)}</p><blockquote><p>${esc(y.verse)}</p><cite>${esc(y.verseCitation)}</cite></blockquote></div>
  </div></section>
  <section class="quote-section" id="quote" aria-labelledby="quote-title"><div class="container quote-grid"><div class="quote-info"><p class="eyebrow">${esc(q.eyebrow)}</p><h2 id="quote-title">${esc(q.headline1)}<br><em>${esc(q.headline2)}</em></h2><p>${esc(q.intro)}</p><div class="contact-links"><a href="${esc(link)}"><span class="contact-icon" aria-hidden="true">↗</span><span><small>CALL US</small><strong>${esc(s.phone)}</strong></span></a><a href="mailto:${esc(s.email)}"><span class="contact-icon" aria-hidden="true">✉</span><span><small>EMAIL US</small><strong>${esc(s.email)}</strong></span></a></div><p class="contact-note">${esc(q.smallNote)} <a class="contact-sms" href="sms:${esc(phone)}">Text us directly ↗</a></p></div>
    <form id="quote-form" class="quote-form" data-phone="${esc(phone)}" data-email="${esc(s.email)}" novalidate><div class="form-intro"><span>START YOUR QUOTE</span><span aria-hidden="true">↗</span></div><div class="field field-full"><label for="customer-name">${esc(q.nameLabel)} <span aria-label="required">*</span></label><input id="customer-name" name="customerName" type="text" placeholder="${esc(q.namePlaceholder)}" autocomplete="name" maxlength="120" required></div>
      <div class="field-row"><div class="field"><label for="pickup">${esc(q.pickupLabel)} <span aria-label="required">*</span></label><input id="pickup" name="pickup" type="text" placeholder="${esc(q.pickupPlaceholder)}" maxlength="180" required></div><div class="field"><label for="destination">${esc(q.destinationLabel)} <span aria-label="required">*</span></label><input id="destination" name="destination" type="text" placeholder="${esc(q.destinationPlaceholder)}" maxlength="180" required></div></div>
      <div class="field field-full"><label for="load">${esc(q.loadLabel)} <span aria-label="required">*</span></label><textarea id="load" name="load" rows="4" placeholder="${esc(q.loadPlaceholder)}" maxlength="2500" required></textarea></div>
      <div class="field field-full"><label for="timeframe">${esc(q.dateLabel)}</label><input id="timeframe" name="timeframe" type="text" placeholder="${esc(q.datePlaceholder)}" maxlength="140"></div>
      <button type="submit" class="btn btn-primary btn-submit">${esc(q.submitButton)} <span aria-hidden="true">↗</span></button><div class="form-alt"><button class="alt-action" type="button" data-action="email">${esc(q.emailButton)}</button><button class="alt-action" type="button" data-action="copy">${esc(q.copyButton)}</button></div><p class="form-message" id="form-status" role="status" aria-live="polite"></p><p class="form-note">${esc(q.disclaimer)}</p>
    </form></div></section>
  </main><footer class="footer"><div class="container footer-inner"><a class="brand footer-brand" href="#top"><span class="brand-icon">${mark}</span><span class="brand-wordmark"><strong>${esc(s.brandTop)}</strong><span>${esc(s.brandBottom)}</span></span></a><p>${esc(s.tagline)}</p><small>© ${esc(s.copyrightYear)} ${esc(s.businessName)}. All rights reserved.</small></div></footer>
  </div>`;
}
export function renderDocument(data){
  const title=`${data.settings.businessName} | Flatbed Hauling & Transportation`;
  const description=String(data.hero.intro).slice(0,160);
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${esc(color(data.settings.primaryColor,'#12312f'))}"><meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><link rel="icon" href="assets/favicon.png" type="image/png"><link rel="stylesheet" href="assets/site.css"><title>${esc(title)}</title></head><body>${renderPage(data)}<script type="module" src="assets/app.js"></script></body></html>`;
}
