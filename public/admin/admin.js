import {renderPage} from '../assets/render.js';
const status=document.querySelector('#admin-status');
const button=document.querySelector('#open-cms');
async function getJson(url){const response=await fetch(url,{cache:'no-store'});if(!response.ok)throw new Error('Could not load '+url);return response.json()}
try{
  const setup=await getJson('setup-status.json');
  if(!setup.configured){
    status.textContent='The editor is prepared but has not been connected to its GitHub repository and Cloudflare authentication Worker yet. Follow the setup guide included in the download.';
  }else{
    status.textContent='Editor connection configured. Sign in using your individually approved GitHub account. You can save drafts before publishing.';
    button.hidden=false;
    button.addEventListener('click',async()=>{
      button.disabled=true;status.textContent='Opening the website content manager…';
      try{
        const [config,siteData]=await Promise.all([getJson('config.json'),getJson('../data/site.json')]);
        const script=document.createElement('script');
        script.src='https://unpkg.com/decap-cms@3.16.3/dist/decap-cms.js';
        script.crossOrigin='anonymous';
        await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(new Error('Could not load Decap CMS. Check your internet connection and try again.'));document.body.append(script)});
        if(!window.CMS||!window.h||!window.createClass)throw new Error('Decap CMS did not initialize correctly.');
        const base=new URL('../',location.href).href;
        const Preview=window.createClass({
          render(){
            const entry=this.props.entry.toJS(),draft=entry.data||{};
            // Decap may render before every nested CMS field is ready. Preserve defaults until then.
            const snapshot=structuredClone(siteData);
            // Decap list fields (such as the four commitments) are arrays.
            // Spreading an array into {...} turns it into an object and breaks
            // renderPage(...), which expects values.map(...) to exist.
            for(const key of Object.keys(snapshot)){
              const incoming=draft[key];
              if(Array.isArray(snapshot[key])){
                if(Array.isArray(incoming))snapshot[key]=incoming;
              }else if(incoming && typeof incoming==='object' && !Array.isArray(incoming)){
                snapshot[key]={...snapshot[key],...incoming};
              }
            }
            // Resolve temporary uploaded images for previews without modifying saved content.
            for(const [section,key] of [['settings','logo'],['settings','featureGraphic'],['settings','showcaseGraphic'],['hero','heroImage'],['story','storyImage']]){
              if(snapshot[section]?.[key]){
                const asset=this.props.getAsset(snapshot[section][key]);
                if(asset&&typeof asset.toString==='function')snapshot[section][key]=asset.toString();
              }
            }
            const document=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${base}"><link rel="stylesheet" href="${base}assets/site.css"></head><body>${renderPage(snapshot)}</body></html>`;
            return window.h('iframe',{srcDoc:document,title:'Live website page preview',style:{width:'100%',height:'100%',minHeight:'100vh',border:0},sandbox:'allow-same-origin'});
          }
        });
        window.CMS.registerPreviewTemplate('site',Preview);
        config.load_config_file=false;
        window.CMS.init({config});
        document.querySelector('#admin-welcome').hidden=true;
      }catch(error){status.textContent=error.message;button.disabled=false}
    });
  }
}catch{status.textContent='Unable to check the editor connection. Reload or ask the website administrator for assistance.'}
