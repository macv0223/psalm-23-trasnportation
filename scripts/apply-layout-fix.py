from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'public/assets/site.css'
css=p.read_text()
def replace(old,new,count=1):
    global css
    found=css.count(old)
    if found!=count: raise RuntimeError(f'Expected {count} occurrences; found {found}: {old[:100]}')
    css=css.replace(old,new)
replace('.hero-visual{position:relative;min-height:440px;', '.hero-visual{position:relative;height:440px;')
replace('.hero-picture{width:100%;height:100%;object-fit:cover}', '.hero-picture{width:100%;height:100%;object-fit:contain;object-position:center bottom}')
replace('.hero-logo-panel{position:absolute;top:7px;left:50%;transform:translateX(-50%);z-index:2;width:min(80%,355px);height:322px;display:flex;align-items:center;justify-content:center;padding:11px}',
        '.hero-logo-panel{position:absolute;top:6%;left:50%;transform:translateX(-50%);z-index:2;width:min(58%,280px);height:54%;max-height:260px;display:flex;align-items:center;justify-content:center;padding:0;pointer-events:none}')
replace('.visual-corner{position:absolute;z-index:1;bottom:24px;left:26px;', '.visual-corner{position:absolute;z-index:3;bottom:16px;left:20px;')
replace('.visual-corner span{font:800 47px/1 Manrope,Arial,sans-serif;', '.visual-corner span{font:800 38px/1 Manrope,Arial,sans-serif;')
replace('.story-frame{aspect-ratio:1.04;display:grid;place-items:center;overflow:hidden;position:relative;',
        '.story-frame{aspect-ratio:1;isolation:isolate;display:block;overflow:hidden;position:relative;')
replace('.story-cross-image{position:relative;z-index:1;display:block;width:74%;height:80%;object-fit:contain;filter:drop-shadow(0 18px 32px #132e2e)}',
        '.story-cross-image{position:absolute;z-index:2;display:block;top:6%;left:50%;transform:translateX(-50%);width:70%;height:64%;max-width:100%;object-fit:contain;object-position:center;pointer-events:none;filter:drop-shadow(0 12px 22px #132e2e)}')
replace('.story-orbit{position:absolute;width:80%;aspect-ratio:1;',
        '.story-orbit{position:absolute;z-index:0;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;aspect-ratio:1;')
replace('.story-lightbox{position:absolute;bottom:28px;left:29px;',
        '.story-lightbox{position:absolute;z-index:3;bottom:28px;left:29px;')
replace('.story-upload{position:absolute;inset:0}.story-upload-image{width:100%;height:100%;object-fit:cover}',
        '.story-upload{position:absolute;z-index:2;inset:6% 7% 24%;display:grid;place-items:center}.story-upload-image{width:100%;height:100%;object-fit:contain;object-position:center}')
replace('.hero-visual{min-height:390px}', '.hero-visual{height:390px}')
replace('.hero-visual{min-height:325px}.hero-logo-panel{width:84%;height:250px;top:7px}',
        '.hero-visual{height:325px}.hero-logo-panel{width:min(62%,230px);height:52%;max-height:190px;top:6%}.visual-corner{bottom:13px;left:16px}.visual-corner span{font-size:34px}.story-cross-image{top:6%;height:60%}')
p.write_text(css)
print('Updated',p, 'bytes:',len(css))
