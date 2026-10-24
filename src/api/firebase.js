import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { isProtectedAccount } from '../utils/protectedAccounts.js';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, runTransaction, writeBatch, arrayUnion } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, inMemoryPersistence, createUserWithEmailAndPassword, sendPasswordResetEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';

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

export async function changeAdminPassword(uid, currentPassword, newPassword) {
  if (!auth.currentUser) throw new Error('관리자로 다시 로그인해주세요.');
  if (!currentPassword || !newPassword || newPassword.length < 6) throw new Error('현재 비밀번호와 6자 이상의 새 비밀번호를 입력해주세요.');
  const actor = await getDoc(doc(db, 'users', auth.currentUser.uid));
  if (!actor.exists() || actor.data().role !== 'admin') throw new Error('관리자만 계정 비밀번호를 변경할 수 있습니다.');
  const target = await getDoc(doc(db, 'users', uid));
  if (!target.exists() || target.data().role !== 'admin') throw new Error('관리자 계정을 찾을 수 없습니다.');
  const profile = {...target.data(), id:uid};
  if (isProtectedAccount(profile)) throw new Error('보호된 관리자 계정은 수정할 수 없습니다.');
  const secondary = initializeApp(firebaseConfig, `password-${crypto.randomUUID()}`);
  const secondaryAuth = getAuth(secondary);
  try {
    await setPersistence(secondaryAuth, inMemoryPersistence);
    const credential = await signInWithEmailAndPassword(secondaryAuth, profile.email, currentPassword);
    if (credential.user.uid !== uid) throw new Error('로그인 계정과 관리자 정보가 일치하지 않습니다.');
    await updatePassword(credential.user, newPassword);
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondary);
  }
}

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

export { app, db, auth, authReady, isFirebaseConfigured, collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, runTransaction, writeBatch, arrayUnion, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword };
