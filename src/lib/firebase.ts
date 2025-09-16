// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "studio-5936000523-94fe4",
  appId: "1:113270122651:web:2ec37baf6d57931990fe3e",
  storageBucket: "studio-5936000523-94fe4.firebasestorage.app",
  apiKey: "AIzaSyCYqIrIiizjxCA-2YIBiryQ28cmgCKpzQY",
  authDomain: "studio-5936000523-94fe4.firebaseapp.com",
  messagingSenderId: "113270122651",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
