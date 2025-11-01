import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyArknUpV4qb2dvcMKRNAQDowJaLid7vBLI",
  authDomain: "personal-dashboard-204da.firebaseapp.com",
  databaseURL: "https://personal-dashboard-204da-default-rtdb.firebaseio.com",
  projectId: "personal-dashboard-204da",
  storageBucket: "personal-dashboard-204da.firebasestorage.app",
  messagingSenderId: "330879438401",
  appId: "1:330879438401:web:ddfbe0211ff2b9eafbc0c0",
  measurementId: "G-LDQBBCFH4K",
};

const app = initializeApp(firebaseConfig);

let analytics: ReturnType<typeof getAnalytics> | undefined;
try {
  analytics = getAnalytics(app);
} catch (error) {
  console.log("Analytics blocked by browser extension (AdBlock/Privacy) - this is normal");
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const database = getDatabase(app);
export { analytics };

googleProvider.setCustomParameters({
  prompt: "select_account",
  access_type: "offline",
  include_granted_scopes: "true",
});
