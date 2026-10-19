"""Visual smoke test with all local images, styles and scripts embedded (no HTTP)."""
from pathlib import Path
import base64,re,mimetypes
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'dist/index.html').read_text()
css=(root/'dist/assets/site.css').read_text()
js=(root/'dist/assets/app.js').read_text()
# Inject CSS-backed scene image as data URI, plus the document's img sources.
css_url="uploads/psalm23-hero-scene.webp"
asset=root/'dist/assets'/css_url
uri='data:image/webp;base64,'+base64.b64encode(asset.read_bytes()).decode('ascii')
css=css.replace("url('"+css_url+"')","url('"+uri+"')")
html=html.replace('<link rel="stylesheet" href="assets/site.css">','<style>'+css+'</style>')
html=html.replace('<script type="module" src="assets/app.js"></script>','<script>'+js+'</script>')
html=re.sub(r'<link rel="preload"[^>]+>','',html)
images=set(re.findall(r'(?:src|data-image-fallback)="(assets/[^"<>]+)"',html))
for rel in images:
    mime=mimetypes.guess_type(rel)[0] or 'application/octet-stream'
    data='data:'+mime+';base64,'+base64.b64encode((root/'dist'/rel).read_bytes()).decode('ascii')
    html=html.replace('="'+rel+'"','="'+data+'"')
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for label,width,height in [('desktop',1440,900),('tablet',834,1100),('mobile',390,844),('narrow',320,700)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.evaluate('async()=>{await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))}')
        assert 'HE LEADS.' in page.locator('h1').inner_text()
        assert page.locator('.service-card').count()==3
        assert page.locator('.step-card').count()==3
        assert page.locator('.value-card').count()==4
        assert page.locator('.hero-backdrop').count()==1
        assert page.locator('.faith-image').count()==1
        assert page.locator('#quote-form input[required]').count()==3
        assert page.locator('#quote-form textarea[required]').count()==1
        status=page.locator('img').evaluate_all('(imgs)=>imgs.map(i=>({ok:i.complete&&i.naturalWidth>0,src:i.getAttribute("alt")}))')
        assert all(x['ok'] for x in status),(label,status)
        bounds=page.evaluate('({document:document.documentElement.scrollWidth,body:document.body.scrollWidth,client:document.documentElement.clientWidth})')
        assert bounds['document']<=width+1 and bounds['body']<=width+1,(label,'overflow',bounds)
        if width<=890:
            menu=page.locator('.menu-toggle');assert menu.is_visible();menu.click()
            assert menu.get_attribute('aria-expanded')=='true'
            assert page.locator('#primary-navigation').is_visible()
            page.locator('#primary-navigation a[href="#services"]').click()
            assert menu.get_attribute('aria-expanded')=='false'
        page.locator('#quote-form button[type="submit"]').click()
        assert not page.locator('#customer-name').evaluate('(e)=>e.validity.valid')
        if label in ('desktop','mobile'):
            page.evaluate('()=>{document.activeElement?.blur?.();window.scrollTo(0,0)}')
            page.wait_for_timeout(140)
            out=Path('/mnt/data')/f'Psalm23-Reference-Layout-{label}.png'
            page.screenshot(path=str(out),full_page=True,animations='disabled')
            print('Saved screenshot:',out)
        assert not errors,(label,errors)
        print(label,'viewport:',width,'page width:',bounds,'images:',len(status),'JS errors:',errors)
        page.close()
    browser.close()
