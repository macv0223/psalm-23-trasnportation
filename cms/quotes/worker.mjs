/**
 * Psalm 23 Transportation quote notifier.
 * Cloudflare Worker deployed separately from the existing GitHub CMS OAuth Worker.
 * Public POST /api/quote: Turnstile-verified requests -> Resend email + Twilio SMS.
 * No API keys or private customer data are included in the GitHub Pages build.
 */
const MAX_BODY_BYTES=12000;
const EMAIL=/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const E164=/^\+[1-9]\d{7,14}$/;
const DEFAULT_TO_EMAIL='Psalm23Transportation@yahoo.com';
const DEFAULT_TO_PHONE='+12817661320';
const cleaned=(value,max)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max+1):'';
const goodLength=(value,min,max)=>value.length>=min&&value.length<=max;
function errorResponse(message,status,origin,extra={}){return asJson({accepted:false,message,...extra},status,origin)}
function asJson(data,status=200,origin=''){
  const headers=new Headers({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'});
  if(origin){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','POST,GET,OPTIONS');headers.set('Access-Control-Allow-Headers','Content-Type,Accept');headers.set('Access-Control-Max-Age','3600')}
  return new Response(JSON.stringify(data),{status,headers});
}
function allowedOrigin(request,env){
  const origin=request.headers.get('Origin')||'';
  const allowed=String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  return allowed.includes(origin)?origin:'';
}
function validConfig(env){
  const sid=String(env.TWILIO_ACCOUNT_SID||'');
  return Boolean(
    env.TURNSTILE_SECRET_KEY&&env.RESEND_API_KEY&&env.RESEND_FROM&&
    sid.startsWith('AC')&&sid.length===34&&env.TWILIO_AUTH_TOKEN&&
    (env.TWILIO_FROM_NUMBER||env.TWILIO_MESSAGING_SERVICE_SID)&&
    EMAIL.test(String(env.QUOTE_TO_EMAIL||DEFAULT_TO_EMAIL))&&
    E164.test(String(env.QUOTE_TO_PHONE||DEFAULT_TO_PHONE))&&
    String(env.ALLOWED_ORIGINS||'').trim()
  );
}
export function validateQuote(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const item={
    customerName:cleaned(input.customerName,120),
    customerEmail:cleaned(input.customerEmail,180),
    customerPhone:cleaned(input.customerPhone,25),
    pickup:cleaned(input.pickup,180),
    destination:cleaned(input.destination,180),
    load:cleaned(input.load,2500),
    timeframe:cleaned(input.timeframe,140),
    companyWebsite:cleaned(input.companyWebsite,80),
    turnstileToken:typeof input.turnstileToken==='string'?input.turnstileToken:'',
    requestId:cleaned(input.requestId,80)
  };
  const digits=item.customerPhone.replace(/\D/g,'');
  if(!goodLength(item.customerName,2,120)||!goodLength(item.pickup,2,180)||
    !goodLength(item.destination,2,180)||!goodLength(item.load,5,2500)||
    (item.customerEmail&&!EMAIL.test(item.customerEmail))||
    (item.customerPhone&&(digits.length<7||digits.length>15))||
    (!item.customerEmail&&!item.customerPhone)||
    !/^[a-zA-Z0-9_-]{4,80}$/.test(item.requestId)||
    !goodLength(item.turnstileToken,8,2048)||
    item.timeframe.length>140)return null;
  return item;
}
const toEmailText=(item)=>[
  'NEW QUOTE REQUEST — PSALM 23 TRANSPORTATION','',
  'Name: '+item.customerName,
  'Customer phone: '+(item.customerPhone||'Not provided'),
  'Customer email: '+(item.customerEmail||'Not provided'),
  'Pickup: '+item.pickup,
  'Destination: '+item.destination,
  'Items: '+item.load,
  'Preferred timeframe: '+(item.timeframe||'Not specified'),
  '', 'Reference: '+item.requestId,
  'Submitted through psalm23transportation.com'
].join('\n');
const toSmsText=item=>[
  'Psalm 23 quote request',
  'From: '+item.customerName,
  'Contact: '+(item.customerPhone||item.customerEmail),
  'Pickup: '+item.pickup,
  'To: '+item.destination,
  'Items: '+item.load.slice(0,130),
  'Full request emailed to '+DEFAULT_TO_EMAIL
].join('\n').slice(0,450);
async function verifyChallenge(request,item,env,origin){
  const data=new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:item.turnstileToken});
  const ip=request.headers.get('CF-Connecting-IP');
  if(ip)data.set('remoteip',ip);
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:data
  });
  if(!response.ok)return false;
  const check=await response.json();
  // Verify the exact origin host to prevent tokens issued for unrelated sites being replayed.
  return check.success===true&&check.hostname===new URL(origin).hostname&&check.action==='quote_request';
}
async function notifyEmail(item,env){
  const body={
    from:env.RESEND_FROM,
    to:[env.QUOTE_TO_EMAIL||DEFAULT_TO_EMAIL],
    subject:`Psalm 23 Transportation quote request — ${item.customerName}`,
    text:toEmailText(item)
  };
  if(item.customerEmail)body.reply_to=item.customerEmail;
  const response=await fetch('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`psalm23-quote-${item.requestId}`},
    body:JSON.stringify(body)
  });
  return response.ok;
}
async function notifySms(item,env){
  const account=env.TWILIO_ACCOUNT_SID;
  const auth=btoa(`${account}:${env.TWILIO_AUTH_TOKEN}`);
  const data=new URLSearchParams({To:env.QUOTE_TO_PHONE||DEFAULT_TO_PHONE,Body:toSmsText(item)});
  if(env.TWILIO_MESSAGING_SERVICE_SID)data.set('MessagingServiceSid',env.TWILIO_MESSAGING_SERVICE_SID);
  else data.set('From',env.TWILIO_FROM_NUMBER);
  const response=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages.json`,{
    method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:data
  });
  return response.ok;
}
export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const origin=allowedOrigin(request,env);
    if(url.pathname==='/health'&&request.method==='GET')return asJson({service:'psalm23-quotes',ready:validConfig(env)},200,origin);
    if(url.pathname!=='/api/quote')return errorResponse('Not found.',404,origin);
    if(request.method==='OPTIONS'){
      if(!origin)return new Response(null,{status:403});
      return new Response(null,{status:204,headers:{
        'Access-Control-Allow-Origin':origin,
        'Access-Control-Allow-Methods':'POST,OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type,Accept',
        'Access-Control-Max-Age':'3600',
        'Vary':'Origin'
      }});
    }
    if(request.method!=='POST')return errorResponse('Method not allowed.',405,origin);
    if(!origin)return errorResponse('This website is not approved to submit requests.',403,'');
    if(!validConfig(env))return errorResponse('Online quote sending is temporarily unavailable. Please contact the business directly.',503,origin);
    const length=Number(request.headers.get('Content-Length')||0);
    if(length>MAX_BODY_BYTES)return errorResponse('The request is too large.',413,origin);
    if(!String(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return errorResponse('The request format is invalid.',415,origin);
    let raw;
    try{raw=await request.text()}catch{return errorResponse('Unable to read the request.',400,origin)}
    if(new TextEncoder().encode(raw).length>MAX_BODY_BYTES)return errorResponse('The request is too large.',413,origin);
    let data;
    try{data=JSON.parse(raw)}catch{return errorResponse('Unable to read the form data.',400,origin)}
    const item=validateQuote(data);
    if(!item)return errorResponse('Please provide your name, contact details, pickup, destination and items to transport.',400,origin);
    // A hidden field must stay empty. Do not deliver spam.
    if(item.companyWebsite)return asJson({accepted:true,sent:{email:true,sms:true},message:'Request received.'},200,origin);
    let verified=false;
    try{verified=await verifyChallenge(request,item,env,origin)}catch{verified=false}
    if(!verified)return errorResponse('Security check expired or failed. Please complete it again.',403,origin);
    // The providers are independent; report partial submission honestly and do not auto-retry
    // a failed channel (which might cause a duplicate message).
    const result=await Promise.allSettled([notifyEmail(item,env),notifySms(item,env)]);
    const sent={email:result[0].status==='fulfilled'&&result[0].value===true,sms:result[1].status==='fulfilled'&&result[1].value===true};
    if(!sent.email&&!sent.sms)return errorResponse('Neither notification could be confirmed. Please call or prepare an email instead.',502,origin,{sent});
    return asJson({accepted:true,sent,message:sent.email&&sent.sms?'Request accepted by email service and SMS gateway.':sent.email?'Email accepted; SMS notification not confirmed.':'SMS queued; email notification not confirmed.'},200,origin);
  }
};
