// Psalm 23 Transportation — responsive page generator / Decap CMS content source.
// All CMS-originated text and image URLs pass through escaped, validated helpers.
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const phoneDigits = phone => String(phone ?? '').replace(/[^+\d]/g, '');
const hex = (value,fallback) => /^#[0-9a-f]{6}$/i.test(String(value)) ? value : fallback;
export function media(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  if(/^blob:https?:\/\/[^\s<>"']+$/i.test(raw))return raw;
  if(/^\/?assets\/uploads\/[a-z0-9_\-./% ()]+$/i.test(raw)&&!raw.includes('..')&&!/%2f|%5c/i.test(raw))return raw.replace(/^\//,'');
  try {const url=new URL(raw);if(url.protocol==='https:'&&!url.username&&!url.password)return url.href;}catch{}
  return '';
}
const sections={
  settings:['businessName','brandTop','brandBottom','phone','email','logoAlt','tagline','verseReference','copyrightYear','primaryColor','accentColor'],
  navigation:['home','services','process','story','contact','quote'],
  hero:['eyebrow','headline1','headline2','intro','primaryButton','secondaryButton','ribbon'],
  services:['eyebrow','headline1','headline2','intro'],
  process:['eyebrow','headline1','headline2','intro'],
  story:['eyebrow','headline1','headline2','paragraph1','paragraph2','verse','verseCitation'],
  quote:['eyebrow','headline1','headline2','intro','smallNote','nameLabel','pickupLabel','destinationLabel','loadLabel','dateLabel','submitButton','emailButton','copyButton','disclaimer']
};
export function validateSite(data){
  if(!data||typeof data!=='object')throw new Error('content/site.json must be a JSON object');
  for(const [section,fields] of Object.entries(sections)){
    if(!data[section]||typeof data[section]!=='object')throw new Error(`Missing ${section}`);
    for(const field of fields)if(typeof data[section][field]!=='string'||!data[section][field].trim())throw new Error(`Missing ${section}.${field}`);
  }
  if(!/^#[0-9a-f]{6}$/i.test(data.settings.primaryColor)||!/^#[0-9a-f]{6}$/i.test(data.settings.accentColor))throw new Error('Brand colours must be six-digit hex values');
  if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.settings.email))throw new Error('Invalid contact email');
  if(phoneDigits(data.settings.phone).replace(/\D/g,'').length<10)throw new Error('Invalid contact phone number');
  for(const [name,min,max] of [['services',1,12],['process',3,3]]){
    const list=data[name][name==='services'?'cards':'steps'];
    if(!Array.isArray(list)||list.length<min||list.length>max)throw new Error(`Invalid ${name} entries`);
    for(const [i,item] of list.entries())if(!item||!['number','title','description'].every(key=>typeof item[key]==='string'&&item[key].trim()))throw new Error(`Invalid ${name} card ${i+1}`);
  }
  if(!Array.isArray(data.values)||data.values.length!==4)throw new Error('Four service values are required');
  for(const value of data.values)if(!value||typeof value.title!=='string'||!value.title.trim()||typeof value.icon!=='string'||!value.icon.trim())throw new Error('Service values need icon and title');
  for(const [obj,imgKey,altKey] of [[data.settings,'logo','logoAlt'],[data.settings,'featureGraphic','featureGraphicAlt'],[data.settings,'showcaseGraphic','showcaseGraphicAlt'],[data.hero,'heroImage','heroImageAlt'],[data.story,'storyImage','storyImageAlt']]){
    if(obj[imgKey]&&(!media(obj[imgKey])||String(obj[imgKey]).startsWith('blob:')))throw new Error(`Invalid image URL in ${imgKey}`);
    if(obj[imgKey]&&!String(obj[altKey]||'').trim())throw new Error(`Missing image description for ${imgKey}`);
  }
  return true;
}
const iconPaths={
  cross:'<path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8z"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m8.5 12 2.2 2.2 4.8-5"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  heart:'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/><path d="M12 7v11m-5.5-5.5H17"/>',
  truck:'<rect x="1.5" y="6" width="12.5" height="11" rx="1"/><path d="M14 10h4l3.5 3v4H14z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M4 10h7"/>',
  equipment:'<path d="M3 4h18v16H3zM7 4v16M12 4v16M17 4v16"/>',
  road:'<path d="M7 2 3 22M17 2l4 20M12 2v4M12 10v4M12 18v4"/>',
  document:'<path d="M4 2h12l4 4v16H4zM16 2v5h4M8 12h8M8 16h8"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3 5.18 2 2 0 0 1 5 3h3a2 2 0 0 1 2 1.72l.5 3a2 2 0 0 1-.57 1.74l-1.6 1.6a16 16 0 0 0 4.6 4.6l1.6-1.6a2 2 0 0 1 1.74-.57l3 .5A2 2 0 0 1 22 16.92z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
  arrow:'<path d="M5 12h14m-7-7 7 7-7 7"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  quote:'<path d="M7 3h10l4 4v14H3V3h4zM17 3v5h4M8 12h8M8 16h8"/>',
  clipboard:'<rect x="4" y="5" width="16" height="17" rx="2"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M8 13h8m-8 4h6"/>'
};
function icon(name,cls='icon'){
  const key=Object.hasOwn(iconPaths,name)?name:'shield';
  return `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false" aria-hidden="true">${iconPaths[key]}</svg>`;
}
function pic(url,alt,cls,fallback,eager=false){
  const src=media(url)||fallback;
  return `<img class="${cls}" src="${esc(src)}" data-image-fallback="${esc(fallback)}" alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}>`;
}
function cssBg(url,fallback){
  const src=media(url)||fallback;
  return `url('${esc(src)}')`;
}
const cta=(href,label,cls='button button-gold')=>`<a href="${esc(href)}" class="${cls}">${esc(label)} ${icon('arrow','icon icon-arrow')}</a>`;
export function renderPage(data){
  const {settings:s,navigation:n,hero:h,services:v,process:p,story:y,quote:q}=data;
  const phone=phoneDigits(s.phone),tel=`tel:${phone}`,sms=`sms:${phone}`,mailto=`mailto:${s.email}`;
  const storyBg=cssBg(y.backgroundImage,'assets/uploads/psalm23-story-section-bg.webp');
  const processBg=cssBg(p.backgroundImage,'assets/uploads/psalm23-process-section-bg.webp');
  const quoteBg=cssBg(q.backgroundImage,'assets/uploads/psalm23-quote-section-bg.webp');
  const style=`--site-bg:${hex(s.primaryColor,'#090909')};--site-gold:${hex(s.accentColor,'#E9B658')};--story-bg:${storyBg};--process-bg:${processBg};--quote-bg:${quoteBg}`;
  const logo=pic(s.logo,s.logoAlt,'brand-image','assets/uploads/psalm23-wordmark-gold.png',true);
  const iconForService=['truck','equipment','road'];
  const valueCards=data.values.map(x=>`<div class="value-card">${icon(x.icon,'icon value-icon')}<span>${esc(x.title)}</span></div>`).join('');
  const cards=v.cards.map((card,i)=>`<article class="service-card"><span class="card-number">${esc(card.number)}</span><a class="card-arrow" href="#quote" aria-label="Ask about ${esc(card.title)}">${icon('arrow')}</a><div class="card-icon">${icon(iconForService[i%3])}</div><h3>${esc(card.title)}</h3><p>${esc(card.description)}</p></article>`).join('');
  const stepIcons=['document','pin','truck'];
  const steps=p.steps.map((step,i)=>`<article class="step-card"><span class="card-number">${esc(step.number)}</span><a class="card-arrow" href="#quote" aria-label="Request transportation planning">${icon('arrow')}</a><div class="step-body">${icon(stepIcons[i%3],'icon step-icon')}<div><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p></div></div></article>`).join('');
  return `<div class="site" style="${style}">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="utility-bar"><div class="container utility-inner"><span class="utility-promise"><span class="utility-cross">✝</span> FAMILY-OWNED <b>·</b> FAITH-GUIDED <span class="utility-reliability"><b>·</b> RELIABLE TRANSPORTATION</span></span><div class="utility-contacts"><a href="${esc(tel)}">${icon('phone')} ${esc(s.phone)}</a><a href="${esc(mailto)}">${icon('mail')} ${esc(s.email)}</a></div></div></div>
  <header class="site-header"><div class="container nav-inner">
    <a class="site-brand" href="#top" aria-label="${esc(s.businessName)} home">${logo}</a>
    <button type="button" class="menu-toggle" aria-label="Open navigation" aria-controls="primary-navigation" aria-expanded="false"><span></span><span></span><span></span></button>
    <nav class="nav" id="primary-navigation" aria-label="Main navigation">
      <a class="nav-home" href="#top">${esc(n.home)}</a><a href="#services">${esc(n.services)}</a><a href="#story">${esc(n.story)}</a><a href="#process">${esc(n.process)}</a><a href="#quote">${esc(n.contact)}</a>
    </nav>${cta('#quote',n.quote,'button button-gold nav-cta')}
  </div></header>
  <main id="main">
    <section class="hero" id="top" aria-labelledby="hero-title">
      <div class="hero-art" aria-hidden="true">${pic(h.heroImage,'','hero-backdrop','assets/uploads/psalm23-quote-section-bg.webp',true)}</div><div class="hero-darkener" aria-hidden="true"></div>
      <div class="container hero-inner"><div class="hero-copy">
        <p class="eyebrow hero-eyebrow">${esc(h.eyebrow)}</p>
        <h1 id="hero-title"><span>${esc(h.headline1)}</span><em>${esc(h.headline2)}</em></h1>
        <p class="hero-intro">${esc(h.intro)}</p>
        <div class="hero-actions">${cta('#quote',h.primaryButton)}${cta(tel,h.secondaryButton,'button button-outline')}</div>
        <p class="hero-signoff">${esc(h.ribbon)}</p>
      </div></div>
    </section>
    <section class="value-strip" aria-label="Our commitments"><div class="container value-grid">${valueCards}</div></section>
    <section class="services section-pad" id="services" aria-labelledby="services-title"><div class="container">
      <div class="section-title-centered"><div class="title-flanked"><span></span><p class="eyebrow">${esc(v.eyebrow)}</p><span></span></div><h2 id="services-title">${esc(v.headline1)} ${esc(v.headline2)}</h2><p class="services-intro">${esc(v.intro)}</p></div>
      <div class="service-grid">${cards}</div><a class="underlink" href="#quote">Discuss your transportation needs ${icon('arrow')}</a>
    </div></section>
    <section class="story section-pad" id="story" aria-labelledby="story-title"><div class="story-mountain" aria-hidden="true"></div><div class="container story-grid">
      <div class="faith-picture">${pic(y.storyImage,y.storyImageAlt,'faith-image','assets/uploads/psalm23-faith-emblem.webp')}</div>
      <div class="story-content"><p class="eyebrow">${esc(y.eyebrow)}</p><h2 id="story-title"><span>${esc(y.headline1)}</span><em>${esc(y.headline2)}</em></h2><p>${esc(y.paragraph1)}</p><p>${esc(y.paragraph2)}</p><blockquote><p>${esc(y.verse)}</p><cite>${esc(y.verseCitation)}</cite></blockquote></div>
    </div></section>
    <section class="process section-pad" id="process" aria-labelledby="process-title"><div class="process-mountain" aria-hidden="true"></div><div class="container">
      <div class="process-top"><div><p class="eyebrow">${esc(p.eyebrow)}</p><h2 id="process-title"><span>${esc(p.headline1)}</span><em>${esc(p.headline2)}</em></h2></div><p>${esc(p.intro)}</p></div>
      <div class="steps-grid">${steps}</div>
    </div></section>
    <section class="quote section-pad" id="quote" aria-labelledby="quote-title"><div class="quote-backdrop" aria-hidden="true"></div><div class="container quote-grid">
      <div class="quote-copy"><p class="eyebrow">${esc(q.eyebrow)}</p><h2 id="quote-title"><span>${esc(q.headline1)}</span><em>${esc(q.headline2)}</em></h2><p class="quote-intro">${esc(q.intro)}</p>
        <div class="contact-links"><a href="${esc(tel)}">${icon('phone','icon contact-icon')}<span><small>CALL US</small><strong>${esc(s.phone)}</strong></span></a><a href="${esc(mailto)}">${icon('mail','icon contact-icon')}<span><small>EMAIL US</small><strong>${esc(s.email)}</strong></span></a></div>
        <p class="small-note">${esc(q.smallNote)} <a href="${esc(sms)}">Text us directly ↗</a></p>
      </div>
      <form class="quote-form" id="quote-form" data-phone="${esc(phone)}" data-email="${esc(s.email)}" novalidate>
        <div class="form-heading"><strong>REQUEST A QUOTE</strong>${icon('arrow')}</div>
        <div class="field"><label for="customer-name">${esc(q.nameLabel)} <span>*</span></label><input id="customer-name" name="customerName" type="text" placeholder="${esc(q.namePlaceholder)}" autocomplete="name" maxlength="120" required></div>
        <div class="field-row"><div class="field"><label for="pickup">${esc(q.pickupLabel)} <span>*</span></label><input id="pickup" name="pickup" type="text" placeholder="${esc(q.pickupPlaceholder)}" maxlength="180" required></div><div class="field"><label for="destination">${esc(q.destinationLabel)} <span>*</span></label><input id="destination" name="destination" type="text" placeholder="${esc(q.destinationPlaceholder)}" maxlength="180" required></div></div>
        <div class="field"><label for="load">${esc(q.loadLabel)} <span>*</span></label><textarea id="load" name="load" rows="3" placeholder="${esc(q.loadPlaceholder)}" maxlength="2500" required></textarea></div>
        <div class="field"><label for="timeframe">${esc(q.dateLabel)}</label><input id="timeframe" name="timeframe" type="text" placeholder="${esc(q.datePlaceholder)}" maxlength="140"></div>
        <button class="button button-gold submit-button" type="submit">${esc(q.submitButton)} ${icon('arrow')}</button>
        <div class="form-extras"><button type="button" data-action="email">${esc(q.emailButton)}</button><button type="button" data-action="copy">${esc(q.copyButton)}</button></div>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p><p class="form-note">${esc(q.disclaimer)}</p>
      </form>
    </div></section>
  </main>
  <footer class="footer"><div class="container footer-top"><a href="#top" class="footer-logo" aria-label="Back to top">${pic(s.logo,'','brand-image','assets/uploads/psalm23-wordmark-gold.png')}</a><nav class="footer-nav" aria-label="Footer navigation"><a href="#top">${esc(n.home)}</a><a href="#services">${esc(n.services)}</a><a href="#story">${esc(n.story)}</a><a href="#process">${esc(n.process)}</a><a href="#quote">${esc(n.contact)}</a></nav><div class="footer-contact"><a href="${esc(tel)}">${icon('phone')} ${esc(s.phone)}</a><a href="${esc(mailto)}">${icon('mail')} ${esc(s.email)}</a></div></div>
    <div class="container footer-bottom"><span>© ${esc(s.copyrightYear)} ${esc(s.businessName)}. All rights reserved.</span><span>FAITH. FAMILY. THE ROAD AHEAD.</span></div>
  </footer>
  </div>`;
}
export function renderDocument(data){
  const s=data.settings;
  const title=`${s.businessName} | Family-Owned Flatbed Transportation`;
  const description=String(data.hero.intro).slice(0,158);
  return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${esc(hex(s.primaryColor,'#090909'))}"><meta name="description" content="${esc(description)}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta name="color-scheme" content="dark"><link rel="icon" type="image/png" href="assets/favicon.png"><link rel="preload" href="assets/uploads/psalm23-quote-section-bg.webp" as="image" type="image/webp"><link rel="stylesheet" href="assets/site.css"><title>${esc(title)}</title></head><body>${renderPage(data)}<script type="module" src="assets/app.js"></script></body></html>`;
}
