import { MongoClient, Db, Collection } from 'mongodb';

const DEFAULT_URI = 'mongodb+srv://kharatsaurav25:12345@cluster0.uj6s9.mongodb.net/?appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB || 'hospira';
const uri = process.env.MONGODB_URI || DEFAULT_URI;

let client: MongoClient;
let db: Db;

export async function connectDb(): Promise<Db> {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`[hospira] MongoDB connected (db: ${DB_NAME})`);
  return db;
}

export function hospitals(): Collection {
  return db.collection('hospitals');
}

export function tickets(): Collection {
  return db.collection('tickets');
}

export function receptionists(): Collection {
  return db.collection('receptionists');
}

export function patients(): Collection {
  return db.collection('patients');
}

export function counters(): Collection {
  return db.collection('counters');
}

export function system(): Collection {
  return db.collection('system');
}

export async function closeDb(): Promise<void> {
  await client?.close();
}
