import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAE7XX-8Jn3T1tgZBBzuSu22OJ1HtNLiGE",
  authDomain: "saverrnapp.firebaseapp.com",
  projectId: "saverrnapp",
  storageBucket: "saverrnapp.firebasestorage.app",
  messagingSenderId: "610582580020",
  appId: "1:610582580020:web:e83124f479b3d38f71b361",
  measurementId: "G-JMSDKRJ5ZJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
