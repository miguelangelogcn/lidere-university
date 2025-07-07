import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import serviceAccount from '../../lidere-university-firebase-adminsdk-fbsvc.json';

// Check if the service account has the necessary properties.
// This is a type assertion to satisfy TypeScript.
const serviceAccountParams = {
    type: serviceAccount.type,
    projectId: serviceAccount.project_id,
    privateKeyId: serviceAccount.private_key_id,
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    clientId: serviceAccount.client_id,
    authUri: serviceAccount.auth_uri,
    tokenUri: serviceAccount.token_uri,
    authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccount.client_x509_cert_url,
};

if (!getApps().length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountParams),
    });
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();
const adminStorage = admin.storage();

export { adminDb, adminAuth, adminStorage };
