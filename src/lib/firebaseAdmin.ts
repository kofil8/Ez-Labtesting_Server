import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

const initializeFirebaseAdmin = () => {
  if (firebaseApp) return firebaseApp;

  if (admin.apps.length) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

    if (fs.existsSync(absolutePath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      return firebaseApp;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.',
    );
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return firebaseApp;
};

export const getFirebaseAdmin = () => initializeFirebaseAdmin();

export const getFirebaseMessaging = () => {
  const app = initializeFirebaseAdmin();
  return app.messaging();
};

export default initializeFirebaseAdmin;
