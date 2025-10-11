import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyArknUpV4qb2dvcMKRNAQDowJaLid7vBLI",
  authDomain: "personal-dashboard-204da.firebaseapp.com",
  databaseURL: "https://personal-dashboard-204da-default-rtdb.firebaseio.com",
  projectId: "personal-dashboard-204da",
  storageBucket: "personal-dashboard-204da.firebasestorage.app",
  messagingSenderId: "330879438401",
  appId: "1:330879438401:web:ddfbe0211ff2b9eafbc0c0",
  measurementId: "G-LDQBBCFH4K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);

// Optional: Force account selection every time
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
