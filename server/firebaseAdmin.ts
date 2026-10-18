import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
}

let appletConfig: FirebaseAppletConfig | null = null;

export function getFirebaseConfig(): FirebaseAppletConfig {
  if (appletConfig) return appletConfig;
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return appletConfig!;
  }
  throw new Error('firebase-applet-config.json not found in root.');
}

let adminAppInitialized = false;

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const config = getFirebaseConfig();
  let credentialOption: any = undefined;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      credentialOption = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
    } catch (e) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON');
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const saPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(saPath)) {
      credentialOption = cert(JSON.parse(fs.readFileSync(saPath, 'utf8')));
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const gacPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
    if (fs.existsSync(gacPath)) {
      credentialOption = cert(JSON.parse(fs.readFileSync(gacPath, 'utf8')));
    }
  }

  const app = initializeApp({
    credential: credentialOption,
    projectId: config.projectId,
  });
  adminAppInitialized = true;
  return app;
}

export interface VerifiedAdminResult {
  uid: string;
  email: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

/**
 * Verifies a Firebase ID token and ensures server-verified administrator claims.
 * A matching email address alone is NOT sufficient.
 */
export async function verifyAdminIdToken(idToken: string): Promise<VerifiedAdminResult> {
  const config = getFirebaseConfig();

  // Method 1: Try Firebase Admin SDK if initialized with credentials
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken, true);

    const isAdmin = decoded.admin === true;
    return {
      uid: decoded.uid,
      email: decoded.email || '',
      isAdmin,
      emailVerified: !!decoded.email_verified,
    };
  } catch (adminErr: any) {
    // If Admin SDK lacks credentials or throws internal error, fall back to Google Identity Toolkit REST verification
    // This cryptographically verifies the ID token against Google Identity servers using the project API key
    try {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      const data = await resp.json();
      if (!resp.ok || !data.users || data.users.length === 0) {
        throw new Error(data.error?.message || 'Invalid or expired Firebase ID token');
      }

      const user = data.users[0];
      let isAdmin = false;

      if (user.customAttributes) {
        try {
          const parsed = JSON.parse(user.customAttributes);
          isAdmin = parsed.admin === true;
        } catch {
          isAdmin = false;
        }
      }

      return {
        uid: user.localId,
        email: user.email || '',
        isAdmin,
        emailVerified: !!user.emailVerified,
      };
    } catch (restErr: any) {
      throw new Error(`Firebase token verification failed: ${restErr.message}`);
    }
  }
}
