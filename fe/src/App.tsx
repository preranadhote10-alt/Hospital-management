import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.tsx';
import RegistrationPage from './components/RegistrationPage.tsx';
import LiveQueueDashboard from './components/LiveQueueDashboard.tsx';
import ReceptionDesk from './components/ReceptionDesk.tsx';
import { Hospital, Ticket } from './types.ts';
import { Sparkles, Layers, Activity } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'landing' | 'register' | 'status' | 'staff'>('landing');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Hospitals on Mount
  const fetchHospitals = async () => {
    try {
      const response = await fetch('/api/hospitals');
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
        if (data.length > 0) {
          setSelectedHospital(data[0]); // fallback default
        }
      }
    } catch (error) {
      console.error('Error fetching hospitals from API:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Handle Form Submission from the Registration Screen
  const handleRegisterPatient = async (registrationPayload: any) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationPayload)
      });

      if (response.ok) {
        const newTicket = await response.json();
        setSelectedTicketId(newTicket.id);
        setView('status'); // transition directly to live status tracker!
      } else {
        alert('Triage queue server rejected registration.');
      }
    } catch (error) {
      console.error('Error submitting patient registration:', error);
      alert('Could not establish connection to the triage server.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="text-center space-y-4 animate-pulse">
          <Activity size={32} className="text-blue-600 mx-auto animate-spin" />
          <p className="text-slate-900 font-semibold text-lg tracking-tight">Hospira System Booting...</p>
          <p className="text-slate-500 text-xs">Synchronizing database and seeding clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f8fafc]">
      
      {/* Floating Interactive Dev Panel - Exposes all 4 screenshots views instantly! */}
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
            onClick={() => {
              // Set a fallback ticket ID if none exists for instant tracking visualization
              if (!selectedTicketId) setSelectedTicketId('ticket-1');
              setView('status');
            }} 
            className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
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
          />
        )}

        {view === 'register' && selectedHospital && (
          <RegistrationPage 
            hospital={selectedHospital}
            onBack={() => setView('landing')}
            onSubmit={handleRegisterPatient}
          />
        )}

        {view === 'status' && selectedTicketId && (
          <LiveQueueDashboard 
            ticketId={selectedTicketId}
            onBackToHome={() => setView('landing')}
          />
        )}

        {view === 'staff' && (
          <ReceptionDesk 
            onBackToHome={() => setView('landing')}
            onSelectTicket={(id) => {
              setSelectedTicketId(id);
              setView('status');
            }}
            hospitals={hospitals}
            onRefreshHospitals={fetchHospitals}
          />
        )}
      </div>
    </div>
  );
}
