import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: 'AIzaSyC9VtSkZlLSyIR2REzy3WqHwSk561NgVQU',
  authDomain: 'coder-hub-a5122.firebaseapp.com',
  projectId: 'coder-hub-a5122',
  storageBucket: 'coder-hub-a5122.firebasestorage.app',
  messagingSenderId: '343249888402',
  appId: '1:343249888402:web:ceb8d8a7c71c81373af24b',
  measurementId: 'G-QVE94P0065'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
