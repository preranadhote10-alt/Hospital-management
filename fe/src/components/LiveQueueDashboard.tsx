import React, { useState, useEffect } from 'react';
import {
  Bell,
  User,
  AlertCircle,
  Play,
  Users,
  Clock,
  MapPin,
  Phone,
  Share2,
  FileText,
  Download,
  QrCode,
  Navigation,
  ArrowLeft,
  XCircle,
} from 'lucide-react';
import { Ticket, Hospital } from '../types';
import {
  subscribeTicket,
  subscribeHospitalTickets,
  getHospital,
  updateTicketStatus,
  rescheduleTicket,
  queuePosition,
} from '../services';

interface LiveQueueDashboardProps {
  ticketId: string;
  onBackToHome: () => void;
}

export default function LiveQueueDashboard({ ticketId, onBackToHome }: LiveQueueDashboardProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [queue, setQueue] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(true);

  // Real-time subscription to this specific ticket.
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeTicket(
      ticketId,
      (data) => {
        setTicket(data);
        if (!data) setError('Could not retrieve queue ticket details.');
        else setError('');
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Connection to clinic server lost.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [ticketId]);

  // Once we know the hospital, subscribe to its live queue + load its details.
  useEffect(() => {
    if (!ticket?.hospitalId) return;
    getHospital(ticket.hospitalId).then(setHospital).catch(() => undefined);
    const unsub = subscribeHospitalTickets(ticket.hospitalId, setQueue);
    return () => unsub();
  }, [ticket?.hospitalId]);

  const handleCancelVisit = async () => {
    if (!window.confirm('Are you sure you want to cancel your visit and release your queue token?')) return;
    try {
      await updateTicketStatus(ticketId, 'Cancelled');
      alert('Your clinic visit has been cancelled.');
      onBackToHome();
    } catch (err) {
      console.error(err);
      alert('Failed to cancel. Please contact the front desk.');
    }
  };

  const handleReschedule = async () => {
    try {
      await rescheduleTicket(ticketId);
      alert('Appointment rescheduled. Your position has been updated in our queue.');
    } catch (err) {
      console.error(err);
      alert('Could not reschedule right now. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium text-xs">Retrieving your synchronized live queue ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-md space-y-4">
          <AlertCircle size={40} className="text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Live Ticket Expired or Invalid</h2>
          <p className="text-xs text-slate-500">This live ticket is no longer active in the current queue block.</p>
          <button onClick={onBackToHome} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-xs hover:bg-blue-700 cursor-pointer transition-colors">
            Return to Landing
          </button>
        </div>
      </div>
    );
  }

  // Real queue math derived from live Firestore data.
  const patientsBefore =
    ticket.status === 'Called' || ticket.status === 'Completed'
      ? 0
      : queuePosition(ticket, queue);
  const avgConsult = 12; // minutes per patient
  const estimatedWait =
    ticket.status === 'Called'
      ? 'Currently In Service'
      : ticket.status === 'Completed'
        ? 'Consultation Complete'
        : `${Math.max(1, patientsBefore * avgConsult)} mins`;
  const progressPercent =
    ticket.status === 'Completed'
      ? 100
      : ticket.status === 'Called'
        ? 95
        : patientsBefore === 0
          ? 80
          : Math.max(10, 70 - patientsBefore * 10);

  const activeDocs = ticket.documents ?? [];

  // The token currently being served (first Called/Urgent ticket in queue).
  const nowServing =
    queue.find((t) => t.status === 'Called')?.token ||
    queue.find((t) => t.status === 'Urgent')?.token ||
    ticket.token;

  return (
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen flex flex-col pb-20 md:pb-0">
      {/* TopAppBar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={onBackToHome} className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer" title="Back">
              <ArrowLeft size={16} />
            </button>
            <span className="font-bold text-xl text-blue-600">Hospira</span>
            <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-3 py-0.5 rounded-md font-bold uppercase tracking-wider">Live Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase">Emergency</span>
            <div className="flex gap-2">
              <Bell size={18} className="text-slate-500 cursor-pointer" />
              <User size={18} className="text-slate-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Live Warning / Delay Alerts Banner */}
        {showNotification && ticket.status !== 'Completed' && (
          <div className="flex items-center gap-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
            <AlertCircle className="shrink-0 text-red-500" size={18} />
            <div className="flex-1 text-xs font-semibold">
              Emergency Note: Doctor is running 5 mins late due to an urgent critical consultation. We appreciate your patience.
            </div>
            <button onClick={() => setShowNotification(false)} className="text-red-700 hover:opacity-70 font-bold text-lg select-none cursor-pointer">×</button>
          </div>
        )}

        {/* Hero: Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Main Live Queue Tracker Card */}
          <section className="lg:col-span-8 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">Live Queue Status</h1>
                <p className="text-xs text-slate-500">Department: {ticket.department}</p>
              </div>
              <div className="bg-blue-600 text-white px-5 py-3.5 rounded-lg text-center shadow-sm">
                <span className="block text-[9px] uppercase tracking-wider font-bold opacity-80">Your Token</span>
                <span className="text-2xl font-black">{ticket.token}</span>
              </div>
            </div>

            {/* Live Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Play size={16} className="text-blue-600 mx-auto mb-1.5 fill-blue-600" />
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Current Running</p>
                <p className="text-lg font-bold text-blue-600">{nowServing}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Users size={16} className="text-slate-500 mx-auto mb-1.5" />
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Patients Before You</p>
                <p className="text-lg font-bold text-slate-800">{patientsBefore}</p>
              </div>
              <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                <Clock size={16} className="text-green-600 mx-auto mb-1.5" />
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Est. Wait Time</p>
                <p className="text-lg font-bold text-green-700">{estimatedWait}</p>
              </div>
            </div>

            {/* Waiting Progression Line */}
            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Triage Registered</span>
                <span>Estimate Appointment: {new Date(new Date(ticket.joinedAt).getTime() + 25 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-1">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>In Consultation</span>
                  </div>
                </div>
                <span className="text-blue-600 animate-pulse font-semibold">
                  {ticket.status === 'Called' ? 'The doctor is ready for you!' : 'You are almost there!'}
                </span>
              </div>
            </div>
          </section>

          {/* Side Column: QR Check-in & Immediate Actions */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200 flex flex-col items-center justify-center space-y-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Check-in QR</h3>
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <QrCode size={100} className="text-blue-600" />
              </div>
              <p className="text-[10px] text-slate-400 max-w-[220px] leading-relaxed">
                Show token <span className="font-bold text-slate-600">{ticket.token}</span> to the clinic receptionist or scan at the kiosk upon arrival.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleReschedule}
                className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                Reschedule Appointment
              </button>
              <button
                onClick={handleCancelVisit}
                className="w-full py-3 bg-red-50 hover:bg-red-100/50 border border-red-100 text-red-600 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle size={14} /> Cancel Clinic Visit
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">

          {/* Hospital Location Mapping */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <MapPin size={20} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">{ticket.hospitalName}</h2>
            </div>
            <p className="text-xs text-slate-500 pl-1 leading-relaxed">
              {hospital?.address || 'Address on file with clinic reception.'}
            </p>

            <div className="w-full h-40 rounded-lg overflow-hidden relative border border-slate-200 bg-slate-100">
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url('${hospital?.image || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUIqPINlLjDNZQ29FlNXDgIhoheWKk9ll8K7NsJPeCmKHQLUHOvr280DEWFjBKGNx3F0mR1pl-LxaUQ4v4PL8ZaeFKa0DRKKMeFtXlpcFeFMp3_YBDmhWA6Jw9C2-g4yI8kvIiweNEZIaDulgP2gxExmlFXO99Qhf3k4PvJb0YCxVEFJuuGaOXDaWzpUCUwdphFPP4N6sCdwyEF7ezYZnDaDvbPEoJpUm93ODgyfjN8MvSXPW1-In82ZfPMsoubOxLuIZ4_68FRpI'}')` }}
              />
              <div className="absolute inset-0 bg-black/5"></div>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-3 bg-blue-600 text-white px-4 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1 shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Navigation size={10} /> Open in Maps
              </a>
            </div>

            <div className="flex gap-4 pt-2">
              <a href="tel:+1-800-467-7472" className="flex-1 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm border border-blue-100 hover:bg-blue-100/50 transition-colors">
                <Phone size={12} /> Call Front Desk
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Share link copied to clipboard!'); }}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 transition-colors cursor-pointer"
                title="Share track page link"
              >
                <Share2 size={14} />
              </button>
            </div>
          </section>

          {/* Diagnostic Records / Uploads module (real, from Storage) */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">Active Visit Records</h2>
              </div>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-md font-bold">{activeDocs.length} Attached</span>
            </div>

            {activeDocs.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {activeDocs.map((docItem) => (
                  <a
                    key={docItem.storagePath}
                    href={docItem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer block"
                  >
                    <div className="w-full h-20 flex items-center justify-center bg-slate-100 text-slate-400">
                      <FileText size={28} />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                      <span className="bg-white text-blue-600 p-1.5 rounded-full" title="Download"><Download size={12} /></span>
                    </div>
                    <div className="p-2.5 bg-white">
                      <p className="text-xs font-bold truncate text-slate-800">{docItem.name}</p>
                      <p className="text-[9px] text-slate-400">{docItem.type} • {docItem.size}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                No documents were attached to this visit.
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-[10px] text-slate-400">
              Use the registration screen to append secondary health files.
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 py-2 flex justify-around items-center z-50 shadow-lg">
        <button className="flex flex-col items-center gap-0.5 text-blue-600 cursor-pointer" onClick={() => alert('Viewing Live Queue Tracker')}>
          <Play size={16} className="fill-blue-600" />
          <span className="text-[9px] font-bold uppercase">Status</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-slate-500 cursor-pointer" onClick={() => alert('Diagnostic details listed above')}>
          <FileText size={16} />
          <span className="text-[9px] font-medium uppercase">Records</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-slate-500 cursor-pointer" onClick={onBackToHome}>
          <XCircle size={16} />
          <span className="text-[9px] font-medium uppercase">Exit</span>
        </button>
      </nav>
    </div>
  );
}
