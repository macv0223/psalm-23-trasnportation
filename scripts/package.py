from pathlib import Path
import base64,mimetypes,re,zipfile,shutil
root=Path(__file__).resolve().parents[1]
out_dir=Path('/mnt/data')
# Self-contained browser preview: inline artwork and CSS/JS so it can open as file://.
html=(root/'dist/index.html').read_text()
css=(root/'dist/assets/site.css').read_text()
js=(root/'dist/assets/app.js').read_text()
scene=root/'dist/assets/uploads/psalm23-hero-scene.webp'
scene_uri='data:image/webp;base64,'+base64.b64encode(scene.read_bytes()).decode('ascii')
css=css.replace("url('uploads/psalm23-hero-scene.webp')", f"url('{scene_uri}')")
html=re.sub(r'<link rel="preload"[^>]*>','',html)
html=html.replace('<link rel="stylesheet" href="assets/site.css">','<style>'+css+'</style>')
html=html.replace('<script type="module" src="assets/app.js"></script>','<script>'+js+'</script>')
urls=set(re.findall(r'(?:src|data-image-fallback|href)="(assets/[^"<>]+)"',html))
for path in urls:
    p=root/'dist'/path
    if not p.is_file():continue
    mime=mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    uri='data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
    html=html.replace('="'+path+'"','="'+uri+'"')
assert 'src="assets/' not in html
assert 'href="assets/' not in html
standalone=out_dir/'Psalm23-BlackGold-Reference-Layout-OFFLINE.html'
standalone.write_text(html)
print('Standalone preview',standalone,standalone.stat().st_size)

def compress(out,origin,omit=()):
    if out.exists():out.unlink()
    with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(origin.rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts and not any(p.match(omit_rule) for omit_rule in omit):
                z.write(p,p.relative_to(origin).as_posix())
    with zipfile.ZipFile(out) as z:
        names=set(z.namelist())
        assert 'index.html' in names
        assert 'assets/uploads/psalm23-wordmark-gold.png' in names
        assert 'assets/uploads/psalm23-hero-scene.webp' in names
    print('ZIP',out,'size',out.stat().st_size)
compress(out_dir/'Psalm23-BlackGold-Reference-Layout-GitHub-READY.zip',root,omit=('scripts/package.py',))
compress(out_dir/'Psalm23-BlackGold-Reference-Layout-Preview.zip',root/'dist')
