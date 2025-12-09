// firebase.js
import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";

import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes
} from "firebase/storage";

import AsyncStorage from "@react-native-async-storage/async-storage";

// --------------------
// CONFIG
// --------------------
const firebaseConfig = {
  apiKey: "AIzaSyDzjB8yg7YLsTvOCbgXeE5A5kltG2cg4fE",
  authDomain: "chatapp1-c2ded.firebaseapp.com",
  projectId: "chatapp1-c2ded",
  storageBucket: "chatapp1-c2ded.firebasestorage.app",
  messagingSenderId: "390047300552",
  appId: "1:390047300552:web:c3cc24be8a52e52dcadefd"
};

// --------------------
// INIT APP
// --------------------
const app = initializeApp(firebaseConfig);

// --------------------
// INIT AUTH
// --------------------
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// --------------------
// FIRESTORE & STORAGE
// --------------------
const db = getFirestore(app);
const storage = getStorage(app);

// --------------------
// COLLECTION REFERENCES
// --------------------
const usersRef = collection(db, "users");
const messagesRef = collection(db, "messages");

// --------------------
// EXPORT
// --------------------
export {
  // MAIN
  auth,
  db,
  storage,
  // AUTH
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  // FIRESTORE
  addDoc,
  doc,
  getDoc,
  getDocs,
  messagesRef,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  usersRef,
  where,
  // STORAGE
  getDownloadURL,
  ref,
  uploadBytes
};

