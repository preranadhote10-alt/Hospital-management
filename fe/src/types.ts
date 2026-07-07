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

export type TicketStatus = 'Waiting' | 'Called' | 'Completed' | 'Cancelled';
export type TicketSeverity = 'Mild' | 'Moderate' | 'Severe' | 'Critical';
export type TicketType = 'Walk-in' | 'Online';

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
}

export interface Specialty {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
}
