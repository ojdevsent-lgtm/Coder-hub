const $=s=>document.querySelector(s);
function emit(){const content=$('.cm-editor .cm-content')?.textContent??'';const name=$('#fileLabel')?.textContent?.trim();if(name)window.dispatchEvent(new CustomEvent('coderhub-editor-change',{detail:{name,content}}))}
let queued=false;function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;emit()})}
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});
window.addEventListener('coderhub-editor-ready',schedule);
