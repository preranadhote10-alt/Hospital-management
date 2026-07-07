import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  User, 
  LayoutDashboard, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Clock, 
  Check, 
  PhoneCall, 
  ChevronRight, 
  Trash2, 
  RefreshCw,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Ticket, TicketSeverity } from '../types';

interface ReceptionDeskProps {
  onBackToHome: () => void;
  onSelectTicket: (ticketId: string) => void;
}

export default function ReceptionDesk({ onBackToHome, onSelectTicket }: ReceptionDeskProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({ todayTotal: 128, onlineBookings: 84, walkins: 44, avgWaitTime: 18 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Registration Form State (Walk-ins)
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinReason, setWalkinReason] = useState('General Consultation');
  const [walkinDept, setWalkinDept] = useState('General');
  const [isUrgent, setIsUrgent] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Fetch all tickets and live stats from the Express API
  const refreshDashboardData = async () => {
    try {
      const ticketsRes = await fetch('/api/tickets');
      const statsRes = await fetch('/api/stats');
      
      if (ticketsRes.ok && statsRes.ok) {
        const ticketsData = await ticketsRes.json();
        const statsData = await statsRes.json();
        setTickets(ticketsData);
        setStats(statsData);
        setError('');
      } else {
        setError('Error synchronizing receptionist database.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to Express backend lost.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshDashboardData();
    const interval = setInterval(refreshDashboardData, 5000); // Poll every 5 seconds for updates
    return () => clearInterval(interval);
  }, []);

  // Update a Ticket's Status (e.g. Call, Complete, Cancel)
  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        await refreshDashboardData();
      } else {
        alert('Could not update patient status.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status.');
    }
  };

  // Quick Register Walk-in Patient
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinPhone.trim()) {
      alert('Please fill out the patient name and phone number.');
      return;
    }

    setRegistering(true);
    try {
      const payload = {
        fullName: walkinName,
        phone: walkinPhone,
        age: 35, // default
        gender: 'Not Specified',
        symptoms: walkinReason,
        severity: (isUrgent ? 'Critical' : 'Mild') as TicketSeverity,
        type: 'Walk-in',
        reason: isUrgent ? 'Emergency / Urgent Care' : walkinReason,
        department: walkinDept,
        hospitalId: 'st-jude', // default to St. Jude for mock station
        hospitalName: 'St. Jude Medical Center'
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setWalkinName('');
        setWalkinPhone('');
        setIsUrgent(false);
        setWalkinReason('General Consultation');
        await refreshDashboardData();
        alert('Walk-in patient added to active queue successfully.');
      } else {
        alert('Could not register walk-in patient.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error registering walk-in.');
    } finally {
      setRegistering(false);
    }
  };

  // Reset and reseed tickets (convenient debug action)
  const handleResetQueue = async () => {
    if (!window.confirm('Do you want to reset the patient queue back to original mock states?')) return;
    try {
      const response = await fetch('/api/tickets/reset', { method: 'POST' });
      if (response.ok) {
        await refreshDashboardData();
        alert('Queue database reset and re-seeded successfully.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tickets by search query
  const filteredTickets = tickets.filter(t => 
    t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row">
      
      {/* Side Navigation Panel */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-100">
            <span className="text-xl font-bold text-blue-600 tracking-tight cursor-pointer" onClick={onBackToHome}>
              Hospira
            </span>
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mt-1">RECEPTION DESK</p>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            {[
              { label: 'Live Queue', icon: <LayoutDashboard size={14} />, active: true },
              { label: 'Patient Records', icon: <Users size={14} /> },
              { label: 'Staff Scheduling', icon: <Calendar size={14} /> },
              { label: 'Analytics Insights', icon: <BarChart3 size={14} /> },
              { label: 'Configuration', icon: <Settings size={14} /> },
              { label: 'Help Center', icon: <HelpCircle size={14} /> },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => { if (!item.active) alert(`${item.label} view is mock-only. Use the Live Queue view.`) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  item.active 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User logout section */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              RA
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Receptionist_A1</p>
              <p className="text-[9px] text-slate-400">Station 01-A</p>
            </div>
          </div>
          <button 
            onClick={onBackToHome}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-xs font-semibold text-slate-500 cursor-pointer"
          >
            <LogOut size={12} /> Exit to Portal
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-40">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 text-slate-400" size={14} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 bg-slate-50 text-slate-800"
              placeholder="Search patients, tokens, or departments..."
            />
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button 
              onClick={handleResetQueue} 
              className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset Database to Default Seed"
            >
              <RefreshCw size={10} /> Seed Defaults
            </button>
            <span className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">Emergency</span>
            <div className="flex gap-2">
              <Bell size={16} className="text-slate-500 cursor-pointer" />
              <User size={16} className="text-slate-500 cursor-pointer" />
            </div>
          </div>
        </header>

        {/* Inner Content Grid */}
        <div className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Dashboard Section */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* KPI Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Today's Patients", value: stats.todayTotal, icon: <Users size={14} />, color: "text-blue-600" },
                { label: "Online Bookings", value: stats.onlineBookings, icon: <LayoutDashboard size={14} />, color: "text-slate-500" },
                { label: "Walk-ins", value: stats.walkins, icon: <Plus size={14} />, color: "text-purple-600" },
                { label: "Avg Wait Time", value: `${stats.avgWaitTime} min`, icon: <Clock size={14} />, color: "text-green-600" }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between h-24">
                  <div className="flex justify-between items-start text-slate-400">
                    <span className="text-[10px] uppercase font-bold tracking-wider leading-none">{stat.label}</span>
                    <span className={`${stat.color}`}>{stat.icon}</span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Live Queue Tables list */}
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Active Patient Queue</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time walk-in and remote triage register</p>
                </div>
                <button onClick={refreshDashboardData} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                  <RefreshCw size={12} /> Sync Database
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Token #</th>
                      <th className="px-6 py-4">Patient Name</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Triage Status</th>
                      <th className="px-6 py-4">Joined Time</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {t.token}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-bold text-xs text-slate-800 hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onSelectTicket(t.id)}>
                            {t.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400">{t.phone}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                          {t.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                            t.status === 'Urgent' 
                              ? 'bg-red-50 text-red-600 border-red-100' 
                              : t.status === 'Called' 
                                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                : t.status === 'Completed'
                                  ? 'bg-green-50 text-green-700 border-green-100'
                                  : 'bg-slate-50 text-slate-500 border-slate-100'
                          }`}>
                            {t.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                          {new Date(t.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs space-x-1">
                          {t.status !== 'Completed' && t.status !== 'Cancelled' && (
                            <>
                              {t.status !== 'Called' && (
                                <button 
                                  onClick={() => updateTicketStatus(t.id, 'Called')}
                                  className="bg-blue-600 text-white px-3 py-1 rounded-md font-semibold text-xs hover:bg-blue-700 transition-all shadow-sm cursor-pointer"
                                >
                                  Call
                                </button>
                              )}
                              <button 
                                onClick={() => updateTicketStatus(t.id, 'Completed')}
                                className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-md font-semibold text-xs hover:bg-green-100/50 transition-all cursor-pointer"
                              >
                                Done
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => updateTicketStatus(t.id, 'Cancelled')}
                            className="bg-slate-50 text-red-600 p-1.5 rounded-md border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer inline-flex items-center"
                            title="Cancel Ticket"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                          No patient tickets matching the current queue slice.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Sidebar Quick Registration Form */}
          <aside className="lg:col-span-4 bg-white rounded-lg border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Quick Registration</h3>
              <p className="text-xs text-slate-400">Register a walk-in patient immediately to the virtual queue.</p>
            </div>

            <form onSubmit={handleQuickRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Patient Full Name *</label>
                <input 
                  type="text" 
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Elena Martinez"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone Number *</label>
                <input 
                  type="tel" 
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="+1 (555) 019-3829"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Appointment Reason</label>
                <input 
                  type="text" 
                  value={walkinReason}
                  onChange={(e) => setWalkinReason(e.target.value)}
                  placeholder="Chest pain, Consultation, Orthopedics..."
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Department Section</label>
                <div className="grid grid-cols-2 gap-2">
                  {['General', 'Cardiology', 'Pediatrics', 'Dermatology'].map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setWalkinDept(dept)}
                      className={`py-1.5 px-2.5 border rounded-lg text-[9px] font-bold transition-colors cursor-pointer ${
                        walkinDept === dept 
                          ? 'bg-blue-50 text-blue-600 border-blue-200' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {dept.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-slate-200 rounded focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle size={12} /> Urgent Priority Triage
                </span>
              </label>

              <button 
                type="submit"
                disabled={registering}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Plus size={14} /> {registering ? 'Adding...' : 'Add Walk-in Patient'}
              </button>
            </form>

            {/* Active Station Card footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Jane Foster</p>
                <p className="text-[10px] text-slate-400">Registrations Lead</p>
              </div>
              <span className="bg-green-50 text-green-700 border border-green-100 rounded-md px-2.5 py-0.5 text-[9px] font-bold uppercase">Station 01-A</span>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
