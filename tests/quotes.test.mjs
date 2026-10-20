import test from 'node:test';
import assert from 'node:assert/strict';
import quotes,{validateQuote} from '../cms/quotes/worker.mjs';
import {readFileSync} from 'node:fs';
import {renderDocument,validateSite} from '../public/assets/render.js';

const host='https://psalm23transportation.com';
const uri='https://psalm23-quote-notifications.example.workers.dev/api/quote';
const sid='AC'+'a'.repeat(32);
const validEnv=()=>({
  ALLOWED_ORIGINS:[host,'https://www.psalm23transportation.com','https://macv0223.github.io'].join(','),
  RESEND_API_KEY:'secret-resend-key',RESEND_FROM:'Psalm 23 Transportation <quotes@psalm23transportation.com>',
  TWILIO_ACCOUNT_SID:sid,TWILIO_AUTH_TOKEN:'secret-twilio-token',TWILIO_FROM_NUMBER:'+15555551212',
  TURNSTILE_SECRET_KEY:'secret-turnstile-key',QUOTE_TO_EMAIL:'Psalm23Transportation@yahoo.com',QUOTE_TO_PHONE:'+12817661320'
});
const fields=()=>({customerName:'Alex Example',customerEmail:'alex@example.net',customerPhone:'(713) 555-0199',pickup:'Houston TX',destination:'Dallas TX',load:'A piece of equipment weighing about 800 pounds',timeframe:'Next Monday',companyWebsite:'',turnstileToken:'test-token-fully-completed',requestId:'27b2e2f7-01fa-4950-8f99-0c68213971e7'});
const makeRequest=(p=fields(),origin=host)=>new Request(uri,{method:'POST',headers:{'Origin':origin,'Content-Type':'application/json'},body:JSON.stringify(p)});
const json=async response=>({status:response.status,body:await response.json()});
const withFetch=async(fake,fn)=>{const old=globalThis.fetch;globalThis.fetch=fake;try{return await fn()}finally{globalThis.fetch=old}};

test('site keeps business notification config optional and public (secrets never embedded)',()=>{
  const site=JSON.parse(readFileSync(new URL('../content/site.json',import.meta.url),'utf8'));
  assert.equal(validateSite(site),true);
  let html=renderDocument(site);
  assert.match(html,/name="customerEmail"/);
  assert.match(html,/name="customerPhone"/);
  assert.match(html,/disabled aria-disabled="true"/);
  assert.doesNotMatch(html,/data-endpoint="https:/);
  site.settings.quoteApiEndpoint='https://psalm23-quote-notifications.example.workers.dev/api/quote';
  site.settings.turnstileSiteKey='0x123456789abcdef000001';
  html=renderDocument(site);
  assert.match(html,/data-enabled="true"/);
  assert.match(html,/class="cf-turnstile"/);
  assert.match(html,/data-action="quote_request"/);
  assert.match(html,/https:\/\/challenges.cloudflare.com\/turnstile\/v0\/api.js/);
  assert.doesNotMatch(html,/disabled aria-disabled="true"/);
  site.settings.quoteApiEndpoint='javascript:alert(1)';
  assert.throws(()=>validateSite(site),/Quote endpoint/);
});

test('validates customer contact and mandatory quote fields',()=>{
  assert.ok(validateQuote(fields()));
  for(const key of ['customerName','pickup','destination','load']){
    const x=fields();x[key]='';assert.equal(validateQuote(x),null,key);
  }
  const missing=fields();missing.customerEmail='';missing.customerPhone='';assert.equal(validateQuote(missing),null);
  const byPhone=fields();byPhone.customerEmail='';assert.ok(validateQuote(byPhone));
  const byEmail=fields();byEmail.customerPhone='';assert.ok(validateQuote(byEmail));
  const invalid=fields();invalid.customerEmail='not-a-mailbox';assert.equal(validateQuote(invalid),null);
  const huge=fields();huge.load='x'.repeat(2600);assert.equal(validateQuote(huge),null);
  const tooLong=fields();tooLong.turnstileToken='x'.repeat(2049);assert.equal(validateQuote(tooLong),null);
});

test('worker health only claims ready with complete provider configuration',async()=>{
  let r=await json(await quotes.fetch(new Request('https://worker.example.workers.dev/health'),validEnv()));
  assert.deepEqual(r,{status:200,body:{service:'psalm23-quotes',ready:true}});
  const env=validEnv();delete env.RESEND_API_KEY;
  r=await json(await quotes.fetch(new Request('https://worker.example.workers.dev/health'),env));
  assert.equal(r.body.ready,false);
});

test('approved live origin: Turnstile validation then sends detailed email and text notification',async()=>{
  const calls=[];
  await withFetch(async(url,options)=>{
    calls.push({url:String(url),options});
    if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'psalm23transportation.com',action:'quote_request'});
    if(String(url).includes('resend.com'))return Response.json({id:'email-accepted'});
    if(String(url).includes('twilio.com'))return Response.json({sid:'SM123',status:'queued'},{status:201});
    throw new Error('unknown provider');
  },async()=>{
    const response=await json(await quotes.fetch(makeRequest(),validEnv()));
    assert.equal(response.status,200);
    assert.deepEqual(response.body.sent,{email:true,sms:true});
    assert.equal(response.body.accepted,true);
    assert.equal(response.body.message.includes('gateway'),true);
  });
  assert.equal(calls.length,3);
  const verifyBody=calls[0].options.body;
  assert.equal(verifyBody.get('secret'),'secret-turnstile-key');
  assert.equal(verifyBody.get('response'),fields().turnstileToken);
  const sentEmail=JSON.parse(calls[1].options.body);
  assert.deepEqual(sentEmail.to,['Psalm23Transportation@yahoo.com']);
  assert.equal(sentEmail.reply_to,'alex@example.net');
  assert.match(sentEmail.text,/Alex Example/);
  assert.match(sentEmail.text,/Houston TX/);
  assert.match(sentEmail.text,/Dallas TX/);
  assert.match(sentEmail.text,/800 pounds/);
  assert.match(calls[1].options.headers['Idempotency-Key'],/psalm23-quote-/);
  const message=calls[2].options.body;
  assert.equal(message.get('To'),'+12817661320');
  assert.equal(message.get('From'),'+15555551212');
  assert.match(message.get('Body'),/Alex Example/);
  assert.ok(message.get('Body').includes('Houston TX'));
});

test('worker prevents unauthorized cross-origin submissions before provider requests',async()=>{
  await withFetch(async()=>{throw new Error('should not call providers')},async()=>{
    const r=await json(await quotes.fetch(makeRequest(fields(),'https://other-site.example'),validEnv()));
    assert.equal(r.status,403);
    assert.equal(r.body.accepted,false);
  });
});

test('missing SMS or email configuration disables submission rather than silently ignoring a channel',async()=>{
  await withFetch(async()=>{throw new Error('should not call providers')},async()=>{
    const env=validEnv();delete env.TWILIO_AUTH_TOKEN;
    const r=await json(await quotes.fetch(makeRequest(),env));
    assert.equal(r.status,503);
    assert.equal(r.body.accepted,false);
  });
});

test('Turnstile invalid or from a different hostname blocks all sends',async()=>{
  let called=0;
  await withFetch(async()=>{called++;return Response.json({success:true,hostname:'bad.example',action:'quote_request'})},async()=>{
    const r=await json(await quotes.fetch(makeRequest(),validEnv()));
    assert.equal(r.status,403);
  });
  assert.equal(called,1);
});

test('partial delivery reports truthful channel status instead of asking to resend',async()=>{
  await withFetch(async(url)=>{
    if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'psalm23transportation.com',action:'quote_request'});
    if(String(url).includes('resend.com'))return Response.json({id:'accepted'});
    if(String(url).includes('twilio.com'))return Response.json({error:'sender unverified'},{status:403});
  },async()=>{
    const r=await json(await quotes.fetch(makeRequest(),validEnv()));
    assert.equal(r.status,200);
    assert.deepEqual(r.body.sent,{email:true,sms:false});
    assert.equal(r.body.accepted,true);
  });
});

test('both providers unavailable returns error and does not claim delivery',async()=>{
  await withFetch(async(url)=>{
    if(String(url).includes('siteverify'))return Response.json({success:true,hostname:'psalm23transportation.com',action:'quote_request'});
    return Response.json({error:'unavailable'},{status:503});
  },async()=>{
    const r=await json(await quotes.fetch(makeRequest(),validEnv()));
    assert.equal(r.status,502);
    assert.deepEqual(r.body.sent,{email:false,sms:false});
    assert.equal(r.body.accepted,false);
  });
});

test('CORS OPTIONS preflight supports the live site but rejects unapproved origins',async()=>{
  let request=new Request(uri,{method:'OPTIONS',headers:{Origin:host,'Access-Control-Request-Method':'POST'}});
  let response=await quotes.fetch(request,validEnv());
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),host);
  request=new Request(uri,{method:'OPTIONS',headers:{Origin:'https://spam.example','Access-Control-Request-Method':'POST'}});
  response=await quotes.fetch(request,validEnv());
  assert.equal(response.status,403);
});

test('input validation and strict content type prevent provider calls',async()=>{
  await withFetch(async()=>{throw new Error('should not call')},async()=>{
    const input=fields();input.customerName='';
    let r=await json(await quotes.fetch(makeRequest(input),validEnv()));
    assert.equal(r.status,400);
    const req=new Request(uri,{method:'POST',headers:{Origin:host,'Content-Type':'text/plain'},body:'anything'});
    r=await json(await quotes.fetch(req,validEnv()));
    assert.equal(r.status,415);
  });
});
