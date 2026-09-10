import { auth, db } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { doc, collection, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const $=s=>document.querySelector(s); let roomId=null,unsubs=[],typingTimer=null,lastMessageId=null,lastFileSnapshot=null;
const uid=()=>auth.currentUser?.uid; const who=()=>auth.currentUser?.displayName||auth.currentUser?.email?.split('@')[0]||'Developer';
function toast(title,text=''){const stack=$('#toastStack');if(!stack)return;const el=document.createElement('div');el.className='toast';el.innerHTML=`<strong>${esc(title)}</strong><span>${esc(text)}</span>`;stack.appendChild(el);setTimeout(()=>el.classList.add('show'),10);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),220)},3600)}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clear(){unsubs.forEach(f=>f());unsubs=[];lastMessageId=null;lastFileSnapshot=null}
function room(){const r=new URL(location.href).searchParams.get('room');if(r!==roomId){clear();roomId=r;if(roomId&&uid())watch()}}
function watch(){
 if(!roomId||!uid())return;
 const call=doc(db,'rooms',roomId,'calls','main');unsubs.push(onSnapshot(call,s=>{const d=s.data();if(d?.active&&d.startedBy!==uid()){const invite=$('#callInvite');if(invite){$('#callInviteText').textContent=`${d.startedByName||'A teammate'} started a call.`;invite.classList.remove('hidden')}}else $('#callInvite')?.classList.add('hidden')}));
 const msgs=collection(db,'rooms',roomId,'messages');unsubs.push(onSnapshot(msgs,s=>{if(!lastMessageId){lastMessageId=s.docs.at(-1)?.id;return}for(const c of s.docChanges())if(c.type==='added'&&c.doc.id!==lastMessageId){const m=c.doc.data();if(m.userId!==uid())toast(m.name||'New message',m.text||'New team message')}lastMessageId=s.docs.at(-1)?.id||lastMessageId}));
 const files=collection(db,'rooms',roomId,'files');unsubs.push(onSnapshot(files,s=>{if(!lastFileSnapshot){lastFileSnapshot=new Map(s.docs.map(d=>[d.id,d.data()]));return}for(const c of s.docChanges()){if(c.type==='added'){const f=c.doc.data();toast('New file',f.name||'A file was added')}else if(c.type==='modified'){const f=c.doc.data();toast('File updated',f.name||'A teammate updated a file')}}lastFileSnapshot=new Map(s.docs.map(d=>[d.id,d.data()]))}));
 const typing=collection(db,'rooms',roomId,'typing');unsubs.push(onSnapshot(typing,s=>{const names=s.docs.map(d=>d.data()).filter(x=>x.uid!==uid()&&x.typing&&x.expiresAt?.toMillis?.()>Date.now()).map(x=>x.name);$('#typingIndicator').textContent=names.length?`${names.slice(0,2).join(', ')}${names.length>2?' + others':''} typing…`:''}));
 const input=$('#chatInput');if(input&&!input.dataset.typingBound){input.dataset.typingBound='1';input.addEventListener('input',async()=>{if(!roomId||!uid())return;clearTimeout(typingTimer);await setDoc(doc(db,'rooms',roomId,'typing',uid()),{uid:uid(),name:who(),typing:true,expiresAt:new Date(Date.now()+1800)},{merge:true});typingTimer=setTimeout(()=>setDoc(doc(db,'rooms',roomId,'typing',uid()),{typing:false},{merge:true}),1200)})}
}
function wireCall(){const join=$('#joinCall'),decline=$('#declineCall');if(join&&!join.dataset.bound){join.dataset.bound='1';join.onclick=()=>{window.openCall?.();$('#callInvite')?.classList.add('hidden')};decline.onclick=()=>$('#callInvite')?.classList.add('hidden')}}
onAuthStateChanged(auth,()=>{clear();roomId=null;room();wireCall()});window.addEventListener('popstate',()=>{room();wireCall()});setInterval(()=>{room();wireCall()},1000);wireCall();
