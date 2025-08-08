// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage"; // ✅ Add this

const firebaseConfig = {
  apiKey: "AIzaSyCS6Acs1e03DOXUlhk3WW7W6U8JIqeBZ5Q",
  authDomain: "localservice-467aa.firebaseapp.com",
  projectId: "localservice-467aa",
  storageBucket: "localservice-467aa.appspot.com",
  messagingSenderId: "211771669743",
  appId: "1:211771669743:web:e75959a59b4905814eaf1a",
  measurementId: "G-GR7G6GHWB1",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // ✅ Only define once
const analytics = getAnalytics(app); // optional

export { app, auth, db, storage }; // ✅ Clean export
