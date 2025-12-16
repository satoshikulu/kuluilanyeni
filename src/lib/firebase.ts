// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase config - verdiğiniz bilgiler
const firebaseConfig = {
  apiKey: "AIzaSyCrQhePIDi7omAYVfUmPL6BKZTObtnvGfQ",
  authDomain: "kuluilanyeni.firebaseapp.com",
  projectId: "kuluilanyeni",
  storageBucket: "kuluilanyeni.firebasestorage.app",
  messagingSenderId: "151921029592",
  appId: "1:151921029592:web:84f0ee5d7c15e05466c2ad",
  measurementId: "G-FG3H7NKTTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
export default app;