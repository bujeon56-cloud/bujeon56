import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, runTransaction } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, inMemoryPersistence, createUserWithEmailAndPassword, sendPasswordResetEmail, deleteUser } from 'firebase/auth';

// Firebase web configuration is public. Access is enforced by Auth and Firestore rules.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBIqRlMbofXFfOViLAz3SKUMIUbXCEdf2w',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'bujeon56-356f9.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'bujeon56-356f9',
  storageBucket: 'bujeon56-356f9.firebasestorage.app',
  messagingSenderId: '920876856276',
  appId: '1:920876856276:web:6418d97d03ee76d9289c41'
};
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const authReady = setPersistence(auth, browserLocalPersistence).then(() => auth.authStateReady());
const isFirebaseConfigured = true;

export async function createStaffAccount(email, password, saveProfile) {
  // A separate in-memory Auth instance keeps the administrator signed in.
  const secondary = initializeApp(firebaseConfig, `staff-${crypto.randomUUID()}`);
  const secondaryAuth = getAuth(secondary);
  let created;
  let profileSaved = false;
  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);
    created = (await createUserWithEmailAndPassword(secondaryAuth, email, password)).user;
    await saveProfile(created.uid);
    profileSaved = true;
    return created.uid;
  } catch (error) {
    if (created && !profileSaved) await deleteUser(created).catch(() => {});
    throw error;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondary);
  }
}

export { app, db, auth, authReady, isFirebaseConfigured, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, runTransaction, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail };
