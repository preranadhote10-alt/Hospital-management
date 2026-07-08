import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.tsx';
import RegistrationPage from './components/RegistrationPage.tsx';
import LiveQueueDashboard from './components/LiveQueueDashboard.tsx';
import ReceptionDesk from './components/ReceptionDesk.tsx';
import EmergencyChatbot from './components/EmergencyChatbot.tsx';
import { Hospital } from './types.ts';
import { Activity } from 'lucide-react';
import {
  ensureSeeded,
  subscribeHospitals,
  createTicket,
  CreateTicketPayload,
  getStoredPatient,
  savePatientAfterRegistration,
} from './services.ts';

export default function App() {
  const [view, setView] = useState<'landing' | 'register' | 'status' | 'staff'>('landing');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyHospitalId, setEmergencyHospitalId] = useState<string | undefined>();

  const openEmergencyChat = (hospitalId?: string) => {
    setEmergencyHospitalId(hospitalId);
    setEmergencyOpen(true);
  };

  // Restore patient session (queue ticket) on load.
  useEffect(() => {
    const stored = getStoredPatient();
    if (stored?.activeTicketId) {
      setSelectedTicketId(stored.activeTicketId);
      setView('status');
    }
  }, []);

  // Seed reference data (once) then subscribe to live hospital updates.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      await ensureSeeded();
      unsub = subscribeHospitals((data) => {
        setHospitals(data);
        setSelectedHospital((prev) => prev ?? (data.length > 0 ? data[0] : null));
        setLoading(false);
      });
    })();
    return () => unsub?.();
  }, []);

  const handleRegisterPatient = async (registrationPayload: CreateTicketPayload) => {
    try {
      const newTicket = await createTicket(registrationPayload);
      savePatientAfterRegistration(
        {
          id: newTicket.patientId,
          fullName: registrationPayload.fullName,
          phone: registrationPayload.phone,
        },
        newTicket.id
      );
      setSelectedTicketId(newTicket.id);
      setView('status');
    } catch (error) {
      console.error('Error submitting patient registration:', error);
      const message = error instanceof Error ? error.message : 'Registration failed.';
      if (message.includes('already have an active queue ticket')) {
        alert(message + ' Use "Track My Queue" on the home page to log in.');
      } else if (message.includes('already registered')) {
        alert(message);
      } else {
        alert('Could not register you into the triage queue. Please try again.');
      }
      throw error;
    }
  };

  const handlePatientLoginSuccess = (ticketId: string | null) => {
    if (ticketId) {
      setSelectedTicketId(ticketId);
      setView('status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="text-center space-y-4 animate-pulse">
          <Activity size={32} className="text-blue-600 mx-auto animate-spin" />
          <p className="text-slate-900 font-semibold text-lg tracking-tight">Hospira System Booting...</p>
          <p className="text-slate-500 text-xs">Connecting to Hospira API and MongoDB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f8fafc]">

      {/* Floating Interactive Dev Panel - Exposes all 4 views instantly */}
      <div className="bg-slate-900 text-white py-2 px-6 flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 relative z-50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Interactive Sandbox Controller</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setView('landing')}
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
              view === 'landing' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            1. Patient Landing
          </button>
          <button
            onClick={() => {
              if (hospitals.length > 0) {
                setSelectedHospital(hospitals[0]);
              }
              setView('register');
            }}
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
              view === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            2. Registration (5-Steps)
          </button>
          <button
            onClick={() => setView('status')}
            disabled={!selectedTicketId}
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              view === 'status' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            3. Live Queue Status
          </button>
          <button
            onClick={() => setView('staff')}
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
              view === 'staff' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            4. Reception (Staff Desk)
          </button>
        </div>
      </div>

      {/* Render selected screen based on Router state */}
      <div className="flex-1 flex flex-col">
        {view === 'landing' && (
          <LandingPage
            hospitals={hospitals}
            onJoinQueue={(hospital) => {
              setSelectedHospital(hospital);
              setView('register');
            }}
            onNavigateToStaff={() => setView('staff')}
            onNavigateToStatus={(id) => {
              setSelectedTicketId(id);
              setView('status');
            }}
            onPatientLoginSuccess={handlePatientLoginSuccess}
            onOpenEmergencyChat={() => openEmergencyChat()}
          />
        )}

        {view === 'register' && selectedHospital && (
          <RegistrationPage
            hospital={selectedHospital}
            onBack={() => setView('landing')}
            onSubmit={handleRegisterPatient}
            onOpenEmergencyChat={() => openEmergencyChat(selectedHospital.id)}
          />
        )}

        {view === 'status' && selectedTicketId && (
          <LiveQueueDashboard
            ticketId={selectedTicketId}
            onBackToHome={() => setView('landing')}
            onOpenEmergencyChat={(hospitalId) => openEmergencyChat(hospitalId)}
          />
        )}

        {view === 'staff' && (
          <ReceptionDesk
            onBackToHome={() => setView('landing')}
            onSelectTicket={(id) => {
              setSelectedTicketId(id);
              setView('status');
            }}
            onOpenEmergencyChat={(hospitalId) => openEmergencyChat(hospitalId)}
          />
        )}
      </div>

      <EmergencyChatbot
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        hospitals={hospitals}
        defaultHospitalId={emergencyHospitalId}
        onActivated={(ticketId) => {
          setSelectedTicketId(ticketId);
          setView('status');
        }}
      />
    </div>
  );
}
