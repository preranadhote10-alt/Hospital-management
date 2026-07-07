import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load Firebase configuration
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig = {};

try {
  const fileContent = fs.readFileSync(configPath, 'utf8');
  firebaseConfig = JSON.parse(fileContent);
} catch (error) {
  console.error('Error reading firebase-applet-config.json, using fallback empty config:', error);
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export default db;
