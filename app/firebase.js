// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDlqmw1nlzHyOuzjAij4JjocXiCou1u-Ls",
  authDomain: "hometown-harvest-hub.firebaseapp.com",
  projectId: "hometown-harvest-hub",
  storageBucket: "hometown-harvest-hub.firebasestorage.app",
  messagingSenderId: "469331070172",
  appId: "1:469331070172:web:7cb996c4c670ee7dc17819",
  measurementId: "G-3R6N6Y4VF2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)