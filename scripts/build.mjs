import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync,copyFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderDocument,validateSite} from '../public/assets/render.js';
import {cmsConfig,isConfigured} from './cms-config.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(readFileSync(path.join(root,p),'utf8'));
function copyRecursive(from,to){
  mkdirSync(to,{recursive:true});
  for(const dirent of readdirSync(from,{withFileTypes:true})){
    const src=path.join(from,dirent.name),dst=path.join(to,dirent.name);
    if(dirent.isDirectory())copyRecursive(src,dst);
    else if(dirent.isFile())copyFileSync(src,dst);
  }
}
function build(){
  const data=read('content/site.json');validateSite(data);
  const setup=read('cms/setup.json');
  if(process.env.CMS_OAUTH_ORIGIN)setup.oauthOrigin=process.env.CMS_OAUTH_ORIGIN;
  if(process.env.SITE_URL)setup.siteUrl=process.env.SITE_URL;
  if(process.env.CMS_REPOSITORY)setup.repository=process.env.CMS_REPOSITORY;
  const dist=path.join(root,'dist');
  rmSync(dist,{recursive:true,force:true});copyRecursive(path.join(root,'public'),dist);
  const admin=path.join(dist,'admin');mkdirSync(admin,{recursive:true});
  writeFileSync(path.join(dist,'index.html'),renderDocument(data),'utf8');
  writeFileSync(path.join(admin,'config.json'),JSON.stringify(cmsConfig(setup),null,2));
  writeFileSync(path.join(admin,'setup-status.json'),JSON.stringify({configured:isConfigured(setup),repository:setup.repository,editorAuthConfigured:Boolean(setup.oauthOrigin)},null,2));
  // JSON content is only exposed in the built website for preview; no secrets are included.
  mkdirSync(path.join(dist,'data'),{recursive:true});
  writeFileSync(path.join(dist,'data','site.json'),JSON.stringify(data,null,2));
  writeFileSync(path.join(dist,'robots.txt'),'User-agent: *\nAllow: /\n');
  // Mirror the generated public site to repository root for branch-based GitHub Pages.
  // Without this step the root index.html can silently publish outdated imagery.
  copyRecursive(dist,root);
  console.log(`Built ${dist}. Editor access: ${isConfigured(setup)?'ready for deployed OAuth Worker':'requires GitHub/Cloudflare setup'}.`);
}
build();
