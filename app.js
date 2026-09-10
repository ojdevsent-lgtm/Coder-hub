import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';

// Replace these values with the Firebase Web App configuration for Coder Hub.
// Keep this file free of private server credentials. Firebase client configuration
// is intended for browser use; access is protected by Firebase Security Rules.
const firebaseConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_FIREBASE_PROJECT.firebaseapp.com',
  projectId: 'YOUR_FIREBASE_PROJECT_ID',
  storageBucket: 'YOUR_FIREBASE_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID'
};

const firebaseReady = !Object.values(firebaseConfig).some(value => value.startsWith('YOUR_'));
const app = firebaseReady ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;

const modal = document.querySelector('#modal');
const title = document.querySelector('#modalTitle');
const text = document.querySelector('#modalText');
const input = document.querySelector('#roomName');
const action = document.querySelector('#modalAction');
const status = document.querySelector('#status');
const signin = document.querySelector('#signin');
const authModal = document.querySelector('#authModal');
const authTitle = document.querySelector('#authTitle');
const authText = document.querySelector('#authText');
const authForm = document.querySelector('#authForm');
const authEmail = document.querySelector('#authEmail');
const authPassword = document.querySelector('#authPassword');
const authAction = document.querySelector('#authAction');
const authToggle = document.querySelector('#authToggle');
const authMessage = document.querySelector('#authMessage');

let authMode = 'signin';

function openRoom(mode) {
  title.textContent = mode === 'create' ? 'Create a room' : 'Join a room';
  text.textContent = mode === 'create' ? 'Choose a room name to get started.' : 'Enter the room name or invite code.';
  input.placeholder = mode === 'create' ? 'e.g. frontend-team' : 'Room name or invite code';
  action.textContent = mode === 'create' ? 'Create room' : 'Join room';
  modal.classList.remove('hidden');
  input.focus();
}

function openAuth(mode = 'signin') {
  authMode = mode;
  const signup = mode === 'signup';
  authTitle.textContent = signup ? 'Create your account' : 'Sign in';
  authText.textContent = signup ? 'Create an account to start coding with your team.' : 'Sign in to create rooms and collaborate with your team.';
  authAction.textContent = signup ? 'Create account' : 'Sign in';
  authToggle.textContent = signup ? 'Already have an account? Sign in' : 'Need an account? Create one';
  authMessage.textContent = firebaseReady ? '' : 'Firebase is not connected yet. Add the Coder Hub Firebase web config in app.js.';
  authModal.classList.remove('hidden');
  authEmail.focus();
}

function friendlyAuthError(error) {
  const messages = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Try again later.'
  };
  return messages[error.code] || error.message || 'Authentication failed.';
}

document.querySelector('#createRoom').onclick = () => openRoom('create');
document.querySelector('#joinRoom').onclick = () => openRoom('join');
signin.onclick = () => auth.currentUser ? signOut(auth) : openAuth('signin');
document.querySelector('#close').onclick = () => modal.classList.add('hidden');
document.querySelector('#authClose').onclick = () => authModal.classList.add('hidden');
modal.onclick = event => { if (event.target === modal) modal.classList.add('hidden'); };
authModal.onclick = event => { if (event.target === authModal) authModal.classList.add('hidden'); };
authToggle.onclick = () => openAuth(authMode === 'signin' ? 'signup' : 'signin');

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!auth) return;
  authAction.disabled = true;
  authMessage.textContent = 'Working…';
  try {
    const email = authEmail.value.trim();
    const password = authPassword.value;
    if (authMode === 'signup') {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: email.split('@')[0] });
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    authModal.classList.add('hidden');
    authForm.reset();
  } catch (error) {
    authMessage.textContent = friendlyAuthError(error);
  } finally {
    authAction.disabled = false;
  }
});

action.onclick = () => {
  const room = input.value.trim();
  if (!room) return input.focus();
  if (!auth?.currentUser) {
    modal.classList.add('hidden');
    openAuth('signin');
    authMessage.textContent = 'Sign in first, then you can create or join a room.';
    return;
  }
  status.textContent = `Room: ${room}`;
  modal.classList.add('hidden');
  input.value = '';
};

input.addEventListener('keydown', event => { if (event.key === 'Enter') action.click(); });

if (auth) {
  onAuthStateChanged(auth, user => {
    if (user) {
      status.textContent = `Signed in as ${user.displayName || user.email}`;
      signin.textContent = 'Sign out';
    } else {
      status.textContent = 'Ready to collaborate';
      signin.textContent = 'Sign in';
    }
  });
} else {
  status.textContent = 'Firebase setup required';
}
