import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage, firebaseConfig, usernameToEmail } from './firebase';
import {
  Hospital,
  Ticket,
  TicketStatus,
  TicketSeverity,
  TicketType,
  MedicalHistory,
  UploadedDoc,
  Receptionist,
  DashboardStats,
} from './types';

// ---------------------------------------------------------------------------
// Reference catalog seeded once into Firestore (hospital directory).
// ---------------------------------------------------------------------------
const initialHospitals: Hospital[] = [
  {
    id: 'st-jude',
    name: 'St. Jude Medical Center',
    address: 'Main Wing A, Silicon Valley Campus',
    distance: '0.8 miles away',
    rating: 4.9,
    liveQueueWait: 8,
    consultationFee: 45,
    badge: 'Urgent Care Open',
    availableDocs: 12,
    description:
      'Specializing in Cardiology, Neurology, and Emergency Care with 24/7 staff availability.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCLCgScl5hl8sHMdtkcxRY17F8rt2QK1--wQWSvTv3F0TXaCl9aMtFvbIqjm2LsY9oaXBNdjAsAG7yXQtVAyROrmbAOL7aRdOBGuYWmpA87lQMQDtyp_3idTaVRwehb-vM5xVcUs0UrJ5Ut7xz6dHleURwmA0kImLSOvzhJdK4xoICFY2lFv2pDIfnPPyMLPouhLH5YmK3AYiooBWD7usg1DbPKruO19QXGYSQjV-6fsKTiGFkmN-96zv18lA6dfwxfO6unB2G3ijA',
  },
  {
    id: 'heritage',
    name: 'Heritage Health',
    address: 'Diagnostic Center, East Boulevard',
    distance: '2.4 miles away',
    rating: 4.7,
    liveQueueWait: 22,
    consultationFee: 30,
    badge: 'High Efficiency',
    availableDocs: 8,
    description:
      'State-of-the-art diagnostics and outpatient clinic specializing in general medicine.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD0Ybvwv_Zo6DXroM9gew01YQ2p3QUVtAeXoEXUWR3nBu-f_Ve6AyqmOMSGtw4YVinYtXIxB9OTJJ681kP2-dh6uzNkVEd7cSG9c8VNlOL6TIYAiVvq0Orfo3GRVPdniLCuQWzES6tQjHLB3z64naaHmuD4hMDKu6ZTSavQLx_82i9jImjHvsxputQA0cKh__xMXwYYQLRKIZJVCLxpJvcPMmccq9FNbkkSLyU_mYQc3RArcmjvWXZoad1dD0gNyFMgPfeUcqL9Ho8',
  },
  {
    id: 'pacific',
    name: 'Pacific Specialty',
    address: 'Orthopedics & Spine, Heights Road',
    distance: '5.1 miles away',
    rating: 4.5,
    liveQueueWait: 45,
    consultationFee: 60,
    badge: 'Specialty Center',
    availableDocs: 10,
    description:
      'Crisp contemporary design representing a premium healthcare facility in orthopedic solutions.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_6WqAT7cLNd1WndaOrJazvRMAN6NS41tmokNPVOV980XAYl7468jDfh3swPf5hRLTJW-Q12sEHGWQIhGO3BF_oiPojOvGMq6lfyZQytNG28bT20SYGoSRVm8QEntCqivLjemYy_c-ionj8-GtcEPmJbTd1O--ZSUqWacAZqm9ruolW-qZT4qqaJ5LI_-8DC4d4HWJshTlouFW1y9HrjGvi6cvhUczrxA1oJGbZo840MRVbUJPq5JaHHR2dQe62vX4kdmQg0DzEtE',
  },
  {
    id: 'city-general',
    name: 'City General Hospital',
    address: 'Central Plaza Wing, Bayview',
    distance: '1.2 miles away',
    rating: 4.8,
    liveQueueWait: 12,
    consultationFee: 40,
    badge: 'Full Service',
    availableDocs: 15,
    description:
      'Providing comprehensive inpatient and emergency services to the broader bay area.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApsI6LAd-DOe6hiq_DLG1JrlZXNgwC_DOfo03ISPSoGghZ2NYUS8sS_dM7uzv9ZQCZdMny8iyWsY4Y9GWlu27MydrMaOOGz8ZGCKAukmqhKjyG4ZkDshuZCDeLvaPSAkcPWxx8x6kH6rWUDRfMdM1q4zRxd1ImG-xZ4vodTXi1Dd3fsBx_WWsWUR_KwbMY71HYnzoElDQXhRyk2DJZk9aX2QSjcYeMd7aL8piaCiJc3a-4sOHj-W0lI2QPEU0iFkuppK1LvEvX0jI',
  },
];

// Default sandbox receptionist accounts (Firebase Auth email/password).
// NOTE: Firebase requires passwords >= 6 chars.
const defaultStaff = [
  {
    name: 'Jane Foster',
    username: 'jane',
    password: 'hospira123',
    hospitalId: 'st-jude',
    hospitalName: 'St. Jude Medical Center',
  },
  {
    name: 'Alice Smith',
    username: 'alice',
    password: 'hospira123',
    hospitalId: 'heritage',
    hospitalName: 'Heritage Health',
  },
];

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------
export async function ensureSeeded(): Promise<void> {
  try {
    const seedRef = doc(db, 'system', 'seed');
    const seedSnap = await getDoc(seedRef);
    if (seedSnap.exists()) return;

    const hospSnap = await getDocs(collection(db, 'hospitals'));
    if (hospSnap.empty) {
      for (const h of initialHospitals) {
        await setDoc(doc(db, 'hospitals', h.id), h);
      }
    }

    await seedDefaultStaff();
    await setDoc(seedRef, { seededAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error seeding Firestore:', error);
  }
}

async function seedDefaultStaff(): Promise<void> {
  for (const s of defaultStaff) {
    try {
      const uid = await createStaffAuthUser(usernameToEmail(s.username), s.password);
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name: s.name,
        username: s.username,
        hospitalId: s.hospitalId,
        hospitalName: s.hospitalName,
        role: 'receptionist',
      });
    } catch (error: any) {
      if (error?.code !== 'auth/email-already-in-use') {
        console.warn('Could not seed staff account', s.username, error);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Real-time subscriptions
// ---------------------------------------------------------------------------
export function subscribeHospitals(cb: (hospitals: Hospital[]) => void) {
  return onSnapshot(collection(db, 'hospitals'), (snap) => {
    cb(snap.docs.map((d) => d.data() as Hospital));
  });
}

export async function getHospital(hospitalId: string): Promise<Hospital | null> {
  const snap = await getDoc(doc(db, 'hospitals', hospitalId));
  return snap.exists() ? (snap.data() as Hospital) : null;
}

export function subscribeTicket(
  ticketId: string,
  cb: (ticket: Ticket | null) => void,
  onError?: (err: unknown) => void
) {
  return onSnapshot(
    doc(db, 'tickets', ticketId),
    (snap) => cb(snap.exists() ? (snap.data() as Ticket) : null),
    (err) => onError?.(err)
  );
}

export function subscribeHospitalTickets(
  hospitalId: string,
  cb: (tickets: Ticket[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(collection(db, 'tickets'), where('hospitalId', '==', hospitalId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as Ticket);
      list.sort(sortTickets);
      cb(list);
    },
    (err) => onError?.(err)
  );
}

const STATUS_ORDER: Record<string, number> = {
  Urgent: 1,
  Called: 2,
  Waiting: 3,
  Completed: 4,
  Cancelled: 5,
};

function sortTickets(a: Ticket, b: Ticket): number {
  const orderA = STATUS_ORDER[a.status] || 3;
  const orderB = STATUS_ORDER[b.status] || 3;
  if (orderA !== orderB) return orderA - orderB;
  return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
}

// ---------------------------------------------------------------------------
// Tickets
// ---------------------------------------------------------------------------
export interface CreateTicketPayload {
  fullName: string;
  phone: string;
  age?: number | string;
  gender?: string;
  symptoms?: string;
  severity?: TicketSeverity;
  type?: TicketType;
  reason?: string;
  department?: string;
  hospitalId: string;
  hospitalName?: string;
  medicalHistory?: MedicalHistory;
  documents?: UploadedDoc[];
}

async function nextToken(hospitalId: string, prefix: string): Promise<string> {
  const counterRef = doc(db, 'counters', hospitalId);
  const seq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data().seq as number) || 0 : 0;
    const next = current + 1;
    tx.set(counterRef, { seq: next }, { merge: true });
    return next;
  });
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const severity: TicketSeverity = payload.severity || 'Mild';
  const type: TicketType = payload.type || 'Walk-in';
  const reason = payload.reason || 'General Consultation';

  let prefix = 'W';
  if (severity === 'Critical' || reason === 'Emergency / Urgent Care') prefix = 'A';
  else if (type === 'Online') prefix = 'B';

  const token = await nextToken(payload.hospitalId, prefix);
  const id = `ticket-${Date.now()}`;
  const isUrgent = severity === 'Critical' || reason === 'Emergency / Urgent Care';

  const ticket: Ticket = {
    id,
    token,
    fullName: payload.fullName,
    phone: payload.phone,
    age: Number(payload.age) || 30,
    gender: payload.gender || 'Not Specified',
    symptoms: payload.symptoms || '',
    severity,
    status: isUrgent ? 'Urgent' : 'Waiting',
    joinedAt: new Date().toISOString(),
    type,
    reason,
    department: payload.department || 'General',
    hospitalId: payload.hospitalId,
    hospitalName: payload.hospitalName || 'Hospital Center',
    documents: payload.documents || [],
  };
  if (payload.medicalHistory) ticket.medicalHistory = payload.medicalHistory;

  await setDoc(doc(db, 'tickets', id), ticket);

  // Dynamically nudge the hospital's live wait time upward.
  const hospitalRef = doc(db, 'hospitals', payload.hospitalId);
  const hospitalSnap = await getDoc(hospitalRef);
  if (hospitalSnap.exists()) {
    const current = hospitalSnap.data() as Hospital;
    const additionalTime = severity === 'Critical' ? 10 : 5;
    await updateDoc(hospitalRef, {
      liveQueueWait: (current.liveQueueWait || 5) + additionalTime,
    });
  }

  return ticket;
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const ticketSnap = await getDoc(ticketRef);
  if (!ticketSnap.exists()) throw new Error('Ticket not found');

  const updates: Record<string, unknown> = { status };
  if (status === 'Called') updates.calledAt = new Date().toISOString();
  if (status === 'Completed') updates.completedAt = new Date().toISOString();

  await updateDoc(ticketRef, updates);

  if (status === 'Completed' || status === 'Cancelled') {
    const ticket = ticketSnap.data() as Ticket;
    const hospitalRef = doc(db, 'hospitals', ticket.hospitalId);
    const hospitalSnap = await getDoc(hospitalRef);
    if (hospitalSnap.exists()) {
      const current = hospitalSnap.data() as Hospital;
      const reduction = ticket.severity === 'Critical' ? 10 : 5;
      const newWait = Math.max(5, (current.liveQueueWait || 10) - reduction);
      await updateDoc(hospitalRef, { liveQueueWait: newWait });
    }
  }
}

export async function rescheduleTicket(ticketId: string): Promise<void> {
  await updateDoc(doc(db, 'tickets', ticketId), {
    joinedAt: new Date().toISOString(),
    status: 'Waiting',
  });
}

// Clears every ticket for a hospital and resets its token counter.
export async function clearHospitalTickets(hospitalId: string): Promise<void> {
  const q = query(collection(db, 'tickets'), where('hospitalId', '==', hospitalId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(doc(db, 'tickets', d.id));
  }
  await setDoc(doc(db, 'counters', hospitalId), { seq: 0 }, { merge: true });
}

// ---------------------------------------------------------------------------
// Stats (computed live from real tickets)
// ---------------------------------------------------------------------------
export function computeStats(tickets: Ticket[]): DashboardStats {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayTotal = tickets.filter(
    (t) => new Date(t.joinedAt) >= startOfDay
  ).length;
  const onlineBookings = tickets.filter((t) => t.type === 'Online').length;
  const walkins = tickets.filter((t) => t.type === 'Walk-in').length;

  const waiting = tickets.filter(
    (t) => t.status === 'Waiting' || t.status === 'Urgent'
  );
  const totalWait = waiting.reduce(
    (sum, t) => sum + (t.severity === 'Critical' ? 10 : 15),
    0
  );
  const avgWaitTime = waiting.length ? Math.round(totalWait / waiting.length) : 0;

  return { todayTotal, onlineBookings, walkins, avgWaitTime };
}

// Number of patients ahead of the given ticket in the active queue.
export function queuePosition(ticket: Ticket, tickets: Ticket[]): number {
  const joined = new Date(ticket.joinedAt).getTime();
  return tickets.filter(
    (t) =>
      t.id !== ticket.id &&
      (t.status === 'Waiting' || t.status === 'Urgent' || t.status === 'Called') &&
      new Date(t.joinedAt).getTime() < joined
  ).length;
}

// ---------------------------------------------------------------------------
// Authentication (Firebase Auth)
// ---------------------------------------------------------------------------
async function createStaffAuthUser(email: string, password: string): Promise<string> {
  // Use a secondary app instance so creating a user does not sign out
  // the currently authenticated admin/receptionist on the primary app.
  const secondary = initializeApp(firebaseConfig, `secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return cred.user.uid;
  } finally {
    await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondary).catch(() => undefined);
  }
}

export async function getUserProfile(uid: string): Promise<Receptionist | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: uid,
    name: data.name,
    username: data.username,
    hospitalId: data.hospitalId,
    hospitalName: data.hospitalName,
  };
}

export async function loginStaff(
  username: string,
  password: string
): Promise<Receptionist> {
  const cred = await signInWithEmailAndPassword(
    auth,
    usernameToEmail(username),
    password
  );
  const profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    await signOut(auth);
    throw new Error('No receptionist profile is linked to this account.');
  }
  return profile;
}

export async function logoutStaff(): Promise<void> {
  await signOut(auth);
}

// ---------------------------------------------------------------------------
// Onboarding (hospital + staff account)
// ---------------------------------------------------------------------------
export interface OnboardPayload {
  name: string;
  address: string;
  description?: string;
  consultationFee?: number;
  availableDocs?: number;
  image?: string;
  badge?: string;
  staffName: string;
  staffUsername: string;
  staffPassword: string;
}

export async function onboardHospitalAndStaff(
  payload: OnboardPayload
): Promise<Receptionist> {
  const hospitalId =
    payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' +
    Date.now();

  const hospital: Hospital = {
    id: hospitalId,
    name: payload.name,
    address: payload.address,
    distance: 'Local Facility',
    rating: 5.0,
    liveQueueWait: 5,
    consultationFee: Number(payload.consultationFee) || 30,
    badge: payload.badge || 'New Partner',
    availableDocs: Number(payload.availableDocs) || 1,
    description: payload.description || 'Newly onboarded clinic utilizing Hospira.',
    image:
      payload.image ||
      'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600',
  };

  await setDoc(doc(db, 'hospitals', hospitalId), hospital);

  const uid = await createStaffAuthUser(
    usernameToEmail(payload.staffUsername),
    payload.staffPassword
  );

  const profile: Receptionist & { role: string } = {
    id: uid,
    name: payload.staffName,
    username: payload.staffUsername,
    hospitalId,
    hospitalName: hospital.name,
    role: 'receptionist',
  };
  await setDoc(doc(db, 'users', uid), profile);

  return {
    id: uid,
    name: payload.staffName,
    username: payload.staffUsername,
    hospitalId,
    hospitalName: hospital.name,
  };
}

// ---------------------------------------------------------------------------
// Storage (document uploads)
// ---------------------------------------------------------------------------
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function uploadTicketDocuments(files: File[]): Promise<UploadedDoc[]> {
  const uploaded: UploadedDoc[] = [];
  for (const file of files) {
    const storagePath = `tickets/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    uploaded.push({
      name: file.name,
      size: formatSize(file.size),
      type: file.type || 'file',
      url,
      storagePath,
    });
  }
  return uploaded;
}
