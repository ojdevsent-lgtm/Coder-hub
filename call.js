import { auth, db } from './firebase.js';
import { doc, collection, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const $ = s => document.querySelector(s);
const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };
let roomId = new URL(location.href).searchParams.get('room');
let callRef = null, participantsUnsub = null, callUnsub = null, localStream = null;
const peers = new Map();
const candidateUnsubs = new Map();

function name(){ return auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Developer'; }
function color(){ return window.colorForUser?.(auth.currentUser?.uid) || '#7c83ff'; }
function esc(v){ return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function setRoomFromUrl(){ roomId = new URL(location.href).searchParams.get('room'); }
function ensurePanel(){
  if ($('#callPanel')) return;
  document.body.insertAdjacentHTML('beforeend', `<div class="call-panel hidden" id="callPanel"><div class="call-head"><div><span class="eyebrow">LIVE COLLABORATION</span><h2>Team call</h2><p id="callStatus">Ready</p></div><button class="close" id="callClose">×</button></div><div class="video-grid" id="videoGrid"></div><div class="call-controls"><button class="call-control" id="muteCall">🎙️ Mute</button><button class="call-control" id="cameraCall">📷 Camera</button><button class="call-control" id="screenCall">▣ Share screen</button><button class="call-control end" id="endCall">End call</button></div></div>`);
  $('#callClose').onclick=leaveCall; $('#endCall').onclick=leaveCall; $('#muteCall').onclick=toggleMute; $('#cameraCall').onclick=toggleCamera; $('#screenCall').onclick=shareScreen;
}
function addVideo(id, stream, label, local=false){
  let card=document.querySelector(`[data-video="${CSS.escape(id)}"]`);
  if(!card){ card=document.createElement('div');card.className='video-card';card.dataset.video=id;card.innerHTML=`<video autoplay playsinline ${local?'muted':''}></video><span class="video-label"></span>`;$('#videoGrid').appendChild(card); }
  card.querySelector('video').srcObject=stream;card.querySelector('.video-label').innerHTML=`<i style="background:${colorFor(label)}"></i>${esc(label)}${local?' · You':''}`;
}
function colorFor(label){ return label===name()?color() : (window.colorForUser?.(label)||'#7c83ff'); }
function removeVideo(id){document.querySelector(`[data-video="${CSS.escape(id)}"]`)?.remove();}
function setStatus(t){$('#callStatus').textContent=t;}
async function ensureMedia(){
  if(localStream) return localStream;
  localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:true});
  addVideo(auth.currentUser.uid,localStream,name(),true); return localStream;
}
async function setupPeer(remote){
  if(!auth.currentUser || remote.uid===auth.currentUser.uid || peers.has(remote.uid)) return;
  const me=auth.currentUser.uid;
  const pairId=[me,remote.uid].sort().join('_');
  const pairRef=doc(db,'rooms',roomId,'calls','main','pairs',pairId);
  const pc=new RTCPeerConnection(rtcConfig); peers.set(remote.uid,{pc,pairRef,remote});
  localStream?.getTracks().forEach(t=>pc.addTrack(t,localStream));
  pc.ontrack=e=>addVideo(remote.uid,e.streams[0],remote.name||'Developer');
  pc.onconnectionstatechange=()=>{ if(['failed','closed','disconnected'].includes(pc.connectionState)) removeVideo(remote.uid); };
  const side=me===pairId.split('_')[0]?'a':'b';
  const otherSide=side==='a'?'b':'a';
  const candidatesRef=collection(pairRef,`${side}Candidates`);
  pc.onicecandidate=async e=>{if(e.candidate)await setDoc(doc(candidatesRef),{candidate:e.candidate.toJSON(),from:me,createdAt:serverTimestamp()})};
  const unsub=onSnapshot(pairRef,async snap=>{
    const d=snap.data()||{};
    try{
      if(side==='a' && !d.offer){const offer=await pc.createOffer();await pc.setLocalDescription(offer);await setDoc(pairRef,{a:me,b:remote.uid,offer:{type:offer.type,sdp:offer.sdp},updatedAt:serverTimestamp()},{merge:true});}
      if(side==='b' && d.offer && !pc.currentRemoteDescription){await pc.setRemoteDescription(d.offer);const answer=await pc.createAnswer();await pc.setLocalDescription(answer);await setDoc(pairRef,{answer:{type:answer.type,sdp:answer.sdp},updatedAt:serverTimestamp()},{merge:true});}
      if(side==='a' && d.answer && !pc.currentRemoteDescription) await pc.setRemoteDescription(d.answer);
    }catch(e){setStatus('Connection issue — retrying…');}
  });
  const candUnsub=onSnapshot(collection(pairRef,`${otherSide}Candidates`),snap=>snap.docChanges().forEach(async ch=>{if(ch.type==='added'&&pc.remoteDescription)try{await pc.addIceCandidate(ch.doc.data().candidate)}catch(e){}}));
  candidateUnsubs.set(remote.uid,()=>{unsub();candUnsub()});
}
function closePeer(uid){const p=peers.get(uid);if(!p)return;p.pc.close();candidateUnsubs.get(uid)?.();candidateUnsubs.delete(uid);peers.delete(uid);removeVideo(uid);}
async function openCall(){
  setRoomFromUrl(); if(!roomId||!auth.currentUser)return;
  ensurePanel();$('#callPanel').classList.remove('hidden');
  try{
    await ensureMedia();
    callRef=doc(db,'rooms',roomId,'calls','main');
    await setDoc(callRef,{active:true,updatedAt:serverTimestamp(),startedBy:auth.currentUser.uid},{merge:true});
    await setDoc(doc(callRef,'participants',auth.currentUser.uid),{uid:auth.currentUser.uid,name:name(),color:color(),joinedAt:serverTimestamp(),online:true},{merge:true});
    callUnsub=onSnapshot(callRef,s=>{if(!s.exists()||!s.data().active)leaveCall(false)});
    participantsUnsub=onSnapshot(collection(callRef,'participants'),s=>{const list=s.docs.map(d=>d.data()).filter(p=>p.uid!==auth.currentUser.uid);setStatus(`${s.size} participant${s.size===1?'':'s'} connected`);list.forEach(setupPeer);for(const uid of [...peers.keys()])if(!list.some(p=>p.uid===uid))closePeer(uid);});
  }catch(e){setStatus(e.name==='NotAllowedError'?'Camera/microphone permission was denied.':`Call unavailable: ${e.message||e}`);}
}
async function leaveCall(mark=true){
  if(!auth.currentUser)return;
  for(const uid of [...peers.keys()])closePeer(uid);participantsUnsub?.();callUnsub?.();participantsUnsub=null;callUnsub=null;
  try{if(callRef){await deleteDoc(doc(callRef,'participants',auth.currentUser.uid));if(mark)await updateDoc(callRef,{active:false,updatedAt:serverTimestamp()});}}catch(e){}
  if(localStream){localStream.getTracks().forEach(t=>t.stop());localStream=null;}
  $('#videoGrid')?.replaceChildren();$('#callPanel')?.classList.add('hidden');
}
async function toggleMute(){if(!localStream)return;const t=localStream.getAudioTracks()[0];if(t){t.enabled=!t.enabled;$('#muteCall').textContent=t.enabled?'🎙️ Mute':'🔇 Unmute';}}
async function toggleCamera(){if(!localStream)return;const t=localStream.getVideoTracks()[0];if(t){t.enabled=!t.enabled;$('#cameraCall').textContent=t.enabled?'📷 Camera':'🚫 Camera';}}
async function shareScreen(){
  if(!localStream)return;
  try{const screen=await navigator.mediaDevices.getDisplayMedia({video:true});const track=screen.getVideoTracks()[0];for(const {pc} of peers.values()){const sender=pc.getSenders().find(s=>s.track?.kind==='video');if(sender)await sender.replaceTrack(track)}document.querySelector('[data-video] video')?.srcObject && (document.querySelector('[data-video] video').srcObject=new MediaStream([track]));track.onended=()=>{const camera=localStream?.getVideoTracks()[0];for(const {pc} of peers.values()){const sender=pc.getSenders().find(s=>s.track?.kind==='video');if(sender&&camera)sender.replaceTrack(camera)}addVideo(auth.currentUser.uid,localStream,name(),true)};}catch(e){}
}
function wire(){
  ensurePanel();
  const btn=document.querySelector('#startCall'); if(btn)btn.onclick=openCall;
  window.addEventListener('popstate',()=>{setRoomFromUrl()});
}
if(auth){ auth.onAuthStateChanged?.(()=>wire()); }
wire();
