import { initializeApp } from "firebase/app";
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

// Inisialisasi Firebase. This creates the default app instance.
initializeApp(firebaseConfig);

// Dapatkan referensi ke layanan database.
// By not passing an app instance, getFirestore() uses the default instance.
// This can prevent initialization issues in some environments.
export const db = getFirestore();