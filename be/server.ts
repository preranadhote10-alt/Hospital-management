import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import express from 'express';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import {
  connectDb,
  hospitals,
  tickets,
  receptionists,
  patients,
  prescriptions,
  counters,
  system,
} from './db';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const clientDir = path.join(process.cwd(), 'dist', 'public');
const uploadsDir = path.join(process.cwd(), 'uploads', 'tickets');

app.use(express.json({ limit: '15mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------
const initialHospitals = [
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

const defaultStaff = [
  { name: 'Jane Foster', username: 'jane', password: 'hospira123', hospitalId: 'st-jude' },
  { name: 'Alice Smith', username: 'alice', password: 'hospira123', hospitalId: 'heritage' },
];

const STATUS_ORDER: Record<string, number> = {
  Urgent: 1,
  Called: 2,
  Waiting: 3,
  Completed: 4,
  Cancelled: 5,
};

function sortTickets(
  a: { status: string; joinedAt: string; isEmergency?: boolean },
  b: { status: string; joinedAt: string; isEmergency?: boolean }
) {
  if (a.isEmergency && !b.isEmergency) return -1;
  if (!a.isEmergency && b.isEmergency) return 1;
  const orderA = STATUS_ORDER[a.status] || 3;
  const orderB = STATUS_ORDER[b.status] || 3;
  if (orderA !== orderB) return orderA - orderB;
  return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
}

function ticketSortFields(t: Record<string, unknown>) {
  return {
    status: String(t.status),
    joinedAt: String(t.joinedAt),
    isEmergency: Boolean(t.isEmergency),
  };
}

async function savePatientMedicalHistory(patientId: string, medicalHistory: unknown) {
  if (!medicalHistory) return;
  await patients().updateOne(
    { id: patientId },
    {
      $set: {
        medicalHistory,
        lastTicketAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  );
}

async function getPatientMedicalHistory(patientId: string) {
  const patient = await patients().findOne({ id: patientId });
  if (patient?.medicalHistory) return patient.medicalHistory;

  const latest = await tickets()
    .find({ patientId, medicalHistory: { $exists: true } })
    .sort({ joinedAt: -1 })
    .limit(1)
    .toArray();
  return latest[0]?.medicalHistory || null;
}

async function emergencyPriorityJoinedAt(hospitalId: string): Promise<string> {
  const active = await tickets()
    .find({ hospitalId, status: { $in: ACTIVE_TICKET_STATUSES } })
    .toArray();
  if (!active.length) return new Date().toISOString();

  let earliest = Date.now();
  for (const t of active) {
    const ts = new Date(String(t.joinedAt)).getTime();
    if (ts < earliest) earliest = ts;
  }
  return new Date(earliest - 1000).toISOString();
}

function summarizeMedicalHistory(history: Record<string, unknown> | null): string[] {
  if (!history) return [];
  const labels: Record<string, string> = {
    diabetes: 'Diabetes',
    highBP: 'High Blood Pressure',
    asthma: 'Asthma',
    allergies: 'Allergies',
    heartCondition: 'Heart Condition',
    surgeries: 'Previous Surgeries',
  };
  const items = Object.entries(labels)
    .filter(([key]) => history[key] === true)
    .map(([, label]) => label);
  const other = String(history.otherConditions || '').trim();
  if (other) items.push(other);
  return items;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

const ACTIVE_TICKET_STATUSES = ['Waiting', 'Urgent', 'Called'];

async function findActiveTicketForPatient(patientId: string) {
  const list = await tickets()
    .find({ patientId, status: { $in: ACTIVE_TICKET_STATUSES } })
    .toArray();
  list.sort(
    (a, b) =>
      new Date(String(b.joinedAt)).getTime() - new Date(String(a.joinedAt)).getTime()
  );
  return list[0] || null;
}

function patientProfile(doc: { id: string; fullName: string; phone: string }) {
  return { id: doc.id, fullName: doc.fullName, phone: doc.phone };
}

async function upsertPatientAccount(
  fullName: string,
  phone: string,
  password: string
): Promise<{ id: string; fullName: string; phone: string }> {
  const phoneNormalized = normalizePhone(phone);
  if (!phoneNormalized) throw new Error('Invalid phone number');
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existing = await patients().findOne({ phoneNormalized });
  if (existing) {
    const match = await bcrypt.compare(password, existing.password as string);
    if (!match) {
      const err = new Error('This phone number is already registered. Please log in with your password.');
      (err as Error & { status?: number }).status = 409;
      throw err;
    }
    await patients().updateOne(
      { id: existing.id },
      { $set: { fullName, phone, updatedAt: new Date().toISOString() } }
    );
    return { id: existing.id as string, fullName, phone };
  }

  const id = `patient-${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  await patients().insertOne({
    id,
    fullName,
    phone,
    phoneNormalized,
    password: passwordHash,
    createdAt: new Date().toISOString(),
  });
  return { id, fullName, phone };
}

async function nextToken(hospitalId: string, prefix: string): Promise<string> {
  const result = await counters().findOneAndUpdate(
    { hospitalId },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const seq = (result?.seq as number) || 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

async function seedDatabase() {
  const seeded = await system().findOne({ id: 'seed' });
  if (seeded) return;

  const hospCount = await hospitals().countDocuments();
  if (hospCount === 0) {
    await hospitals().insertMany(initialHospitals);
  }

  for (const s of defaultStaff) {
    const existing = await receptionists().findOne({ username: s.username });
    if (existing) continue;

    const hospital = await hospitals().findOne({ id: s.hospitalId });
    await receptionists().insertOne({
      id: `recep-${s.username}`,
      name: s.name,
      username: s.username,
      password: s.password,
      hospitalId: s.hospitalId,
      hospitalName: hospital?.name || 'Hospital',
    });
  }

  await system().insertOne({ id: 'seed', seededAt: new Date().toISOString() });
  console.log('[hospira] database seeded');
}

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'hospira', db: 'mongodb', mode: isProd ? 'production' : 'development' });
});

app.get('/api/hospitals', async (_req, res) => {
  try {
    const list = await hospitals().find().toArray();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hospitals/:id', async (req, res) => {
  try {
    const hospital = await hospitals().findOne({ id: req.params.id });
    if (!hospital) return res.status(404).json({ error: 'Hospital not found' });
    res.json(hospital);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tickets', async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const filter = hospitalId ? { hospitalId: String(hospitalId) } : {};
    const list = await tickets().find(filter).toArray();
    list.sort((a, b) => sortTickets(ticketSortFields(a), ticketSortFields(b)));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await tickets().findOne({ id: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const {
      fullName,
      phone,
      password,
      age,
      gender,
      symptoms,
      severity = 'Mild',
      type = 'Walk-in',
      reason = 'General Consultation',
      department = 'General',
      hospitalId,
      hospitalName,
      medicalHistory,
      documents = [],
    } = req.body;

    if (!fullName || !phone || !hospitalId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let patientId: string | undefined;
    if (password) {
      try {
        const patient = await upsertPatientAccount(fullName, phone, password);
        patientId = patient.id;

        const existingActive = await tickets().findOne({
          patientId,
          hospitalId,
          status: { $in: ACTIVE_TICKET_STATUSES },
        });
        if (existingActive) {
          return res.status(409).json({
            error: 'You already have an active queue ticket at this hospital. Please log in to track it.',
            activeTicketId: existingActive.id,
          });
        }
      } catch (err: any) {
        const status = err.status || 400;
        return res.status(status).json({ error: err.message });
      }
    }

    let prefix = 'W';
    if (severity === 'Critical' || reason === 'Emergency / Urgent Care') prefix = 'A';
    else if (type === 'Online') prefix = 'B';

    const token = await nextToken(hospitalId, prefix);
    const id = `ticket-${Date.now()}`;
    const isUrgent = severity === 'Critical' || reason === 'Emergency / Urgent Care';

    const ticket: Record<string, unknown> = {
      id,
      token,
      fullName,
      phone,
      age: Number(age) || 30,
      gender: gender || 'Not Specified',
      symptoms: symptoms || '',
      severity,
      status: isUrgent ? 'Urgent' : 'Waiting',
      joinedAt: new Date().toISOString(),
      type,
      reason,
      department,
      hospitalId,
      hospitalName: hospitalName || 'Hospital Center',
      documents,
    };
    if (medicalHistory) ticket.medicalHistory = medicalHistory;
    if (patientId) {
      ticket.patientId = patientId;
      await savePatientMedicalHistory(patientId, medicalHistory);
    }

    await tickets().insertOne(ticket);

    const hospital = await hospitals().findOne({ id: hospitalId });
    if (hospital) {
      const additionalTime = severity === 'Critical' ? 10 : 5;
      await hospitals().updateOne(
        { id: hospitalId },
        { $set: { liveQueueWait: (hospital.liveQueueWait || 5) + additionalTime } }
      );
    }

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { status, severity } = req.body;
    const ticket = await tickets().findOne({ id: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (severity !== undefined) updates.severity = severity;
    if (status === 'Called') updates.calledAt = new Date().toISOString();
    if (status === 'Completed') updates.completedAt = new Date().toISOString();

    await tickets().updateOne({ id: req.params.id }, { $set: updates });

    if (status === 'Completed' || status === 'Cancelled') {
      const hospital = await hospitals().findOne({ id: ticket.hospitalId });
      if (hospital) {
        const reduction = ticket.severity === 'Critical' ? 10 : 5;
        await hospitals().updateOne(
          { id: ticket.hospitalId },
          { $set: { liveQueueWait: Math.max(5, (hospital.liveQueueWait || 10) - reduction) } }
        );
      }
    }

    const updated = await tickets().findOne({ id: req.params.id });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets/:id/reschedule', async (req, res) => {
  try {
    const ticket = await tickets().findOne({ id: req.params.id });
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    await tickets().updateOne(
      { id: req.params.id },
      { $set: { joinedAt: new Date().toISOString(), status: 'Waiting' } }
    );
    const updated = await tickets().findOne({ id: req.params.id });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tickets/clear', async (req, res) => {
  try {
    const { hospitalId } = req.body;
    if (!hospitalId) return res.status(400).json({ error: 'hospitalId required' });

    await tickets().deleteMany({ hospitalId });
    await counters().updateOne({ hospitalId }, { $set: { seq: 0 } }, { upsert: true });
    res.json({ status: 'cleared', hospitalId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { hospitalId } = req.query;
    const filter = hospitalId ? { hospitalId: String(hospitalId) } : {};
    const list = await tickets().find(filter).toArray();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayTotal = list.filter((t) => new Date(t.joinedAt) >= startOfDay).length;
    const onlineBookings = list.filter((t) => t.type === 'Online').length;
    const walkins = list.filter((t) => t.type === 'Walk-in').length;

    const waiting = list.filter((t) => t.status === 'Waiting' || t.status === 'Urgent');
    const totalWait = waiting.reduce(
      (sum, t) => sum + (t.severity === 'Critical' ? 10 : 15),
      0
    );
    const avgWaitTime = waiting.length ? Math.round(totalWait / waiting.length) : 0;

    res.json({ todayTotal, onlineBookings, walkins, avgWaitTime });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hospitals', async (req, res) => {
  try {
    const { name, address, description, consultationFee, availableDocs, image, badge } = req.body;
    if (!name || !address) {
      return res.status(400).json({ error: 'Missing required hospital fields (name, address)' });
    }

    const hospitalId =
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();

    const hospital = {
      id: hospitalId,
      name,
      address,
      distance: 'Local Facility',
      rating: 5.0,
      liveQueueWait: 5,
      consultationFee: Number(consultationFee) || 30,
      badge: badge || 'New Partner',
      availableDocs: Number(availableDocs) || 1,
      description: description || 'Newly onboarded clinic utilizing Hospira.',
      image:
        image ||
        'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600',
    };

    await hospitals().insertOne(hospital);
    res.status(201).json(hospital);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/receptionists', async (req, res) => {
  try {
    const { name, username, password, hospitalId } = req.body;
    if (!name || !username || !password || !hospitalId) {
      return res.status(400).json({ error: 'Missing required receptionist fields' });
    }

    const existing = await receptionists().findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const hospital = await hospitals().findOne({ id: hospitalId });
    const hospitalName = hospital?.name || 'Partner Hospital';

    const id = `recep-${Date.now()}`;
    await receptionists().insertOne({ id, name, username, password, hospitalId, hospitalName });
    res.status(201).json({ id, name, username, hospitalId, hospitalName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/onboard', async (req, res) => {
  try {
    const {
      name,
      address,
      description,
      consultationFee,
      availableDocs,
      image,
      badge,
      staffName,
      staffUsername,
      staffPassword,
    } = req.body;

    if (!name || !address || !staffName || !staffUsername || !staffPassword) {
      return res.status(400).json({ error: 'Missing required onboarding fields' });
    }

    const hospitalId =
      name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const hospital = {
      id: hospitalId,
      name,
      address,
      distance: 'Local Facility',
      rating: 5.0,
      liveQueueWait: 5,
      consultationFee: Number(consultationFee) || 30,
      badge: badge || 'New Partner',
      availableDocs: Number(availableDocs) || 1,
      description: description || 'Newly onboarded clinic utilizing Hospira.',
      image:
        image ||
        'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600',
    };
    await hospitals().insertOne(hospital);

    const existing = await receptionists().findOne({ username: staffUsername });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const recepId = `recep-${Date.now()}`;
    await receptionists().insertOne({
      id: recepId,
      name: staffName,
      username: staffUsername,
      password: staffPassword,
      hospitalId,
      hospitalName: hospital.name,
    });

    res.status(201).json({
      id: recepId,
      name: staffName,
      username: staffUsername,
      hospitalId,
      hospitalName: hospital.name,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/receptionists/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const recep = await receptionists().findOne({ username, password });
    if (!recep) return res.status(401).json({ error: 'Invalid username or password' });

    res.json({
      id: recep.id,
      name: recep.name,
      username: recep.username,
      hospitalId: recep.hospitalId,
      hospitalName: recep.hospitalName || 'Partner Hospital',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/patients/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone number and password required' });
    }

    const phoneNormalized = normalizePhone(phone);
    if (!phoneNormalized) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const patient = await patients().findOne({ phoneNormalized });
    if (!patient) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const match = await bcrypt.compare(password, patient.password as string);
    if (!match) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const activeTicket = await findActiveTicketForPatient(patient.id as string);
    res.json({
      ...patientProfile({
        id: String(patient.id),
        fullName: String(patient.fullName),
        phone: String(patient.phone),
      }),
      activeTicket: activeTicket || null,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/emergency/activate', async (req, res) => {
  try {
    const { phone, password, hospitalId, symptoms } = req.body;
    if (!phone || !password || !hospitalId) {
      return res.status(400).json({ error: 'Phone number, password, and hospital are required' });
    }

    const phoneNormalized = normalizePhone(phone);
    if (!phoneNormalized) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const patient = await patients().findOne({ phoneNormalized });
    if (!patient) {
      return res.status(404).json({
        error: 'No record found for this number. Please complete registration first.',
      });
    }

    const match = await bcrypt.compare(password, patient.password as string);
    if (!match) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    const hospital = await hospitals().findOne({ id: hospitalId });
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found' });
    }

    const patientId = String(patient.id);
    const medicalHistory = await getPatientMedicalHistory(patientId);
    const priorityJoinedAt = await emergencyPriorityJoinedAt(hospitalId);

    const existingActive = await tickets().findOne({
      patientId,
      hospitalId,
      status: { $in: ACTIVE_TICKET_STATUSES },
    });

    let ticket;
    if (existingActive) {
      const updates: Record<string, unknown> = {
        status: 'Urgent',
        severity: 'Critical',
        reason: 'Emergency / Urgent Care',
        isEmergency: true,
        joinedAt: priorityJoinedAt,
        department: 'Cardiology',
      };
      if (symptoms) updates.symptoms = symptoms;
      if (medicalHistory) updates.medicalHistory = medicalHistory;

      await tickets().updateOne({ id: existingActive.id }, { $set: updates });
      ticket = await tickets().findOne({ id: existingActive.id });
    } else {
      const token = await nextToken(hospitalId, 'A');
      const id = `ticket-${Date.now()}`;
      const newTicket: Record<string, unknown> = {
        id,
        token,
        fullName: patient.fullName,
        phone: patient.phone,
        age: 30,
        gender: 'Not Specified',
        symptoms: symptoms || 'Emergency activation',
        severity: 'Critical',
        status: 'Urgent',
        joinedAt: priorityJoinedAt,
        type: 'Walk-in',
        reason: 'Emergency / Urgent Care',
        department: 'Cardiology',
        hospitalId,
        hospitalName: hospital.name,
        documents: [],
        patientId,
        isEmergency: true,
      };
      if (medicalHistory) newTicket.medicalHistory = medicalHistory;

      await tickets().insertOne(newTicket);
      ticket = newTicket;

      await hospitals().updateOne(
        { id: hospitalId },
        { $set: { liveQueueWait: (hospital.liveQueueWait || 5) + 10 } }
      );
    }

    const historySummary = summarizeMedicalHistory(
      medicalHistory as Record<string, unknown> | null
    );

    res.json({
      ticket,
      patient: patientProfile({
        id: patientId,
        fullName: String(patient.fullName),
        phone: String(patient.phone),
      }),
      medicalHistory: medicalHistory || null,
      historySummary,
      queuePosition: 1,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/prescriptions', async (req, res) => {
  try {
    const { hospitalId, patientId, phone } = req.query;
    const filter: Record<string, unknown> = {};
    if (hospitalId) filter.hospitalId = String(hospitalId);

    const phoneNormalized = phone ? normalizePhone(String(phone)) : '';
    if (patientId && phoneNormalized) {
      filter.$or = [{ patientId: String(patientId) }, { phoneNormalized }];
    } else if (patientId) {
      filter.patientId = String(patientId);
    } else if (phoneNormalized) {
      filter.phoneNormalized = phoneNormalized;
    }

    const list = await prescriptions().find(filter).sort({ createdAt: -1 }).toArray();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/prescriptions', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      phone,
      ticketId,
      hospitalId,
      hospitalName,
      prescribedBy,
      patientIssue,
      medication,
      dosage,
      frequency,
      duration,
      notes,
    } = req.body;

    if (!patientName || !phone || !hospitalId || !patientIssue || !medication || !dosage) {
      return res.status(400).json({
        error: 'Patient name, phone, hospital, patient issue, medication, and dosage are required',
      });
    }

    const phoneNormalized = normalizePhone(phone);
    if (!phoneNormalized) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const hospital = await hospitals().findOne({ id: hospitalId });

    const prescription: Record<string, unknown> = {
      id: `rx-${Date.now()}`,
      patientName: String(patientName).trim(),
      phone: String(phone).trim(),
      phoneNormalized,
      hospitalId,
      hospitalName: hospitalName || hospital?.name || 'Hospital',
      prescribedBy: prescribedBy || 'Staff',
      patientIssue: String(patientIssue).trim(),
      medication: String(medication).trim(),
      dosage: String(dosage).trim(),
      frequency: frequency || 'As directed',
      duration: duration || '7 days',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };
    if (patientId) prescription.patientId = String(patientId);
    if (ticketId) prescription.ticketId = String(ticketId);

    await prescriptions().insertOne(prescription);
    res.status(201).json(prescription);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/uploads', async (req, res) => {
  try {
    const files = req.body.files as { name: string; type: string; data: string }[];
    if (!files?.length) return res.status(400).json({ error: 'No files provided' });

    fs.mkdirSync(uploadsDir, { recursive: true });

    const uploaded = [];
    for (const file of files) {
      const buffer = Buffer.from(file.data, 'base64');
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storagePath = `tickets/${filename}`;
      const diskPath = path.join(uploadsDir, filename);
      fs.writeFileSync(diskPath, buffer);
      uploaded.push({
        name: file.name,
        size: formatSize(buffer.length),
        type: file.type || 'file',
        url: `/uploads/${storagePath}`,
        storagePath,
      });
    }
    res.json(uploaded);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Static / Vite
// ---------------------------------------------------------------------------
async function start() {
  await connectDb();
  await hospitals().createIndex({ id: 1 }, { unique: true });
  await tickets().createIndex({ id: 1 }, { unique: true });
  await tickets().createIndex({ hospitalId: 1 });
  await tickets().createIndex({ patientId: 1 });
  await receptionists().createIndex({ username: 1 }, { unique: true });
  await patients().createIndex({ phoneNormalized: 1 }, { unique: true });
  await prescriptions().createIndex({ id: 1 }, { unique: true });
  await prescriptions().createIndex({ hospitalId: 1 });
  await prescriptions().createIndex({ patientId: 1 });
  await prescriptions().createIndex({ phoneNormalized: 1 });
  await counters().createIndex({ hospitalId: 1 }, { unique: true });
  await seedDatabase();

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(clientDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(clientDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[hospira] ${isProd ? 'production' : 'development'} API + SPA at http://localhost:${PORT}`
    );
    if (isProd) console.log(`[hospira] static assets from ${clientDir}`);
  });
}

start().catch((err) => {
  console.error('[hospira] failed to start:', err);
  process.exit(1);
});
