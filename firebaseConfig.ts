import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDNFHn1AffQHEtMxjYcmOWMV3xyNv_9nHU",
  authDomain: "e-koperasi13.firebaseapp.com",
  projectId: "e-koperasi13",
  storageBucket: "e-koperasi13.firebasestorage.app",
  messagingSenderId: "15792482213",
  appId: "1:15792482213:web:d7b1965f9b11a5380a2a4c",
  measurementId: "G-B96R2RRHPW"
};

// This robust pattern prevents re-initialization errors.
// It checks if an app is already initialized before creating a new one.
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Explicitly pass the app instance to getFirestore for clarity and robustness.
export const db = getFirestore(app);
