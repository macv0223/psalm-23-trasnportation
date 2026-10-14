import {media} from '../public/assets/render.js';
const str=(name,label,extra={})=>({name,label,widget:'string',...extra});
const txt=(name,label,extra={})=>({name,label,widget:'text',...extra});
const photo=(name,label,extra={})=>({name,label,widget:'image',required:false,allow_multiple:false,...extra});
const object=(name,label,fields)=>({name,label,widget:'object',collapsed:false,fields});
const hexPattern=['^#[0-9a-fA-F]{6}$','Use a six-digit hex value, such as #12312f'];
const sectionSettings=object('settings','Branding & contact details',[
  str('businessName','Business name'),str('brandTop','Logo wordmark: top line'),str('brandBottom','Logo wordmark: bottom line'),
  str('phone','Phone / text number'),str('email','Contact email',{pattern:['^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$','Enter a valid email address']}),
  photo('logo','Primary puzzle-cross logo',{hint:'The new bronze-and-green jigsaw cross is already installed. Upload a replacement here only if the business approves a new logo.'}),
  txt('logoAlt','Logo image description for accessibility'),str('tagline','Brand tagline'),str('verseReference','Scripture reference'),
  str('copyrightYear','Copyright year'),str('primaryColor','Dark green brand color',{pattern:hexPattern}),str('accentColor','Gold brand color',{pattern:hexPattern})
]);
const sectionHero=object('hero','Homepage hero',[
  str('eyebrow','Upper label'),str('headline1','Headline first line'),str('headline2','Headline second line'),
  txt('intro','Introductory paragraph'),str('primaryButton','Quote button text'),str('secondaryButton','Phone button text'),
  str('ribbon','Ribbon text under hero'),photo('heroImage','Optional truck / hero image'),txt('heroImageAlt','Hero image description',{required:false,hint:'Required only when a custom image is added.'})
]);
const sectionServices=object('services','Hauling services',[
  str('eyebrow','Upper label'),str('headline1','Headline first line'),str('headline2','Headline second line'),txt('intro','Introductory paragraph'),
  {name:'cards',label:'Transportation services — add, edit, or reorder',widget:'list',min:1,max:12,summary:'{{fields.number}} · {{fields.title}}',fields:[str('number','Number (01, 02, 03, etc.)'),str('title','Service title'),txt('description','Service details')]}
]);
const sectionStory=object('story','Our story',[
  str('eyebrow','Upper label'),str('headline1','Headline first line'),str('headline2','Headline second line'),
  txt('paragraph1','First paragraph'),txt('paragraph2','Second paragraph'),txt('verse','Bible verse / quotation'),str('verseCitation','Verse citation'),
  photo('storyImage','Optional story photo'),txt('storyImageAlt','Story image description',{required:false,hint:'Required only when a custom image is added.'})
]);
const sectionQuote=object('quote','Quote request form',[
  str('eyebrow','Upper label'),str('headline1','Headline first line'),str('headline2','Headline second line'),txt('intro','Introductory paragraph'),
  txt('smallNote','Direct-text reminder'),str('nameLabel','Name label'),str('namePlaceholder','Name placeholder'),
  str('pickupLabel','Pickup label'),str('pickupPlaceholder','Pickup placeholder'),str('destinationLabel','Destination label'),str('destinationPlaceholder','Destination placeholder'),
  str('loadLabel','Items to transport label'),str('loadPlaceholder','Item description placeholder'),str('dateLabel','Timing label'),str('datePlaceholder','Timing placeholder'),
  str('submitButton','Text button label'),str('emailButton','Email button label'),str('copyButton','Copy button label'),txt('disclaimer','Message submission explanation')
]);
export function cmsConfig(setup){
  const oauth=String(setup.oauthOrigin||'').trim();
  let origin='https://not-configured.invalid';
  try{const parsed=new URL(oauth);if(parsed.protocol==='https:'&&parsed.origin===oauth)origin=oauth}catch{}
  const site=String(setup.siteUrl||'').trim();
  const hasSite=(()=>{try{return new URL(site).protocol==='https:'}catch{return false}})();
  return {
    backend:{name:'github',repo:setup.repository||'YOUR-GITHUB-USERNAME/psalm-23-transportation',branch:setup.branch||'main',base_url:origin,auth_endpoint:'auth',squash_merges:true},
    publish_mode:'editorial_workflow',media_folder:'public/assets/uploads',public_folder:'assets/uploads',
    site_url:hasSite?site:undefined,display_url:hasSite?site:undefined,
    logo_url:'../assets/favicon.png',show_preview_links:false,
    collections:[
      {name:'site',label:'Edit website',description:'Edit every public section of Psalm 23 Transportation here.',files:[
        {name:'site',label:'All website content',file:'content/site.json',fields:[
          sectionSettings,
          object('navigation','Navigation links',[str('services','Services link'),str('story','Story link'),str('quote','Quote link')]),
          sectionHero,sectionServices,sectionStory,sectionQuote
        ]}
      ]}
    ]
  };
}
export function isConfigured(setup){
  try{
    const repo=String(setup.repository||'');const oauth=String(setup.oauthOrigin||'');const uri=new URL(oauth);
    return /^[\w.-]+\/[\w.-]+$/.test(repo)&&!repo.includes('YOUR-')&&uri.protocol==='https:'&&uri.origin===oauth&&!['example.com','example.org','not-configured.invalid'].includes(uri.hostname)&&!uri.hostname.toLowerCase().startsWith('your-');
  }catch{return false}
}
