import { auth, db } from './firebase.js';
import { collection, doc, onSnapshot, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const $=s=>document.querySelector(s);
let stop=null,roomId=null,files=[];
const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
function getRoom(){return new URL(location.href).searchParams.get('room')}
function ext(name){const m=name.toLowerCase().match(/\.([a-z0-9]+)$/);return m?m[1]:''}
function icon(name){const e=ext(name);return e==='js'||e==='ts'?'JS':e==='html'||e==='htm'?'<>':e==='css'||e==='scss'?'#':e==='json'?'{}':e==='md'?'M':'·'}
function mount(){
  const panel=$('.files-panel'); if(!panel||$('#fileTools'))return;
  panel.querySelector('.panel-title')?.insertAdjacentHTML('beforeend','<div class="file-tools" id="fileTools"><button type="button" id="renameFile" title="Rename selected file">Rename</button><button type="button" id="duplicateFile" title="Duplicate selected file">Duplicate</button><button type="button" id="deleteFile" title="Delete selected file">Delete</button></div>');
  $('#renameFile').onclick=renameSelected;$('#duplicateFile').onclick=duplicateSelected;$('#deleteFile').onclick=deleteSelected;
}
function selected(){const active=$('.file-item.active');return files.find(f=>f.id===active?.dataset.id)||null}
async function renameSelected(){const f=selected();if(!roomId||!f)return alert('Select a file first.');const name=prompt('New file name',f.name);if(!name)return;const clean=name.trim().replace(/[^a-zA-Z0-9._\/-]/g,'').slice(0,120);if(!clean||clean===f.name)return;if(files.some(x=>x.name===clean))return alert('A file with that name already exists.');try{await updateDoc(doc(db,'rooms',roomId,'files',f.id),{name:clean,updatedAt:serverTimestamp()})}catch(e){alert(`Rename failed: ${e.message||'Permission denied'}`)}}
async function duplicateSelected(){const f=selected();if(!roomId||!f)return alert('Select a file first.');let base=f.name, candidate=base.replace(/(\.[^.]+)?$/, '-copy$1'), n=2;while(files.some(x=>x.name===candidate)){candidate=base.replace(/(\.[^.]+)?$/, `-copy-${n++}$1`)}try{await addDoc(collection(db,'rooms',roomId,'files'),{name:candidate,language:f.language||'javascript',content:f.content||'',ownerId:auth.currentUser.uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()})}catch(e){alert(`Duplicate failed: ${e.message||'Permission denied'}`)}}
async function deleteSelected(){const f=selected();if(!roomId||!f)return alert('Select a file first.');if(files.length<=1)return alert('A project must keep at least one file.');if(!confirm(`Delete ${f.name}? This cannot be undone.`))return;try{await deleteDoc(doc(db,'rooms',roomId,'files',f.id))}catch(e){alert(`Delete failed: ${e.message||'Permission denied'}`)}}
function watch(){const next=getRoom();if(next===roomId)return;stop?.();roomId=next;files=[];if(!roomId||!auth.currentUser)return;stop=onSnapshot(collection(db,'rooms',roomId,'files'),s=>{files=s.docs.map(d=>({id:d.id,...d.data()}));mount();updateLabels()})}
function updateLabels(){const active=$('.file-item.active');const f=files.find(x=>x.id===active?.dataset.id);$('#renameFile')?.toggleAttribute('disabled',!f);$('#duplicateFile')?.toggleAttribute('disabled',!f);$('#deleteFile')?.toggleAttribute('disabled',!f||files.length<=1)}
new MutationObserver(()=>{if(!$('#workspaceView')?.classList.contains('hidden')){mount();watch();updateLabels()}}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
setInterval(()=>{if(!$('#workspaceView')?.classList.contains('hidden')){mount();watch();updateLabels()}},1500);
