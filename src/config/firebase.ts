import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration
// ВАЖНО: Замените эти значения на свои из Firebase Console
// https://console.firebase.google.com/ → Project Settings → General
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyDemoKey-ReplaceWithYourOwnKey",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "personal-dashboard-demo.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "personal-dashboard-demo",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "personal-dashboard-demo.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Optional: Force account selection every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
