// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";


// const firebaseConfig = {
//   apiKey: "AIzaSyArpeFcM9wvSXsuWxiM2QhRQPbV8HGOUBc",
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
// };
const firebaseConfig = {
  apiKey: "AIzaSyArpeFcM9wvSXsuWxiM2QhRQPbV8HGOUBc",
  authDomain: "qrattendance-f1f28.firebaseapp.com",
  projectId: "qrattendance-f1f28",
  storageBucket: "qrattendance-f1f28.firebasestorage.app",
  messagingSenderId: "336695458653",
  appId: "1:336695458653:web:9f54f52c9d45c6761786b4",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
