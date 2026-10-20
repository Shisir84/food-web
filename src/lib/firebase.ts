import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase only once
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Configure session persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase Auth persistence setup notice:', err?.message || err);
});

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Robust Google Sign-In with popup & actionable error diagnostics
export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch {
    // browserLocalPersistence fallback
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (!result.user) {
      throw new Error('Google sign-in completed without returning user credentials.');
    }
    return result.user;
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in cancelled: The login popup was closed before completion.');
    }
    if (code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in window is already active. Please finish or close it.');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup blocked by browser. Please allow popups for this site and retry.');
    }
    if (code === 'auth/unauthorized-domain') {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
      throw new Error(
        `Domain unauthorized (${hostname}). Please add "${hostname}" to Authorized Domains in Firebase Console (Authentication > Settings > Authorized domains).`
      );
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('Network error during Google sign-in. Please verify your internet connection and try again.');
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Google sign-in is not enabled in this Firebase project. Please enable Google under Firebase Console > Authentication > Sign-in method.'
      );
    }
    throw new Error(error?.message || 'Google sign-in failed. Please try again.');
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  updateProfile,
};

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify network connection and project rules.');
    }
  }
}


