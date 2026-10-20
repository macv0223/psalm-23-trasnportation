#!/usr/bin/env python3
"""Offline real Chromium smoke test; no network/localhost required in restricted environments."""
from pathlib import Path
import base64,re,mimetypes
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
out=Path('/mnt/data')
html=(root/'dist/index.html').read_text()
# The build already bundles identical stylesheet and JS into HTML. Only load artwork locally.
def data_uri(rel):
    p=root/'dist'/rel
    if not p.exists(): return None
    mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
    return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
for rel in sorted(set(re.findall(r'assets/(?:uploads/)?[a-zA-Z0-9_./\-]+\.(?:webp|png|jpg|jpeg|svg)',html)),key=len,reverse=True):
    d=data_uri(rel)
    if d:html=html.replace(rel,d)
html=re.sub(r'<link rel="preload"[^>]+>', '', html)
preview=out/'Psalm23-v8-Online-Quote-Preview.html'
preview.write_text(html)

with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for label,width,height in [('narrow',320,740),('mobile',390,844),('wide-phone',430,900),('tablet',768,1024),('desktop',1440,900)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.set_content(html,wait_until='domcontentloaded')
        page.evaluate('async()=>await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))')
        page.wait_for_timeout(80)
        assert page.locator('#quote-form').count()==1
        assert page.locator('input[name="customerEmail"]').count()==1
        assert page.locator('input[name="customerPhone"]').count()==1
        assert page.locator('#quote-form button[type=submit]').is_disabled(),'submit should stay disabled until Worker/Turnstile configured'
        assert page.locator('.form-note').inner_text().startswith('Online submissions are not activated')
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth+1'),label+' overflow'
        assert not errors,(label,errors)
        images=page.locator('img').evaluate_all('els=>els.map(x=>x.complete&&x.naturalWidth>0)')
        assert all(images),(label,'broken images')
        if width<=890:
            m=page.locator('.menu-toggle');m.click();assert m.get_attribute('aria-expanded')=='true'
            page.locator('#primary-navigation a[href="#services"]').click();assert m.get_attribute('aria-expanded')=='false'
        page.locator('#quote-form').scroll_into_view_if_needed()
        page.locator('input[name=customerName]').fill('Alex Example')
        page.locator('input[name=customerEmail]').fill('alex@example.com')
        page.locator('input[name=pickup]').fill('Houston, TX')
        page.locator('input[name=destination]').fill('Dallas, TX')
        page.locator('textarea[name=load]').fill('800 pound industrial equipment')
        page.locator('[data-action=copy]').click()
        assert page.locator('#form-status').inner_text(),label+' copy feedback missing'
        if label in ('mobile','desktop'):
            page.evaluate('window.scrollTo(0,0)')
            page.wait_for_timeout(80)
            file=out/f'Psalm23-v8-{label}-preview.png'
            page.screenshot(path=str(file),full_page=True,animations='disabled')
            print('screenshot',file)
        print('OK',label,width,'images:',len(images))
        page.close()

    # Exercise the actual inlined frontend POST handler with a fake remote provider response.
    mock=html.replace('data-endpoint="" data-enabled="false"','data-endpoint="https://quote-test.example.workers.dev/api/quote" data-enabled="true"')
    mock=mock.replace(' type="submit" disabled aria-disabled="true"',' type="submit"')
    mock=mock.replace('<button class="button button-gold submit-button"','<input name="cf-turnstile-response" type="hidden" value="test-token-123456"><button class="button button-gold submit-button"')
    marker='<script type="module" id="psalm23-matching-app-js">'
    assert marker in mock
    mock=mock.replace(marker,'<script>window.__sent=[];window.fetch=async(url,opts)=>{window.__sent.push({url,body:JSON.parse(opts.body)});return {ok:true,json:async()=>({accepted:true,sent:{email:true,sms:true}})};};</script>'+marker)
    page=browser.new_page(viewport={'width':390,'height':844})
    errors=[]
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.set_content(mock,wait_until='domcontentloaded')
    page.locator('input[name=customerName]').fill('Alex Example')
    page.locator('input[name=customerEmail]').fill('alex@example.com')
    page.locator('input[name=pickup]').fill('Houston, TX')
    page.locator('input[name=destination]').fill('Dallas, TX')
    page.locator('textarea[name=load]').fill('800 pound industrial equipment')
    page.locator('#quote-form button[type=submit]').click()
    page.wait_for_function('window.__sent.length === 1')
    page.wait_for_function('document.querySelector("#form-status").dataset.state === "success"')
    sent=page.evaluate('window.__sent')
    assert len(sent)==1,sent
    assert sent[0]['body']['customerEmail']=='alex@example.com',sent
    assert sent[0]['url'].endswith('/api/quote')
    assert not errors,errors
    print('OK configured frontend POST handler: direct fetch without opening SMS app')
    page.close()
    browser.close()
print('All offline responsive checks and frontend submission simulation passed.')
