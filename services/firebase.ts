
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxTKa4CizP2XXl2hKPHq8xLk7kZt-xGXA",
  authDomain: "portionperfect-d4086.firebaseapp.com",
  projectId: "portionperfect-d4086",
  storageBucket: "portionperfect-d4086.firebasestorage.app",
  messagingSenderId: "326611948348",
  appId: "1:326611948348:web:0eb706e454ffd35967c439",
  measurementId: "G-NJGKM9SX0P"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
