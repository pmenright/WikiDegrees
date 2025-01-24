// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBuRSe4ZVMA6U0FbpPuoNGO30-tchJYw74",
  authDomain: "bluelinks-2c564.firebaseapp.com",
  projectId: "bluelinks-2c564",
  storageBucket: "bluelinks-2c564.firebasestorage.app",
  messagingSenderId: "6620732629",
  appId: "1:6620732629:web:b42f57d44549afe928165c",
  measurementId: "G-N96CHXGKE2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app); // Ensure auth is exported