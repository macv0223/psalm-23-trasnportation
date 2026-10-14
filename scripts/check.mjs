import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const requireFile=p=>{if(!existsSync(path.join(root,p)))throw new Error(`Missing ${p}`)};
for(const p of ['dist/index.html','dist/admin/index.html','dist/admin/config.json','dist/admin/setup-status.json','dist/assets/app.js','dist/assets/site.css','dist/data/site.json','dist/assets/uploads/psalm23-truck-logo.png','dist/assets/favicon.png'])requireFile(p);
const page=readFileSync(path.join(root,'dist/index.html'),'utf8');
for(const phrase of ['Psalm 23 Transportation','Moving.','With purpose.','281-766-1320','Psalm23Transportation@yahoo.com','What needs transporting?','id="quote-form"','assets/app.js'])if(!page.includes(phrase))throw new Error(`Missing expected page content: ${phrase}`);
const config=JSON.parse(readFileSync(path.join(root,'dist/admin/config.json'),'utf8'));
if(config.backend.name!=='github'||config.publish_mode!=='editorial_workflow')throw new Error('CMS not configured as GitHub editorial workflow');
if(config.collections[0].files[0].file!=='content/site.json')throw new Error('CMS is not bound to the editable JSON');
const settings=JSON.parse(readFileSync(path.join(root,'dist/admin/setup-status.json'),'utf8'));
if(settings.configured&&!settings.repository)throw new Error('CMS ready without repository');
console.log('Build checks passed.');

// Prevent the cross-logo regression: the published root must match the build.
const rootPage=readFileSync(path.join(root,'index.html'),'utf8');
if(rootPage!==page)throw new Error('Root index.html is stale; build must sync it to dist/index.html');
for(const marker of ['psalm23-puzzle-cross','hauling-scene.svg','story-cross-image','brand-cross']){
 if(page.includes(marker))throw new Error('Old cross artwork or unused truck illustration is still referenced: '+marker);
}
if(!page.includes('psalm23-truck-logo.png')||!page.includes('hero-road'))throw new Error('Truck logo or road is missing');
if(!page.includes('PUTTING THE PIECES TOGETHER'))throw new Error('Restored puzzle-themed copy is missing');
const checkedCms=JSON.parse(readFileSync(path.join(root,'dist/admin/config.json'),'utf8'));
if(checkedCms.backend.repo!=='macv0223/psalm-23-trasnportation')throw new Error('CMS points to the wrong repository');
const uploadedLogo=path.join(root,'dist/assets/uploads/psalm23-truck-logo.png');
if(!existsSync(uploadedLogo))throw new Error('Truck asset is missing');

for(const pathpart of ['assets/uploads/psalm23-puzzle-cross.webp','public/assets/uploads/psalm23-puzzle-cross.webp','dist/assets/uploads/psalm23-puzzle-cross.webp']){
 if(existsSync(path.join(root,pathpart)))throw new Error('Obsolete cross image still present: '+pathpart);
}
