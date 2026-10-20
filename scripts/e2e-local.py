#!/usr/bin/env python3
"""Exercise the published site's real relative URLs from / and a GitHub Pages project path.
Requires playwright+Chromium for local verification. Not required to publish site.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--dist', default=str(Path(__file__).resolve().parents[1]/'dist'))
parser.add_argument('--output', default='/mnt/data/psalm23_e2e_results')
parser.add_argument('--emergency',action='store_true')
args=parser.parse_args()
root=Path(args.dist).resolve();output=Path(args.output);output.mkdir(exist_ok=True,parents=True)
project='psalm-23-trasnportation'
class Server(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(root),**kw)
    def translate_path(self,path):
        parsed=urlsplit(path).path
        if parsed.startswith('/'+project+'/'):
            path=parsed[len(project)+1:]
        elif parsed=='/'+project:
            path='/'
        return super().translate_path(path)
    def log_message(self, fmt, *vals): pass
server=ThreadingHTTPServer(('127.0.0.1',0),Server)
threading.Thread(target=server.serve_forever, daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    sizes=[(320,736),(360,780),(375,812),(390,844),(430,932),(768,1024),(1024,768),(1440,900)]
    for prefix in ['/',f'/{project}/']:
        for width,height in sizes:
            page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
            failures=[];network=[];scripts=[]
            page.on('response',lambda r:network.append(f'{r.status} {r.url}') if r.status>=400 else None)
            page.on('pageerror',lambda ex:scripts.append(str(ex)))
            try:
                res=page.goto(base+prefix,wait_until='networkidle',timeout=18000)
                assert res and res.status==200,f'homepage http {res.status if res else "NONE"}'
                assert page.locator('h1').count()==1,'exactly one h1'
                assert 'HE LEADS.' in page.locator('h1').inner_text(),'headline missing'
                assert page.locator('section#quote').count()==1,'quote section missing'
                assert page.locator('form#quote-form').count()==1,'quote form missing'
                assert page.locator('link[rel="stylesheet"]').count()==0,'external CSS dependency is cache risk'
                assert page.locator('#psalm23-critical-site-css').count()==1,'inline CSS missing'
                assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'), 'horizontal overflow'
                assert page.evaluate('getComputedStyle(document.querySelector("body")).backgroundColor')=='rgb(6, 6, 6)','wrong body background'
                assert page.locator('.brand-image').first.evaluate('(e)=>e.complete&&e.naturalWidth>0'),'logo missing'
                hero=page.locator('.hero-backdrop')
                assert hero.evaluate('(e)=>e.complete&&e.naturalWidth>0'),'hero missing'
                # CTA anchors point to IDs on the page, never nonexistent paths.
                links=page.locator('a[href^="#"]').evaluate_all('(es)=>es.map(e=>e.getAttribute("href"))')
                for dest in links:
                    assert dest=='#' or page.locator(dest).count()>0,f'broken hash href {dest}'
                # Images may be lazy; scroll through all sections before checking.
                for anchor in ['#services','#story','#process','#quote']:
                    page.locator(anchor).scroll_into_view_if_needed()
                    page.wait_for_timeout(70)
                images=page.locator('img').evaluate_all('els=>els.map(x=>({src:x.getAttribute("src"),complete:x.complete,loaded:x.naturalWidth>0}))')
                assert all(x['loaded'] for x in images),'broken image '+repr([i for i in images if not i['loaded']])
                # Every decorative icon's box is constrained to sane dimensions.
                huge=page.locator('svg.icon').evaluate_all('els=>els.filter(e=>e.getBoundingClientRect().width>44||e.getBoundingClientRect().height>44).map(e=>e.classList.value)')
                assert not huge,f'oversized icons {huge}'
                # Mobile menu should work and close on selection.
                if width<=860:
                    menu=page.locator('.menu-toggle')
                    assert menu.is_visible(),'mobile menu is not visible'
                    menu.click()
                    assert menu.get_attribute('aria-expanded')=='true','mobile menu did not open'
                    page.locator('#primary-navigation a[href="#services"]').click()
                    assert menu.get_attribute('aria-expanded')=='false','mobile menu did not close'
                # Footer layout: logo and links do not collide at small widths.
                logo=page.locator('.footer-logo').bounding_box();nav=page.locator('.footer-nav').bounding_box()
                if logo and nav:
                    overlap=max(0,min(logo['x']+logo['width'],nav['x']+nav['width'])-max(logo['x'],nav['x']))*max(0,min(logo['y']+logo['height'],nav['y']+nav['height'])-max(logo['y'],nav['y']))
                    assert overlap < 1,f'footer logo overlaps nav ({overlap:.0f}px2)'
                # Quote fields: required validation and copy-message behaviour.
                page.locator('input[name="customerName"]').fill('Alex Example')
                page.locator('input[name="pickup"]').fill('Houston, TX')
                page.locator('input[name="destination"]').fill('Dallas, TX')
                page.locator('textarea[name="load"]').fill('Equipment transport, 800 lb')
                page.locator('button[data-action="copy"]').click()
                page.wait_for_timeout(90)
                msg=page.locator('#form-status').inner_text()
                assert ('copied' in msg.lower() or 'blocked' in msg.lower()),f'quote copy action: {msg}'
                # /admin path should be present with honest status, not a 404.
                admin=page.request.get(base+prefix+'admin/')
                assert admin.status==200,f'admin {admin.status}'
                st=page.request.get(base+prefix+'admin/setup-status.json')
                assert st.status==200,f'admin status {st.status}'
                if not args.emergency:
                    assert st.json()['configured'] is False,'unexpected claims about auth configuration'
                if network:failures.append('http errors: '+str(network))
                if scripts:failures.append('js errors: '+str(scripts))
            except Exception as err:
                failures.append(str(err))
            finally:
                if prefix=='/' and width in [390,1440]:
                    page.goto(base+prefix, wait_until='load')
                    page.screenshot(path=str(output/f'{width}-homepage.png'),full_page=True,animations='disabled')
                results.append({'prefix':prefix,'width':width,'height':height,'status':'FAIL' if failures else 'PASS','issues':failures})
                print(prefix,width,'FAIL' if failures else 'PASS', ' | '.join(failures)[:350])
                page.close()
    browser.close()
server.shutdown()
(output/'results.json').write_text(json.dumps(results,indent=2))
if any(x['status']=='FAIL' for x in results):raise SystemExit(1)
print('PASSED:',len(results),'real-browser route, layout, image, editor and form checks')
