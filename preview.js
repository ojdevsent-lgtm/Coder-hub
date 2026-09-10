import { auth, db } from './firebase.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

let stop=null, files=[];
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
function roomFromUrl(){return new URL(location.href).searchParams.get('room')}
function pick(exts){return files.find(f=>exts.some(e=>f.name.toLowerCase().endsWith(e)))}
function buildDocument(){
  const html=pick(['.html','.htm']);
  const css=pick(['.css']);
  const js=pick(['.js','.mjs']);
  let body=html?.content||'<!doctype html><html><head><meta charset="utf-8"></head><body><h2>Live Preview</h2><p>Create an HTML file to preview your page.</p></body></html>';
  const style=css?.content||'';
  const script=js?.content||'';
  if(/<head[\s>]/i.test(body)) body=body.replace(/<\/head>/i,`<style>${style.replace(/<\/style/gi,'<\\/style')}</style></head>`);
  else body=`<style>${style.replace(/<\/style/gi,'<\\/style')}</style>${body}`;
  if(script.trim()) body=body.replace(/<\/body>/i,`<script>\n${script.replace(/<\/script/gi,'<\\/script')}\n<\/script></body>`);
  return body;
}
function render(){const frame=$('#livePreview');if(!frame)return;const doc=frame.contentDocument||frame.contentWindow.document;doc.open();doc.write(buildDocument());doc.close();$('#previewStatus').textContent=`Preview updated · ${new Date().toLocaleTimeString()}`}
function watch(){stop?.();const roomId=roomFromUrl();if(!roomId||!auth.currentUser)return;stop=onSnapshot(collection(db,'rooms',roomId,'files'),s=>{files=s.docs.map(d=>({id:d.id,...d.data()}));render()},()=>{$('#previewStatus').textContent='Preview unavailable'});}
function mount(){if(document.querySelector('#previewStage'))return;const workspace=$('#workspaceView');if(!workspace)return;const grid=workspace.querySelector('.workspace-grid');if(!grid)return;const link=document.createElement('link');link.rel='stylesheet';link.href='./preview.css';document.head.appendChild(link);grid.insertAdjacentHTML('beforeend',`<section class="panel preview-stage" id="previewStage"><div class="panel-title"><span>Live Preview</span><div class="preview-controls"><span class="preview-status" id="previewStatus">Waiting for code…</span><button id="refreshPreview" type="button">Refresh</button><button id="togglePreview" type="button">Collapse</button></div></div><div class="preview-frame-wrap"><iframe id="livePreview" title="Coder Hub live preview" sandbox="allow-scripts allow-forms"></iframe></div></section>`);$('#refreshPreview').onclick=render;$('#togglePreview').onclick=()=>{const stage=$('#previewStage');stage.classList.toggle('collapsed');$('#togglePreview').textContent=stage.classList.contains('collapsed')?'Expand':'Collapse'};watch()}
new MutationObserver(()=>{if(!$('#workspaceView')?.classList.contains('hidden')){mount();watch()}}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
setInterval(()=>{if(!$('#workspaceView')?.classList.contains('hidden'))watch()},1500);
