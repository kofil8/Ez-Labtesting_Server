import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;

export const getFirebaseAdmin = () => {
  if (firebaseApp) return admin;

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is missing in env.');
  }

  const json = Buffer.from(base64, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(json);

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });

  return admin;
};
