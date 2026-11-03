// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
