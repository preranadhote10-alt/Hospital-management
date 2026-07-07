import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Primary app instance (shared across the client)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore uses a named database in this project.
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Synthetic email domain used to map receptionist "usernames" onto Firebase Auth.
export const STAFF_EMAIL_DOMAIN = 'hospira.local';
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;

export { app, firebaseConfig };
export default app;
