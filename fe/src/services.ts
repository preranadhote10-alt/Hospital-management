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
  Patient,
  PatientSession,
} from './types';

const POLL_MS = 3000;
const SESSION_KEY = 'hospira-receptionist';
const PATIENT_SESSION_KEY = 'hospira-patient';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

function poll<T>(fetcher: () => Promise<T>, cb: (data: T) => void, onError?: (err: unknown) => void) {
  let active = true;
  const tick = async () => {
    while (active) {
      try {
        cb(await fetcher());
      } catch (err) {
        onError?.(err);
      }
      await new Promise((r) => setTimeout(r, POLL_MS));
    }
  };
  tick();
  return () => {
    active = false;
  };
}

// ---------------------------------------------------------------------------
// Hospitals
// ---------------------------------------------------------------------------
export async function ensureSeeded(): Promise<void> {
  // Seeding runs on the server at startup.
}

export function subscribeHospitals(cb: (hospitals: Hospital[]) => void) {
  return poll(() => api<Hospital[]>('/api/hospitals'), cb);
}

export async function getHospital(hospitalId: string): Promise<Hospital | null> {
  try {
    return await api<Hospital>(`/api/hospitals/${hospitalId}`);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tickets (polled for live updates)
// ---------------------------------------------------------------------------
export function subscribeTicket(
  ticketId: string,
  cb: (ticket: Ticket | null) => void,
  onError?: (err: unknown) => void
) {
  return poll(
    async () => {
      try {
        return await api<Ticket>(`/api/tickets/${ticketId}`);
      } catch {
        return null;
      }
    },
    cb,
    onError
  );
}

export function subscribeHospitalTickets(
  hospitalId: string,
  cb: (tickets: Ticket[]) => void,
  onError?: (err: unknown) => void
) {
  return poll(
    () => api<Ticket[]>(`/api/tickets?hospitalId=${encodeURIComponent(hospitalId)}`),
    cb,
    onError
  );
}

export interface CreateTicketPayload {
  fullName: string;
  phone: string;
  password?: string;
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

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  return api<Ticket>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  await api(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function rescheduleTicket(ticketId: string): Promise<void> {
  await api(`/api/tickets/${ticketId}/reschedule`, { method: 'POST' });
}

export async function clearHospitalTickets(hospitalId: string): Promise<void> {
  await api('/api/tickets/clear', {
    method: 'POST',
    body: JSON.stringify({ hospitalId }),
  });
}

// ---------------------------------------------------------------------------
// Stats (client-side from ticket list, or via API)
// ---------------------------------------------------------------------------
export function computeStats(tickets: Ticket[]): DashboardStats {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayTotal = tickets.filter((t) => new Date(t.joinedAt) >= startOfDay).length;
  const onlineBookings = tickets.filter((t) => t.type === 'Online').length;
  const walkins = tickets.filter((t) => t.type === 'Walk-in').length;

  const waiting = tickets.filter((t) => t.status === 'Waiting' || t.status === 'Urgent');
  const totalWait = waiting.reduce(
    (sum, t) => sum + (t.severity === 'Critical' ? 10 : 15),
    0
  );
  const avgWaitTime = waiting.length ? Math.round(totalWait / waiting.length) : 0;

  return { todayTotal, onlineBookings, walkins, avgWaitTime };
}

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
// Staff auth (session stored in sessionStorage)
// ---------------------------------------------------------------------------
export function getStoredReceptionist(): Receptionist | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Receptionist) : null;
  } catch {
    return null;
  }
}

export async function loginStaff(username: string, password: string): Promise<Receptionist> {
  const profile = await api<Receptionist>('/api/receptionists/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  return profile;
}

export async function logoutStaff(): Promise<void> {
  sessionStorage.removeItem(SESSION_KEY);
}

// ---------------------------------------------------------------------------
// Patient auth (session stored in sessionStorage)
// ---------------------------------------------------------------------------
export function getStoredPatient(): PatientSession | null {
  try {
    const raw = sessionStorage.getItem(PATIENT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as PatientSession) : null;
  } catch {
    return null;
  }
}

function savePatientSession(patient: Patient, activeTicketId: string | null) {
  const session: PatientSession = {
    id: patient.id,
    fullName: patient.fullName,
    phone: patient.phone,
    activeTicketId,
  };
  sessionStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function setPatientActiveTicket(ticketId: string | null) {
  const stored = getStoredPatient();
  if (!stored) return;
  savePatientSession(stored, ticketId);
}

export async function loginPatient(phone: string, password: string): Promise<PatientSession> {
  const result = await api<Patient & { activeTicket: Ticket | null }>('/api/patients/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  });
  return savePatientSession(result, result.activeTicket?.id ?? null);
}

export async function logoutPatient(): Promise<void> {
  sessionStorage.removeItem(PATIENT_SESSION_KEY);
}

export function savePatientAfterRegistration(
  patient: { id?: string; fullName: string; phone: string },
  ticketId: string
): PatientSession {
  const session: PatientSession = {
    id: patient.id || `patient-${ticketId}`,
    fullName: patient.fullName,
    phone: patient.phone,
    activeTicketId: ticketId,
  };
  sessionStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(session));
  return session;
}

// ---------------------------------------------------------------------------
// Onboarding
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

export async function onboardHospitalAndStaff(payload: OnboardPayload): Promise<Receptionist> {
  const profile = await api<Receptionist>('/api/onboard', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
  return profile;
}

// ---------------------------------------------------------------------------
// Document uploads (base64 via API)
// ---------------------------------------------------------------------------
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function uploadTicketDocuments(files: File[]): Promise<UploadedDoc[]> {
  const payload = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type || 'application/octet-stream',
      data: await fileToBase64(file),
    }))
  );
  return api<UploadedDoc[]>('/api/uploads', {
    method: 'POST',
    body: JSON.stringify({ files: payload }),
  });
}
