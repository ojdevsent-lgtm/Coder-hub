import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { collection, doc, setDoc, updateDoc, addDoc, onSnapshot, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const $ = selector => document.querySelector(selector);
const modal = $('#modal'), authModal = $('#authModal');
const status = $('#status'), signin = $('#signin');
const input = $('#roomName'), action = $('#modalAction');
const homeView = $('#homeView'), featuresView = $('#featuresView'), workspaceView = $('#workspaceView');
const codeEditor = $('#codeEditor'), syncState = $('#syncState');
const membersEl = $('#members'), memberCount = $('#memberCount'), messagesEl = $('#messages');
let authMode = 'signin', roomId = null, roomUnsub = null, membersUnsub = null, messagesUnsub = null;
let saveTimer = null, applyingRemote = false;

function openRoom(mode) {
  $('#modalTitle').textContent = mode === 'create' ? 'Create a room' : 'Join a room';
  $('#modalText').textContent = mode === 'create' ? 'Choose a room name to get started.' : 'Enter the room ID or room name.';
  input.placeholder = mode === 'create' ? 'e.g. frontend-team' : 'Room ID';
  action.textContent = mode === 'create' ? 'Create room' : 'Join room';
  modal.classList.remove('hidden'); input.focus();
}
function openAuth(mode = 'signin') {
  authMode = mode; const signup = mode === 'signup';
  $('#authTitle').textContent = signup ? 'Create your account' : 'Sign in';
  $('#authText').textContent = signup ? 'Create an account to start coding with your team.' : 'Sign in to create rooms and collaborate with your team.';
  $('#authAction').textContent = signup ? 'Create account' : 'Sign in';
  $('#authToggle').textContent = signup ? 'Already have an account? Sign in' : 'Need an account? Create one';
  $('#authMessage').textContent = '';
  authModal.classList.remove('hidden'); $('#authEmail').focus();
}
function friendlyAuthError(error) {
  const messages = {'auth/invalid-credential':'Email or password is incorrect.','auth/email-already-in-use':'An account already exists with this email.','auth/weak-password':'Use a password with at least 6 characters.','auth/invalid-email':'Enter a valid email address.','auth/too-many-requests':'Too many attempts. Try again later.','auth/operation-not-allowed':'Enable Email/Password sign-in in Firebase Authentication.'};
  return messages[error.code] || error.message || 'Authentication failed.';
}
function showError(message) { status.textContent = message; }

$('#createRoom').onclick = () => auth.currentUser ? openRoom('create') : openAuth('signin');
$('#joinRoom').onclick = () => auth.currentUser ? openRoom('join') : openAuth('signin');
signin.onclick = () => auth.currentUser ? signOut(auth) : openAuth('signin');
$('#close').onclick = () => modal.classList.add('hidden');
$('#authClose').onclick = () => authModal.classList.add('hidden');
modal.onclick = e => { if (e.target === modal) modal.classList.add('hidden'); };
authModal.onclick = e => { if (e.target === authModal) authModal.classList.add('hidden'); };
$('#authToggle').onclick = () => openAuth(authMode === 'signin' ? 'signup' : 'signin');

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault(); const button = $('#authAction'); button.disabled = true; $('#authMessage').textContent = 'Working…';
  try {
    const email = $('#authEmail').value.trim(), password = $('#authPassword').value;
    if (authMode === 'signup') {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: email.split('@')[0] });
    } else await signInWithEmailAndPassword(auth, email, password);
    authModal.classList.add('hidden'); $('#authForm').reset();
  } catch (error) { $('#authMessage').textContent = friendlyAuthError(error); }
  finally { button.disabled = false; }
});

async function createRoom(name) {
  const cleanName = name.trim().replace(/[^a-zA-Z0-9 _-]/g, '').slice(0, 32);
  if (!cleanName) return showError('Choose a valid room name.');
  const roomRef = doc(collection(db, 'rooms'));
  await setDoc(roomRef, { name: cleanName, ownerId: auth.currentUser.uid, language: 'javascript', code: codeEditor.value, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return roomRef.id;
}
async function joinRoom(value) {
  const clean = value.trim();
  if (!clean) throw new Error('Enter a room ID.');
  return clean;
}

async function enterRoom(id) {
  roomId = id;
  modal.classList.add('hidden'); input.value = '';
  homeView.classList.add('hidden'); featuresView.classList.add('hidden'); workspaceView.classList.remove('hidden');
  $('#workspaceTitle').textContent = 'Loading room…'; $('#roomMeta').textContent = `Room ID: ${id}`;
  const roomRef = doc(db, 'rooms', id);
  await setDoc(doc(db, 'rooms', id, 'members', auth.currentUser.uid), { uid: auth.currentUser.uid, name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0], email: auth.currentUser.email, joinedAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge: true });

  roomUnsub?.(); membersUnsub?.(); messagesUnsub?.();
  roomUnsub = onSnapshot(roomRef, snap => {
    if (!snap.exists()) { leaveRoom(); return showError('Room not found.'); }
    const data = snap.data(); $('#workspaceTitle').textContent = data.name || 'Coding room';
    if (!applyingRemote && typeof data.code === 'string') { applyingRemote = true; codeEditor.value = data.code; applyingRemote = false; }
    $('#fileLabel').textContent = `main.${data.language === 'javascript' ? 'js' : data.language}`;
    syncState.textContent = 'Synced';
  }, error => { syncState.textContent = 'Sync error'; showError(error.message); });

  membersUnsub = onSnapshot(collection(db, 'rooms', id, 'members'), snap => {
    const members = snap.docs.map(d => d.data()); memberCount.textContent = members.length; membersEl.innerHTML = members.map(m => `<div class="member"><span class="avatar">${escapeHtml((m.name || '?')[0].toUpperCase())}</span><span>${escapeHtml(m.name || 'Developer')}</span></div>`).join('');
  });
  messagesUnsub = onSnapshot(query(collection(db, 'rooms', id, 'messages'), orderBy('createdAt', 'asc')), snap => {
    messagesEl.innerHTML = snap.docs.map(d => { const m=d.data(); return `<div class="message"><b>${escapeHtml(m.name || 'Developer')}</b><p>${escapeHtml(m.text || '')}</p></div>`; }).join('');
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }, () => { messagesEl.innerHTML = '<p class="muted">Chat is unavailable until Firestore indexes/rules are ready.</p>'; });
}

codeEditor.addEventListener('input', () => {
  if (!roomId || applyingRemote) return;
  syncState.textContent = 'Saving…'; clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try { await updateDoc(doc(db, 'rooms', roomId), { code: codeEditor.value, updatedAt: serverTimestamp() }); syncState.textContent = 'Saved'; }
    catch (error) { syncState.textContent = 'Save failed'; }
  }, 350);
});

$('#chatForm').addEventListener('submit', async e => {
  e.preventDefault(); const field = $('#chatInput'); const text = field.value.trim();
  if (!roomId || !text) return;
  field.value = '';
  try { await addDoc(collection(db, 'rooms', roomId, 'messages'), { userId: auth.currentUser.uid, name: auth.currentUser.displayName || auth.currentUser.email.split('@')[0], text, createdAt: serverTimestamp() }); }
  catch (error) { showError('Could not send message.'); }
});

function leaveRoom() {
  roomUnsub?.(); membersUnsub?.(); messagesUnsub?.(); roomUnsub = membersUnsub = messagesUnsub = null; roomId = null;
  workspaceView.classList.add('hidden'); homeView.classList.remove('hidden'); featuresView.classList.remove('hidden');
  status.textContent = auth.currentUser ? `Signed in as ${auth.currentUser.displayName || auth.currentUser.email}` : 'Ready to collaborate';
}
$('#leaveRoom').onclick = leaveRoom;

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

action.onclick = async () => {
  if (!auth.currentUser) return openAuth('signin');
  action.disabled = true;
  try { const id = action.textContent === 'Create room' ? await createRoom(input.value) : await joinRoom(input.value); await enterRoom(id); }
  catch (error) { showError(error.message || 'Could not open room.'); }
  finally { action.disabled = false; }
};
input.addEventListener('keydown', e => { if (e.key === 'Enter') action.click(); });

onAuthStateChanged(auth, user => {
  if (user) { status.textContent = `Signed in as ${user.displayName || user.email}`; signin.textContent = 'Sign out'; }
  else { status.textContent = 'Ready to collaborate'; signin.textContent = 'Sign in'; if (roomId) leaveRoom(); }
});
