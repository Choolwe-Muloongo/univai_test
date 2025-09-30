// src/lib/firebase-client.ts
// This file is intended ONLY for components that use the 'use client' directive.

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics"; 

const firebaseConfig = {
    // Note: The 'NEXT_PUBLIC_' prefix is required for client-side environment variables
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Required for Analytics
};

// --- 1. Singleton Initialization ---

const appsBeforeCheck = getApps().length;
const app = appsBeforeCheck === 0 
    ? initializeApp(firebaseConfig) 
    : getApp();
const wasInitialized = getApps().length > appsBeforeCheck;

// --- 2. Logging (for Browser Console) ---

if (wasInitialized) {
    console.log('✅ Firebase App Initialized for the FIRST time (Client-Side)');
} else {
    console.log('🔄 Firebase App Retrieved from existing instances (Client-Side)');
}

// --- 3. Initialize Services ---

// Firestore and Auth are safe to initialize here, as this file is only imported by client components.
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Analytics, but use a check to prevent potential issues during SSR/SSG.
let analytics: any = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
        analytics = getAnalytics(app);
        console.log('✅ Firebase Analytics Initialized (Client)');
    } catch (e) {
        console.error('❌ Failed to initialize Firebase Analytics:', e);
    }
}

// --- 4. Exports ---

export { app, db, auth, analytics };