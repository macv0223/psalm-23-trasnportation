"""Local image/layout smoke test using Playwright without HTTP/network access."""
from pathlib import Path
import base64,re
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
page_html=(root/'dist/index.html').read_text()
css=(root/'dist/assets/site.css').read_text()
css=re.sub(r'@import[^;]+;','',css,count=1)
js=(root/'dist/assets/app.js').read_text()
for filename,mime in [
    ('assets/uploads/psalm23-truck-logo.png','image/png'),
    ('assets/favicon.png','image/png')]:
    uri='data:'+mime+';base64,'+base64.b64encode((root/'dist'/filename).read_bytes()).decode()
    page_html=page_html.replace(filename,uri)
page_html=page_html.replace('<link rel="stylesheet" href="assets/site.css">','<style>'+css+'</style>')
page_html=page_html.replace('<script type="module" src="assets/app.js"></script>','<script>'+js+'</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for name,w,h in [('desktop',1440,960),('tablet',1024,820),('mobile',390,844),('narrow-mobile',320,700)]:
  page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda error: errors.append(str(error)))
  page.set_content(page_html,wait_until='domcontentloaded')
  page.wait_for_timeout(300)
  headline=' '.join(page.locator('h1').inner_text().split())
  assert headline=='Moving. With purpose.',f'{name}: bad headline {headline}'
  assert page.locator('.service-card').count()==3
  assert page.locator('.brand-symbol').count()==2
  assert page.locator('.brand-truck').count()==1
  assert page.locator('.story-truck-image').count()==1
  assert page.locator('#quote-form input').count()==4
  assert page.locator('.quote-info a[href^="tel:"]').count()==1
  assert page.locator('.quote-info a[href^="mailto:"]').count()==1
  images=page.locator('img').evaluate_all('(els) => els.map(e=>({src:e.currentSrc.slice(0,45),ok:e.complete && e.naturalWidth>0}))')
  assert all(x['ok'] for x in images),f'{name}: broken images {images}'
  if w<=880:
   toggle=page.locator('.menu-toggle')
   toggle.click()
   assert toggle.get_attribute('aria-expanded')=='true'
   assert page.locator('#primary-navigation').is_visible()
   page.locator('#primary-navigation a[href="#services"]').click()
   assert toggle.get_attribute('aria-expanded')=='false'
  widths=page.locator('body').evaluate('(e)=>[e.scrollWidth,e.clientWidth]')
  hero=page.locator('.hero h1').evaluate('(e)=>[e.scrollWidth,e.clientWidth]')
  assert widths[0]<=w+1,(name,'body overflow',widths)
  assert hero[0]<=hero[1]+4,(name,'headline overflow',hero)
  if name in ('desktop','mobile'):
   out=root.parent/f'Psalm23-fixed-{name}.png'
   page.screenshot(path=str(out),full_page=True,animations='disabled')
   print('Saved screenshot:',out)
  print(name,'viewport:',w,'page width:',widths,'headline width:',hero,'images:',len(images),'JS errors:',errors)
  assert not errors,errors
  page.close()
 browser.close()
