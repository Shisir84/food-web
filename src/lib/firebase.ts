import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify network connection and project rules.');
    }
  }
}

// Map Firebase error codes to detailed, actionable messages
export function formatFirebaseAuthError(error: any): string {
  if (!error) return 'An unknown authentication error occurred.';
  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/user-not-found':
      return 'Account not found. No user exists with this email address in Firebase Authentication. Please run the server-side admin provisioning script.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid credentials. The password entered is incorrect. Use "Forgot Password?" to reset your credentials if needed.';
    case 'auth/user-disabled':
      return 'This administrator account has been disabled in the Firebase Console. Contact the system administrator.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to multiple failed login attempts. Please wait a few moments or reset your password.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in your Firebase Console. Go to Firebase Console → Authentication → Sign-in method, click "Email/Password", and switch "Enable" to ON.';
    case 'auth/invalid-email':
      return 'The email address format is invalid. Please enter a valid email address.';
    case 'auth/weak-password':
      return 'The new password is too weak. Please use at least 8 characters with a mix of letters, numbers, and symbols.';
    case 'auth/requires-recent-login':
      return 'For security, this sensitive action requires a fresh sign-in. Please log out and sign back in to continue.';
    case 'auth/network-request-failed':
      return 'Network communication failed while contacting Firebase Authentication. Please check your internet connectivity.';
    case 'auth/admin-claim-missing':
      return 'Access Denied: Authenticated user does not possess administrative privileges ({ admin: true }). A matching email alone does not grant access.';
    default:
      if (message.includes('PASSWORD_LOGIN_DISABLED')) {
        return 'Email/Password sign-in is not enabled in Firebase Console. Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password.';
      }
      return message || 'Authentication failed. Please verify your credentials.';
  }
}

export {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  signOut,
};
export type { FirebaseUser };
