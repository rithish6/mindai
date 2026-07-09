import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDpVxv4adnpdWQaRYS7sw8K2JPDKjG4mM",
  authDomain: "edumind-2427a.firebaseapp.com",
  projectId: "edumind-2427a",
  storageBucket: "edumind-2427a.firebasestorage.app",
  messagingSenderId: "147811690941",
  appId: "1:147811690941:web:41749274a4a0e293a5cad4",
  measurementId: "G-HXXBV310M4"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
