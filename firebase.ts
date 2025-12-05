import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYVaxSfvI3shAgKc01zYbe_JpMoGDt1c0",
  authDomain: "loopzy-e1054.firebaseapp.com",
  databaseURL: "https://loopzy-e1054-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "loopzy-e1054",
  storageBucket: "loopzy-e1054.appspot.com",
  messagingSenderId: "988476144327",
  appId: "1:988476144327:web:7b30d1fdf6a9adc9059ce2",
  measurementId: "G-04W7WG6SD5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);