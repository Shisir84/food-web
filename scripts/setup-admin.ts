import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
}

async function runAdminSetup() {
  console.log('====================================================');
  console.log('   Nova Hunger Food - Firebase Admin Setup Script   ');
  console.log('====================================================\n');

  // 1. Load Firebase configuration
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.error('❌ Error: firebase-applet-config.json not found in root.');
    console.error('Please ensure Firebase is provisioned before running this script.');
    process.exit(1);
  }

  const config: FirebaseAppletConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const projectId = config.projectId;
  console.log(`📌 Target Firebase Project: ${projectId}`);

  // 2. Resolve Admin credentials and configuration from environment
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase().trim();
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || process.env.ADMIN_PASSWORD;
  const updateExisting = process.env.UPDATE_EXISTING_ADMIN === 'true';

  console.log(`📧 Target Admin Email: ${adminEmail}`);
  console.log(`🔒 Update Existing Account Mode: ${updateExisting ? 'ENABLED (will update password if provided)' : 'DISABLED (existing credentials protected)'}`);

  // 3. Initialize Firebase Admin SDK
  let adminApp;
  try {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else {
      let credentialOption: any = undefined;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
          credentialOption = cert(serviceAccount);
          console.log('🔑 Using Service Account from FIREBASE_SERVICE_ACCOUNT_JSON environment variable.');
        } catch (e) {
          console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON JSON.');
        }
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const saPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        if (fs.existsSync(saPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
          credentialOption = cert(serviceAccount);
          console.log(`🔑 Using Service Account from file: ${saPath}`);
        } else {
          console.warn(`⚠️ Warning: Service account file specified at ${saPath} not found.`);
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const gacPath = path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS);
        if (fs.existsSync(gacPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(gacPath, 'utf8'));
          credentialOption = cert(serviceAccount);
          console.log(`🔑 Using Service Account from GOOGLE_APPLICATION_CREDENTIALS: ${gacPath}`);
        }
      }

      adminApp = initializeApp({
        credential: credentialOption,
        projectId: projectId,
      });
    }
  } catch (initErr: any) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', initErr.message);
    process.exit(1);
  }

  const auth = getAuth(adminApp);
  let db;
  try {
    db = getFirestore(adminApp, config.firestoreDatabaseId || '(default)');
  } catch (dbErr) {
    console.warn('⚠️ Note: Firestore admin instance initialized with default options.');
  }

  // 4. Verify whether user exists in Firebase Authentication
  try {
    console.log(`\n🔍 Checking if user '${adminEmail}' exists in project '${projectId}'...`);
    let existingUser = null;
    try {
      existingUser = await auth.getUserByEmail(adminEmail);
    } catch (err: any) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    if (!existingUser) {
      // User does not exist -> Create new user
      if (!initialPassword) {
        console.error('\n❌ ERROR: Cannot create new admin user because no password was provided.');
        console.error('Please configure the initial password via the ADMIN_INITIAL_PASSWORD environment variable.');
        console.error('Example: ADMIN_INITIAL_PASSWORD="your-strong-password" npm run setup-admin\n');
        process.exit(1);
      }

      console.log(`Creating new Firebase Authentication user for ${adminEmail}...`);
      const newUser = await auth.createUser({
        email: adminEmail,
        password: initialPassword,
        emailVerified: true,
        displayName: 'Nova Master Admin',
      });

      console.log(`✅ User created successfully with UID: ${newUser.uid}`);

      // Set custom administrator claims: { admin: true }
      console.log('Assigning custom claim { admin: true } to user...');
      await auth.setCustomUserClaims(newUser.uid, { admin: true });
      console.log('✅ Custom claim { admin: true } successfully assigned.');

      // Sync with Firestore admin record
      if (db) {
        try {
          await db.collection('admins').doc(newUser.uid).set({
            uid: newUser.uid,
            email: adminEmail,
            role: 'admin',
            createdAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`✅ Admin profile document created in Firestore: /admins/${newUser.uid}`);
        } catch (fsErr: any) {
          console.warn(`⚠️ Warning: Could not write to Firestore admins collection: ${fsErr.message}`);
        }
      }

      console.log('\n🎉 Admin user setup complete! You can now log in at /admin/login using:');
      console.log(`   Email: ${adminEmail}`);
      console.log('   Password: [as provided via ADMIN_INITIAL_PASSWORD]');
    } else {
      // User already exists
      console.log(`ℹ️ Admin user already exists with UID: ${existingUser.uid}`);

      // Check / update claims
      const currentClaims = existingUser.customClaims || {};
      if (!currentClaims.admin) {
        console.log('Assigning missing administrator claim { admin: true }...');
        await auth.setCustomUserClaims(existingUser.uid, { ...currentClaims, admin: true });
        console.log('✅ Administrator claim { admin: true } granted to existing account.');
      } else {
        console.log('✅ Administrator claim { admin: true } is already verified on this account.');
      }

      if (updateExisting && initialPassword) {
        console.log('Updating administrator password as requested (UPDATE_EXISTING_ADMIN=true)...');
        await auth.updateUser(existingUser.uid, {
          password: initialPassword,
          emailVerified: true,
        });
        console.log('✅ Administrator password has been updated.');
      } else {
        console.log('🔒 Password was NOT modified. To explicitly reset the password, set UPDATE_EXISTING_ADMIN=true and provide ADMIN_INITIAL_PASSWORD.');
      }

      // Sync with Firestore
      if (db) {
        try {
          await db.collection('admins').doc(existingUser.uid).set({
            uid: existingUser.uid,
            email: adminEmail,
            role: 'admin',
            updatedAt: new Date().toISOString(),
          }, { merge: true });
          console.log(`✅ Admin profile document synchronized in Firestore: /admins/${existingUser.uid}`);
        } catch (fsErr: any) {
          console.warn(`⚠️ Note: Could not sync Firestore admins doc: ${fsErr.message}`);
        }
      }

      console.log('\n✅ Admin account verification and permissions sync complete!');
    }
  } catch (error: any) {
    console.error('\n❌ Admin setup encountered an error:');
    console.error(`   Code: ${error.code || 'UNKNOWN'}`);
    console.error(`   Message: ${error.message}`);

    if (error.code === 'auth/internal-error' && error.message.includes('identitytoolkit.googleapis.com')) {
      console.error('\n📋 ACTION REQUIRED FOR SERVICE ACCOUNT CREDENTIALS:');
      console.error('The Firebase Admin SDK requires credentials with permission to manage Firebase users.');
      console.error('To grant server-side Firebase Admin SDK access:');
      console.error('1. Go to Firebase Console: https://console.firebase.google.com/project/' + projectId + '/settings/serviceaccounts/adminsdk');
      console.error('2. Click "Generate new private key" to download the JSON service account key file.');
      console.error('3. Place the file in the project directory (e.g. ./serviceAccountKey.json).');
      console.error('4. Set FIREBASE_SERVICE_ACCOUNT_PATH="./serviceAccountKey.json" in your .env file.');
      console.error('5. Re-run: ADMIN_INITIAL_PASSWORD="YourPassword" npm run setup-admin');
    }
    process.exit(1);
  }
}

runAdminSetup();
