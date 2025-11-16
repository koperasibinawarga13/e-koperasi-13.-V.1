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

// More robust initialization: get the app if it exists, otherwise initialize.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Explicitly pass the app instance to getFirestore to ensure connection.
export const db = getFirestore(app);