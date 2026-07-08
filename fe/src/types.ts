export interface Hospital {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  liveQueueWait: number; // in minutes
  consultationFee: number;
  badge?: string;
  availableDocs: number;
  description: string;
  image: string;
}

export type TicketStatus = 'Waiting' | 'Urgent' | 'Called' | 'Completed' | 'Cancelled';
export type TicketSeverity = 'Mild' | 'Moderate' | 'Severe' | 'Critical';
export type TicketType = 'Walk-in' | 'Online';

export interface MedicalHistory {
  diabetes: boolean;
  highBP: boolean;
  asthma: boolean;
  allergies: boolean;
  heartCondition: boolean;
  surgeries: boolean;
  otherConditions: string;
}

export interface UploadedDoc {
  name: string;
  size: string;
  type: string;
  url: string;
  storagePath: string;
}

export interface Ticket {
  id: string;
  token: string;
  fullName: string;
  phone: string;
  age: number;
  gender: string;
  symptoms: string;
  severity: TicketSeverity;
  status: TicketStatus;
  joinedAt: string; // ISO String
  type: TicketType;
  reason: string;
  department: string;
  hospitalId: string;
  hospitalName: string;
  medicalHistory?: MedicalHistory;
  documents?: UploadedDoc[];
  patientId?: string;
  calledAt?: string;
  completedAt?: string;
}

export interface Specialty {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
}

export interface Receptionist {
  id: string;
  name: string;
  username: string;
  hospitalId: string;
  hospitalName: string;
}

export interface Patient {
  id: string;
  fullName: string;
  phone: string;
}

export interface PatientSession extends Patient {
  activeTicketId: string | null;
}

export interface DashboardStats {
  todayTotal: number;
  onlineBookings: number;
  walkins: number;
  avgWaitTime: number;
}
