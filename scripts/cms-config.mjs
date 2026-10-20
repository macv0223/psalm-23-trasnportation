const str=(name,label,extra={})=>({name,label,widget:'string',...extra});
const txt=(name,label,extra={})=>({name,label,widget:'text',...extra});
const photo=(name,label,extra={})=>({name,label,widget:'image',allow_multiple:false,required:false,...extra});
const object=(name,label,fields)=>({name,label,widget:'object',collapsed:false,fields});
const colourRule=['^#[0-9a-fA-F]{6}$','Use a six-digit hex colour, for example #E9B658'];
const settings=object('settings','Business details & visual branding',[
  str('businessName','Business name'),str('brandTop','Brand name (first line)'),str('brandBottom','Brand name (second line)'),
  str('phone','Call / text telephone number'),str('email','Contact email',{pattern:['^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$','Enter a valid email address']}),
  str('quoteApiEndpoint','Quote sending Worker URL (public)',{required:false,hint:'Paste your deployed Cloudflare quote Worker URL ending /api/quote, e.g. https://YOUR-WORKER.workers.dev/api/quote. Do not paste secret API keys.'}),
  str('turnstileSiteKey','Cloudflare Turnstile public site key',{required:false,hint:'Public site key only (never the private Turnstile secret). Both this key and the Worker URL are needed for online submission.'}),
  photo('logo','Primary gold wordmark / header logo',{hint:'Approved transparent PNG wordmark; displays on black without a coloured rectangle.'}),txt('logoAlt','Logo description'),
  photo('featureGraphic','Supplementary truck graphic (stored, not displayed)',{hint:'Client-supplied truck & mountains Graphic 1.'}),txt('featureGraphicAlt','How-it-works image description'),
  photo('showcaseGraphic','Supplementary hauling graphic (stored, not displayed)',{hint:'Client-supplied truck with mountains & cross Graphic 2.'}),txt('showcaseGraphicAlt','Road-ahead image description'),
  str('tagline','Motto'),str('verseReference','Scripture reference'),str('copyrightYear','Copyright year'),
  str('primaryColor','Main background (near black)',{pattern:colourRule}),str('accentColor','Gold accent colour',{pattern:colourRule})
]);
const hero=object('hero','Hero banner & introduction',[
  str('eyebrow','Upper label'),str('headline1','Headline line 1'),str('headline2','Headline line 2'),txt('intro','Main introduction'),
  str('primaryButton','Quote button'),str('secondaryButton','Call button'),str('ribbon','Puzzle / promise slogan'),
  photo('heroImage','Full-width banner',{hint:'Default: existing clean, text-free truck-and-cross scene (psalm23-quote-section-bg.webp) with space for the editable heading. Avoid uploading banners that contain lettering.'}),
  txt('heroImageAlt','Banner image description')
]);
const cardFields=[str('number','Display number'),str('title','Heading'),txt('description','Description')];
const services=object('services','Transportation services',[
  str('eyebrow','Section label'),str('headline1','Headline line 1'),str('headline2','Headline line 2'),txt('intro','Section introduction'),
  {name:'cards',label:'Service cards (add, edit or reorder)',widget:'list',min:1,max:12,summary:'{{fields.title}}',fields:cardFields}
]);
const process=object('process','How it works',[
  str('eyebrow','Section label'),str('headline1','Headline line 1'),str('headline2','Headline line 2'),txt('intro','Section introduction'),
  photo('backgroundImage','How it works background image',{hint:'Wide atmospheric background behind the process cards.'}),
  {name:'steps',label:'Steps (three)',widget:'list',min:3,max:3,summary:'{{fields.title}}',fields:cardFields}
]);
const story=object('story','Christian values & family story',[
  str('eyebrow','Section label'),str('headline1','Headline line 1'),str('headline2','Headline line 2'),
  txt('paragraph1','Family story'),txt('paragraph2','Brand values / puzzle theme'),txt('verse','Scripture quotation'),str('verseCitation','Scripture citation'),
  photo('storyImage','Christian emblem (Logo 2)',{hint:'Client-supplied circular emblem with the Christian cross, mountains, road and puzzle heart.'}),txt('storyImageAlt','Emblem description'),
  photo('backgroundImage','Built on faith background image',{hint:'Wide supporting background behind the story section.'})
]);
const showcase=object('showcase','Road ahead graphic & message',[
  str('eyebrow','Section label'),str('headline1','Headline line 1'),str('headline2','Headline line 2'),txt('intro','Section description'),str('button','Link to quote form')
]);
const quote=object('quote','Request a quote form',[
  str('eyebrow','Section label'),str('headline1','Headline line 1'),str('headline2','Headline line 2'),txt('intro','Section introduction'),txt('smallNote','Phone/text/email reminder'),
  photo('backgroundImage','Contact section background image',{hint:'Wide atmospheric background behind the quote/contact section.'}),
  str('nameLabel','Name label'),str('namePlaceholder','Name placeholder'),str('phoneLabel','Visitor phone label'),str('emailLabel','Visitor email label'),txt('contactHelp','Instructions for visitor contact details'),str('pickupLabel','Pickup label'),str('pickupPlaceholder','Pickup placeholder'),
  str('destinationLabel','Delivery label'),str('destinationPlaceholder','Delivery placeholder'),str('loadLabel','Items label'),str('loadPlaceholder','Items placeholder'),
  str('dateLabel','Timing label'),str('datePlaceholder','Timing placeholder'),str('submitButton','Send request button label'),
  str('emailButton','Email action label'),str('copyButton','Copy action label'),txt('disclaimer','Privacy / request note (stored for reference)')
]);
export function cmsConfig(setup){
  let origin='https://not-configured.invalid';
  try {const url=new URL(setup.oauthOrigin||'');if(url.protocol==='https:'&&url.origin===setup.oauthOrigin)origin=url.origin;}catch{}
  let site;
  try {const url=new URL(setup.siteUrl||'');if(url.protocol==='https:')site=url.href;}catch{}
  return {
    backend:{name:'github',repo:setup.repository||'macv0223/psalm-23-trasnportation',branch:setup.branch||'main',base_url:origin,auth_endpoint:'auth',squash_merges:true},
    publish_mode:'editorial_workflow',media_folder:'public/assets/uploads',public_folder:'assets/uploads',
    site_url:site,display_url:site,logo_url:'../assets/favicon.png',show_preview_links:false,
    collections:[{name:'site',label:'Website content',description:'All words, services, imagery and contact information in one place.',files:[{
      name:'site',label:'Psalm 23 website',file:'content/site.json',fields:[settings,
        object('navigation','Navigation labels',[str('home','Home'),str('services','What We Transport'),str('story','Our Story'),str('process','How It Works'),str('contact','Contact'),str('quote','Request a Quote')]),
        hero,
        {name:'values',label:'Four business commitments (the icon strip)',widget:'list',min:4,max:4,summary:'{{fields.title}}',fields:[{name:'icon',label:'Icon',widget:'select',options:['shield','cross','users','heart']},str('title','Value / promise')]},
        services,process,story,showcase,quote
      ]
    }]}]
  };
}
export function isConfigured(setup){
  try{const repo=String(setup.repository||'');const origin=String(setup.oauthOrigin||'');const url=new URL(origin);
    return /^[\w.-]+\/[\w.-]+$/.test(repo) && !repo.includes('YOUR-') && url.protocol==='https:' && url.origin===origin && !['example.com','example.org','not-configured.invalid'].includes(url.hostname) && !url.hostname.toLowerCase().startsWith('your-');
  }catch{return false;}
}
