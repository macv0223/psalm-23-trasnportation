// Cloudflare Worker for Decap CMS's GitHub OAuth popup flow.
// Secrets must be configured in Cloudflare, never placed in GitHub or public JS.
const encoder=new TextEncoder();
const cookieName='__Host-psalm23-oauth';
const baseHeaders={
  'Cache-Control':'no-store',
  'Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY'
};
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
const random=()=>b64(crypto.getRandomValues(new Uint8Array(32)));
const safeJson=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const cookie=(value,age=600)=>`${cookieName}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
const error=(message,status=400,clear=true)=>new Response(message,{status,headers:{...baseHeaders,'Content-Type':'text/plain;charset=utf-8',...(clear?{'Set-Cookie':cookie('',0)}:{})}});
async function hmacKey(secret){return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
async function signSession(data,secret){
  const payload=b64(encoder.encode(JSON.stringify(data)));
  const signature=await crypto.subtle.sign('HMAC',await hmacKey(secret),encoder.encode(payload));
  return `${payload}.${b64(new Uint8Array(signature))}`;
}
async function readSession(value,secret){
  if(!value||value.length>3000)return null;
  try{
    const [payload,signature,extra]=value.split('.');
    if(extra||!signature)return null;
    if(!await crypto.subtle.verify('HMAC',await hmacKey(secret),unb64(signature),encoder.encode(payload)))return null;
    const session=JSON.parse(new TextDecoder().decode(unb64(payload)));
    if(!session.state||!session.verifier||!Number.isFinite(session.created)||Date.now()-session.created>600000||session.created>Date.now()+1000)return null;
    return session;
  }catch{return null;}
}
function config(env){
  const cms=new URL(env.CMS_ORIGIN||'');
  const auth=new URL(env.AUTH_ORIGIN||'');
  if(cms.protocol!=='https:'||auth.protocol!=='https:'||cms.origin!==env.CMS_ORIGIN||auth.origin!==env.AUTH_ORIGIN)throw new Error('Exact HTTPS origins required');
  if(!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(env.REPOSITORY||''))throw new Error('A valid repository is required');
  if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET||String(env.SESSION_SECRET||'').length<32)throw new Error('OAuth credentials are missing');
  const users=String(env.ALLOWED_USERS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  const emails=String(env.ALLOWED_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(emails.some(x=>! /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(x)))throw new Error('Invalid admin email');
  if(!users.length&&!emails.length)throw new Error('An editor allowlist is required');
  return{cms:cms.origin,auth:auth.origin,users,emails,scope:(env.PRIVATE_REPOSITORY==='true'?'repo':'public_repo')+(emails.length?' user:email':'')};
}
function authorizedPopup(token,origin,role){
  const nonce=random();
  const payload='authorization:github:success:'+JSON.stringify({token,provider:'github',role});
  const js=`const origin=${safeJson(origin)},payload=${safeJson(payload)};if(window.opener){const timer=setTimeout(()=>{document.querySelector('#message').textContent='Return to the editor and try again.'},30000);function receive(e){if(e.origin!==origin||e.source!==window.opener||e.data!=='authorizing:github')return;clearTimeout(timer);window.removeEventListener('message',receive);window.opener.postMessage(payload,origin);setTimeout(()=>window.close(),250)}window.addEventListener('message',receive);window.opener.postMessage('authorizing:github',origin)}else{document.querySelector('#message').textContent='Return to the editor to finish sign-in.'}`;
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Psalm 23 Transportation editor sign-in</title><style nonce="${nonce}">body{font:18px/1.7 system-ui;color:#12312f;background:#f6f4ed;padding:45px;max-width:650px;margin:auto}</style></head><body><h1>You're connected.</h1><p id="message">Returning to your editor…</p><script nonce="${nonce}">${js}</script></body></html>`;
  return new Response(html,{headers:{...baseHeaders,'Content-Type':'text/html;charset=utf-8','Set-Cookie':cookie('',0),'Content-Security-Policy':`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'`}});
}
export default {
  async fetch(request,env){
    let setup;
    try{setup=config(env)}catch{return error('Editor authentication is not yet configured.',503,false)}
    const url=new URL(request.url);
    if(url.origin!==setup.auth)return error('Unexpected authentication host.',400,false);
    if(request.method!=='GET')return error('Method not allowed.',405,false);
    if(url.pathname==='/auth'){
      const provider=url.searchParams.get('provider');
      if(provider&&provider!=='github')return error('Unsupported sign-in provider.');
      const session={state:random(),verifier:random(),created:Date.now()};
      const challenge=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(session.verifier))));
      const target=new URL('https://github.com/login/oauth/authorize');
      for(const [name,value] of Object.entries({client_id:env.GITHUB_CLIENT_ID,redirect_uri:setup.auth+'/callback',scope:setup.scope,state:session.state,code_challenge:challenge,code_challenge_method:'S256',allow_signup:'false'}))target.searchParams.set(name,value);
      return new Response(null,{status:302,headers:{...baseHeaders,Location:target.href,'Set-Cookie':cookie(await signSession(session,env.SESSION_SECRET))}});
    }
    if(url.pathname==='/callback'){
      const raw=(request.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
      const session=await readSession(raw,env.SESSION_SECRET);
      if(!session||url.searchParams.get('state')!==session.state)return error('Sign-in verification failed. Return to the editor and try again.',403);
      if(url.searchParams.get('error')||!url.searchParams.get('code'))return error('GitHub sign-in was cancelled. Return to the editor to try again.');
      try{
        const tokenResponse=await fetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:setup.auth+'/callback',code_verifier:session.verifier})});
        if(!tokenResponse.ok)return error('GitHub authentication is temporarily unavailable.',502);
        const credentials=await tokenResponse.json();
        if(!credentials.access_token||credentials.token_type!=='bearer')return error('GitHub could not finish sign-in.',403);
        const headers={Accept:'application/vnd.github+json',Authorization:'Bearer '+credentials.access_token,'User-Agent':'Psalm23-Transportation-CMS','X-GitHub-Api-Version':'2022-11-28'};
        const userResponse=await fetch('https://api.github.com/user',{headers});
        if(!userResponse.ok)return error('Your GitHub account could not be checked.',403);
        const user=await userResponse.json();
        const approvedUser=setup.users.includes(String(user.login||'').toLowerCase());
        let approvedEmail=false;
        if(setup.emails.length){
          const emailsResponse=await fetch('https://api.github.com/user/emails?per_page=100',{headers});
          if(!emailsResponse.ok)return error('Verified GitHub email addresses could not be checked. Please authorize email access.',403);
          const emails=await emailsResponse.json();
          if(!Array.isArray(emails))return error('GitHub email response was invalid.',403);
          approvedEmail=emails.some(e=>e.verified===true&&setup.emails.includes(String(e.email||'').trim().toLowerCase()));
        }
        if(!approvedUser&&!approvedEmail)return error('This account has not been approved as a website editor.',403);
        const repoResponse=await fetch('https://api.github.com/repos/'+env.REPOSITORY,{headers});
        if(!repoResponse.ok)return error('Your GitHub account does not have access to this repository.',403);
        const repo=await repoResponse.json();
        if(!repo.permissions?.push)return error('Your account needs repository edit permission.',403);
        return authorizedPopup(credentials.access_token,setup.cms,(approvedEmail||repo.permissions.admin)?'admin':'editor');
      }catch{return error('Sign-in could not be completed. Please try again.',502)}
    }
    return error('Not found.',404,false);
  }
};
