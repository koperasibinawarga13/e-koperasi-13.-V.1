import { initializeApp, getApps } from "firebase/app";
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

// Initialize Firebase only if it hasn't been initialized yet.
if (getApps().length === 0) {
  initializeApp(firebaseConfig);
}

// getFirestore() will automatically use the default app instance.
// This is more robust in certain module-loading environments where passing
// the app instance explicitly might fail.
export const db = getFirestore();