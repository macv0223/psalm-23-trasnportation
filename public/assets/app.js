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
  const details=()=>{
    if(!form.reportValidity())return null;
    const get=n=>String(new FormData(form).get(n)||'').trim();
    const lines=[
      'Hello, I would like to request a quote from Psalm 23 Transportation.',
      '',
      'Name: '+get('customerName'),
      'Pickup: '+get('pickup'),
      'Destination: '+get('destination'),
      'Items to transport: '+get('load'),
      ...(get('timeframe')?['Preferred timeframe: '+get('timeframe')]:[]),
      '',
      'Please let me know what other details you need. Thank you!'
    ];
    return lines.join('\n');
  };
  const openSms=message=>{
    const phone=form.dataset.phone||'';
    const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
    const uri=`sms:${phone}${ios?'&':'?'}body=${encodeURIComponent(message)}`;
    status.textContent='Your message should open in your messaging app. Please review and send it there. If that does not work, use “Copy request” or “Email instead”.';
    window.location.href=uri;
  };
  form.addEventListener('submit',event=>{event.preventDefault();const message=details();if(message)openSms(message)});
  form.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('click',async()=>{
    const message=details();if(!message)return;
    if(button.dataset.action==='email'){
      const email=form.dataset.email;
      const subject=encodeURIComponent('Transportation quote request');
      location.href=`mailto:${email}?subject=${subject}&body=${encodeURIComponent(message)}`;
      status.textContent='Your email app should open with a draft. Review and send it to submit your request.';
    }else if(button.dataset.action==='copy'){
      try{await navigator.clipboard.writeText(message);status.textContent='Quote request copied. Paste it into any messaging or email app to send.'}
      catch{const textarea=document.createElement('textarea');textarea.value=message;textarea.readOnly=true;textarea.style.position='fixed';textarea.style.top='-1000px';document.body.append(textarea);textarea.select();const ok=document.execCommand('copy');textarea.remove();status.textContent=ok?'Quote request copied. Paste it into a message to send.':'Copy was blocked by your browser. You can still type the details into a message directly.'}
    }
  }));
}
