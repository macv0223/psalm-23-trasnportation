"""Create a self-contained preview of the locally rebuilt website; no server needed."""
from pathlib import Path
import base64, re, mimetypes

root=Path(__file__).resolve().parents[1]
html=(root/'dist/index.html').read_text(encoding='utf-8')
css=(root/'dist/assets/site.css').read_text(encoding='utf-8')
js=(root/'dist/assets/app.js').read_text(encoding='utf-8')

def to_data(uri: str) -> str:
    p=(root/'dist'/uri) if uri.startswith('assets/') else (root/'dist/assets'/uri) if uri.startswith('uploads/') else None
    if not p or not p.is_file():
        return uri
    mime=mimetypes.guess_type(str(p))[0] or 'application/octet-stream'
    return f'data:{mime};base64,'+base64.b64encode(p.read_bytes()).decode('ascii')

# Replace CSS asset names before injecting the stylesheet.
for asset in set(re.findall(r"url\((?:'|\")?(uploads/[^'\")\s]+)(?:'|\")?\)",css)):
    css=css.replace(asset,to_data(asset))
html=html.replace('<link rel="stylesheet" href="assets/site.css">','<style>'+css+'</style>')
html=html.replace('<script type="module" src="assets/app.js"></script>','<script>'+js+'</script>')
html=re.sub(r'<link rel="preload"[^>]*>', '', html)
for uri in sorted(set(re.findall(r'(?:assets/)[a-zA-Z0-9_./-]+',html)), key=len, reverse=True):
    if uri.startswith('assets/'):
        data=to_data(uri)
        if data!=uri:html=html.replace(uri,data)
out=Path('/mnt/data/Psalm23-Hero-Corrected-OFFLINE-PREVIEW.html')
out.write_text(html,encoding='utf-8')
print(out, 'bytes=',out.stat().st_size)
