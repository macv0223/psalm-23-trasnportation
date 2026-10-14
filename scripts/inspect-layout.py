from pathlib import Path
import base64, re, json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
html=(root/'dist/index.html').read_text()
css=re.sub(r'@import[^;]+;','',(root/'dist/assets/site.css').read_text(),count=1)
js=(root/'dist/assets/app.js').read_text()
for name,mime in [('assets/uploads/psalm23-puzzle-cross.webp','image/webp'),('assets/hauling-scene.svg','image/svg+xml'),('assets/favicon.png','image/png')]:
    html=html.replace(name,'data:'+mime+';base64,'+base64.b64encode((root/'dist'/name).read_bytes()).decode())
html=html.replace('<link rel="stylesheet" href="assets/site.css">','<style>'+css+'</style>').replace('<script type="module" src="assets/app.js"></script>','<script>'+js+'</script>')
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for name,width in [('desktop',1440),('tablet',1024),('mobile',390),('narrow',320)]:
        page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1)
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_timeout(130)
        data=page.evaluate('''()=>{let sels=['.hero-visual','.hero-logo-panel','.brand-cross','.hero-scene','.story-frame','.story-cross-image','.story-lightbox'];return Object.fromEntries(sels.map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect(),st=getComputedStyle(e);return[s,{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height),objectFit:st.objectFit,position:st.position}] }))}''')
        print(name,json.dumps(data))
        for selector,key in [('.hero-visual','hero'),('.story-frame','story')]:
            page.locator(selector).screenshot(path=str(root.parent/f'psalm23-{name}-{key}-BEFORE.png'))
        page.close()
    browser.close()
