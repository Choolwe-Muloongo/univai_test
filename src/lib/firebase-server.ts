import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const appsBeforeCheck = getApps().length;
const app = appsBeforeCheck === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();
const wasInitialized = getApps().length > appsBeforeCheck;

if (wasInitialized) {
  console.log('✅ Firebase App Initialized for the FIRST time (Route Handler)');
} else {
  console.log('🔄 Firebase App Retrieved from existing instances (Route Handler)');
}

// ✅ ONLY get Firestore
const db = getFirestore(app); 

export { app, db };