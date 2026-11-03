// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCbeJRlxwboVmPxyKPCFqnjmoHuINpHuI",
  authDomain: "puntom-app.firebaseapp.com",
  projectId: "puntom-app",
  storageBucket: "puntom-app.firebasestorage.app",
  messagingSenderId: "650145844205",
  appId: "1:650145844205:web:c59d271de05e11e710f5e4",
  measurementId: "G-PY0WKVDPKG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firebase services used across the app
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { signInWithPopup, signOut };
