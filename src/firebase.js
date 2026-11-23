/**
 * Firebase Configuration for NAOS Hub
 * Initializes Firebase using environment variables.
 * Import this wherever you need auth or firestore.
 *
 * If env vars are missing (e.g. on Vercel without config),
 * auth and db are exported as null so the public site still renders.
 */

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

// Validate required env vars
const requiredEnvs = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = requiredEnvs.filter((key) => !import.meta.env[key]);

let app = null;
let auth = null;
let db = null;
let messaging = null;

if (missing.length > 0) {
  console.warn(
    `[Firebase] Missing environment variables: ${missing.join(", ")}. Auth and Firestore will not work. Public site will still render.`
  );
} else {
  try {
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize Messaging if supported by the browser
    if (typeof window !== "undefined") {
      isSupported().then((supported) => {
        if (supported) {
          messaging = getMessaging(app);
        }
      }).catch((err) => {
        console.warn("[Firebase] FCM is not supported in this browser environment:", err.message);
      });
    }
  } catch (err) {
    console.warn("[Firebase] Failed to initialize Firebase:", err.message);
  }
}

export { app, auth, db, messaging };