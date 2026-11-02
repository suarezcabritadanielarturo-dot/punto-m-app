import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDCbeJRLxvboWnPxyKPCFcnjnoHuINpHUi",
  authDomain: "puntom-app.firebaseapp.com",
  projectId: "puntom-app",
  storageBucket: "puntom-app.appspot.com",
  messagingSenderId: "690148844286",
  appId: "1:690148844286:web:cb9d271de6e11e710f5e4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export { signInWithPopup, signOut };
