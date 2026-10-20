// Public-site behavior: menus, image fallbacks, and the secure online quote form.
const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#primary-navigation');
if(menu&&nav){
  const close=()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');nav.classList.remove('is-open')};
  menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open)});
  nav.addEventListener('click',event=>{if(event.target.closest('a'))close()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
}
document.querySelectorAll('[data-image-fallback]').forEach(img=>{
  img.addEventListener('error',()=>{const fallback=img.dataset.imageFallback;if(fallback&&img.getAttribute('src')!==fallback){img.removeAttribute('data-image-fallback');img.src=fallback}});
  if(img.complete&&img.naturalWidth===0)img.dispatchEvent(new Event('error'));
});
const form=document.querySelector('#quote-form');
if(form){
  const status=document.querySelector('#form-status');
  const submit=form.querySelector('button[type="submit"]');
  const emailInput=form.querySelector('[name="customerEmail"]');
  const phoneInput=form.querySelector('[name="customerPhone"]');
  const endpoint=form.dataset.endpoint||'';
  const enabled=form.dataset.enabled==='true'&&endpoint.startsWith('https://');
  const setStatus=(message,state='')=>{status.textContent=message;state?status.dataset.state=state:delete status.dataset.state};
  const value=name=>String(new FormData(form).get(name)||'').trim();
  const validateContact=()=>{
    const email=value('customerEmail');
    const phone=value('customerPhone');
    const cleanDigits=phone.replace(/\D/g,'');
    // Use browser-native validation and direct focus for an accessible error.
    emailInput.setCustomValidity(!email&&!phone?'Please enter a phone number or an email address.':'');
    phoneInput.setCustomValidity(phone&&cleanDigits.length<7?'Please enter a valid phone number.':'');
    const valid=form.reportValidity();
    if(!valid){setStatus('Please check the highlighted fields. Include a phone number or email address so we can reply.','error')}
    return valid;
  };
  for(const input of [emailInput,phoneInput])input.addEventListener('input',()=>{emailInput.setCustomValidity('');phoneInput.setCustomValidity('')});
  const payload=()=>({
    customerName:value('customerName'),
    customerEmail:value('customerEmail'),
    customerPhone:value('customerPhone'),
    pickup:value('pickup'),
    destination:value('destination'),
    load:value('load'),
    timeframe:value('timeframe'),
    companyWebsite:value('companyWebsite'),
    turnstileToken:value('cf-turnstile-response'),
    requestId:typeof globalThis.crypto?.randomUUID==='function'?globalThis.crypto.randomUUID():`q-${Date.now()}`
  });
  const formatted=()=>{
    const d=payload();
    return [
      'Hello, I would like a quote from Psalm 23 Transportation.','',
      'Name: '+d.customerName,
      'Phone: '+(d.customerPhone||'Not provided'),
      'Email: '+(d.customerEmail||'Not provided'),
      'Pickup location: '+d.pickup,
      'Delivery location: '+d.destination,
      'Items to transport: '+d.load,
      ...(d.timeframe?['Preferred timeframe: '+d.timeframe]:[]),
      '', 'Please contact me about availability and pricing. Thank you!'
    ].join('\n');
  };
  const resetChallenge=()=>{try{if(window.turnstile)window.turnstile.reset(form.querySelector('.cf-turnstile'))}catch{}};
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!enabled){setStatus('Online sending has not been connected yet. Please call the business or select “Prepare email instead”.','error');return}
    if(!validateContact())return;
    const data=payload();
    if(!data.turnstileToken){setStatus('Please complete the security check before sending.','error');return}
    submit.disabled=true;
    const before=submit.innerHTML;
    submit.textContent='Sending securely…';
    setStatus('Sending your quote request to Psalm 23 Transportation…','sending');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),22000);
    try{
      const response=await fetch(endpoint,{
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify(data),
        cache:'no-store',
        signal:controller.signal
      });
      const result=await response.json().catch(()=>null);
      if(response.ok&&result?.accepted){
        if(result.sent?.email&&result.sent?.sms){
          setStatus('Your request has been submitted! The business email alert was accepted and the text alert was queued. We will contact you using the details you provided.','success');
        }else if(result.sent?.email){
          setStatus('Your request was submitted by email, but the text alert could not be queued. Please do not resubmit; the business can reply to your contact details.','partial');
        }else{
          setStatus('Your request was queued by text, but the email notification failed. Please call the business to confirm rather than submitting twice.','partial');
        }
        form.reset();
      }else{
        const safeMessage=typeof result?.message==='string'&&result.message.length<=220?result.message:'We could not confirm that your request was delivered. Please call or use the email option below.';
        setStatus(safeMessage,'error');
      }
    }catch(error){
      setStatus(error?.name==='AbortError'
        ?'Sending took too long and delivery cannot be confirmed. Please contact us rather than submitting the same request again.'
        :'Unable to connect to the secure quote service. Please use “Prepare email instead” or call us.','error');
    }finally{
      clearTimeout(timeout);
      resetChallenge();
      submit.innerHTML=before;
      submit.disabled=!enabled;
    }
  });
  form.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',async()=>{
    if(!validateContact())return;
    const message=formatted();
    if(button.dataset.action==='email'){
      const address=form.dataset.email;
      const subject=encodeURIComponent('Psalm 23 Transportation — New quote request');
      window.location.href=`mailto:${address}?subject=${subject}&body=${encodeURIComponent(message)}`;
      setStatus('Your email app will open a draft. Please review and send it yourself. This backup does not submit the website form.');
    }else if(button.dataset.action==='copy'){
      try{await navigator.clipboard.writeText(message);setStatus('Quote details copied. Paste them into your email or messaging app to send.','success')}
      catch{const textarea=document.createElement('textarea');textarea.value=message;textarea.readOnly=true;textarea.style.position='fixed';textarea.style.top='-1000px';document.body.append(textarea);textarea.select();const ok=document.execCommand('copy');textarea.remove();setStatus(ok?'Quote details copied. Paste them into an email to send.':'Copy was blocked by your browser. Please email or call us directly.',ok?'success':'error')}
    }
  }));
}
