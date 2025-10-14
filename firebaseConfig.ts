// FIX: Import firebase to resolve 'Cannot find name 'firebase'' error.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
// Using compat libraries for easier integration with existing code patterns
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

export { db };