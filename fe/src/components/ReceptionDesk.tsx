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
  RefreshCw,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Ticket, TicketSeverity, Hospital } from '../types';

interface ReceptionDeskProps {
  onBackToHome: () => void;
  onSelectTicket: (ticketId: string) => void;
  hospitals: Hospital[];
  onRefreshHospitals: () => void;
}

export default function ReceptionDesk({ 
  onBackToHome, 
  onSelectTicket,
  hospitals,
  onRefreshHospitals
}: ReceptionDeskProps) {
  // Session state from localStorage to preserve receptionist sign-in
  const [receptionist, setReceptionist] = useState<{
    id: string;
    name: string;
    username: string;
    hospitalId: string;
    hospitalName: string;
  } | null>(() => {
    const saved = localStorage.getItem('hospira_receptionist_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'login' | 'onboard'>('login');
  
  // Dashboard Core State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState({ todayTotal: 128, onlineBookings: 84, walkins: 44, avgWaitTime: 18 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Onboard Hospital & Staff Form State
  const [hospName, setHospName] = useState('');
  const [hospAddress, setHospAddress] = useState('');
  const [hospFee, setHospFee] = useState('35');
  const [hospDocs, setHospDocs] = useState('5');
  const [hospBadge, setHospBadge] = useState('Urgent Care Open');
  const [hospDesc, setHospDesc] = useState('');
  const [selectedImage, setSelectedImage] = useState('https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600');
  
  // Onboard Receptionist Form State
  const [staffName, setStaffName] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingSuccess, setOnboardingSuccess] = useState('');
  const [onboarding, setOnboarding] = useState(false);

  // Quick Registration Form State (Walk-ins)
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinReason, setWalkinReason] = useState('General Consultation');
  const [walkinDept, setWalkinDept] = useState('General');
  const [isUrgent, setIsUrgent] = useState(false);
  const [registering, setRegistering] = useState(false);

  // 4 Stock hospital images for the onboarding form
  const hospitalBanners = [
    {
      name: 'Modern Glass Plaza',
      url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&q=80&w=600',
    },
    {
      name: 'Tech Specialty Wing',
      url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=600',
    },
    {
      name: 'Children\'s Care Center',
      url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=600',
    },
    {
      name: 'Wellness Clinic Interior',
      url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=600',
    }
  ];

  // Fetch all tickets and live stats from the Express API scoped by hospitalId
  const refreshDashboardData = async () => {
    if (!receptionist) return;
    try {
      const urlParams = `?hospitalId=${receptionist.hospitalId}`;
      const ticketsRes = await fetch(`/api/tickets${urlParams}`);
      const statsRes = await fetch(`/api/stats${urlParams}`);
      
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

  // Poll database for updates only when receptionist is signed in
  useEffect(() => {
    if (receptionist) {
      setLoading(true);
      refreshDashboardData();
      const interval = setInterval(refreshDashboardData, 5000); 
      return () => clearInterval(interval);
    }
  }, [receptionist]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both username and password.');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/receptionists/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setReceptionist(data);
        localStorage.setItem('hospira_receptionist_session', JSON.stringify(data));
      } else {
        const errData = await res.json();
        setLoginError(errData.error || 'Invalid credentials.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Could not connect to authentication server.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('hospira_receptionist_session');
    setReceptionist(null);
    setTickets([]);
  };

  // Onboard Hospital & Receptionist Staff handler
  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError('');
    setOnboardingSuccess('');

    if (!hospName.trim() || !hospAddress.trim()) {
      setOnboardingError('Please enter the hospital name and address.');
      return;
    }
    if (!staffName.trim() || !staffUsername.trim() || !staffPassword.trim()) {
      setOnboardingError('Please enter receptionist staff name, username, and password.');
      return;
    }

    setOnboarding(true);
    try {
      // 1. Onboard the Hospital
      const hospRes = await fetch('/api/hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: hospName,
          address: hospAddress,
          description: hospDesc,
          consultationFee: Number(hospFee),
          availableDocs: Number(hospDocs),
          image: selectedImage,
          badge: hospBadge
        })
      });

      if (!hospRes.ok) {
        const errData = await hospRes.json();
        throw new Error(errData.error || 'Failed to onboard hospital.');
      }

      const createdHospital = await hospRes.json();

      // 2. Onboard the Receptionist account
      const recepRes = await fetch('/api/receptionists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          username: staffUsername,
          password: staffPassword,
          hospitalId: createdHospital.id
        })
      });

      if (!recepRes.ok) {
        const errData = await recepRes.json();
        throw new Error(errData.error || 'Hospital registered, but staff account creation failed.');
      }

      const createdRecep = await recepRes.json();

      // Refresh list of hospitals globally so patients can join it
      onRefreshHospitals();

      setOnboardingSuccess('Hospital and receptionist onboarded successfully!');
      
      // Auto-login the newly onboarded receptionist
      const session = {
        id: createdRecep.id,
        name: createdRecep.name,
        username: createdRecep.username,
        hospitalId: createdRecep.hospitalId,
        hospitalName: createdHospital.name
      };
      
      setTimeout(() => {
        setReceptionist(session);
        localStorage.setItem('hospira_receptionist_session', JSON.stringify(session));
        // Reset forms
        setHospName('');
        setHospAddress('');
        setHospDesc('');
        setStaffName('');
        setStaffUsername('');
        setStaffPassword('');
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setOnboardingError(err.message || 'Error occurred during hospital onboarding.');
    } finally {
      setOnboarding(false);
    }
  };

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

  // Quick Register Walk-in Patient specifically bound to logged-in receptionist's hospital
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkinName.trim() || !walkinPhone.trim() || !receptionist) {
      alert('Please fill out the patient name and phone number.');
      return;
    }

    setRegistering(true);
    try {
      const payload = {
        fullName: walkinName,
        phone: walkinPhone,
        age: 35, 
        gender: 'Not Specified',
        symptoms: walkinReason,
        severity: (isUrgent ? 'Critical' : 'Mild') as TicketSeverity,
        type: 'Walk-in',
        reason: isUrgent ? 'Emergency / Urgent Care' : walkinReason,
        department: walkinDept,
        hospitalId: receptionist.hospitalId,
        hospitalName: receptionist.hospitalName
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

  // Reset and reseed tickets
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

  /* Render LOGIN / ONBOARD PORTAL if no receptionist session is active */
  if (!receptionist) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-4xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Left branding panel */}
          <div className="md:w-5/12 bg-slate-900 text-white p-8 flex flex-col justify-between relative overflow-hidden shrink-0">
            <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 space-y-6">
              <span className="text-2xl font-bold tracking-tight text-blue-500 cursor-pointer" onClick={onBackToHome}>
                Hospira
              </span>
              <div className="space-y-3">
                <h2 className="text-xl font-bold leading-tight">Partner & Staff Portal</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Join our medical triage network. Onboard your clinic in seconds, create receptionist stations, and empower patients to wait comfortably from anywhere.
                </p>
              </div>
            </div>

            <div className="relative z-10 space-y-4 pt-8 border-t border-slate-800">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Check size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Zero-Delay Onboarding</p>
                  <p className="text-[10px] text-slate-400">Instantly register clinic branches in our patient network.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Check size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Dynamic Triage Queue</p>
                  <p className="text-[10px] text-slate-400">Receptionist dashboards filtered specifically for your facility.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Check size={12} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Pre-seeded Credentials</p>
                  <p className="text-[10px] text-slate-400 font-semibold text-blue-400">Username: jane / Password: 123 (St. Jude)</p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-800 text-[11px] font-semibold text-slate-400">
              <button onClick={onBackToHome} className="text-blue-400 hover:underline cursor-pointer">← Back to Patient Portal</button>
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 p-8 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Tabs Switcher */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 pb-3 text-center text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === 'login' 
                      ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Receptionist Sign In
                </button>
                <button
                  onClick={() => setActiveTab('onboard')}
                  className={`flex-1 pb-3 text-center text-xs font-bold transition-all relative cursor-pointer ${
                    activeTab === 'onboard' 
                      ? 'text-blue-600 border-b-2 border-blue-600 font-extrabold' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Onboard Hospital & Staff
                </button>
              </div>

              {activeTab === 'login' ? (
                /* Staff Login Form */
                <form onSubmit={handleLogin} className="space-y-4 pt-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Staff Authentication</h3>
                    <p className="text-xs text-slate-400">Access your hospital's active virtual queue control desk.</p>
                  </div>

                  {loginError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Staff Username</label>
                    <input
                      type="text"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="e.g. jane"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Access Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="e.g. 123"
                      className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loggingIn ? 'Authenticating...' : 'Sign In as Staff'}
                  </button>

                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mt-4">
                    <p className="text-[11px] font-bold text-blue-800 mb-1.5 flex items-center gap-1.5">
                      💡 Sandbox Quick-Login Credentials:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-blue-700">
                      <div>
                        <span className="font-bold">St. Jude:</span>
                        <div className="mt-0.5">User: <code className="bg-blue-100/80 px-1 py-0.5 rounded">jane</code></div>
                        <div>Pass: <code className="bg-blue-100/80 px-1 py-0.5 rounded">123</code></div>
                      </div>
                      <div>
                        <span className="font-bold">Heritage Health:</span>
                        <div className="mt-0.5">User: <code className="bg-blue-100/80 px-1 py-0.5 rounded">alice</code></div>
                        <div>Pass: <code className="bg-blue-100/80 px-1 py-0.5 rounded">123</code></div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                /* Hospital Onboarding Form */
                <form onSubmit={handleOnboard} className="space-y-4 pt-1 overflow-y-auto max-h-[460px] pr-1">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Onboard Your Medical Facility</h3>
                    <p className="text-xs text-slate-400">Register your hospital branch and set up your receptionist login details.</p>
                  </div>

                  {onboardingError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg p-3 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{onboardingError}</span>
                    </div>
                  )}

                  {onboardingSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg p-3 flex items-center gap-2">
                      <Check size={14} className="shrink-0 text-green-600" />
                      <span>{onboardingSuccess}</span>
                    </div>
                  )}

                  {/* Section 1: Hospital Details */}
                  <div className="space-y-3 border-b border-slate-100 pb-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Step 1: Hospital Details</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Hospital Name *</label>
                      <input
                        type="text"
                        value={hospName}
                        onChange={(e) => setHospName(e.target.value)}
                        placeholder="e.g. Grace Memorial Hospital"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Address Location *</label>
                      <input
                        type="text"
                        value={hospAddress}
                        onChange={(e) => setHospAddress(e.target.value)}
                        placeholder="e.g. 402 Medical Row, Sector 4"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Consultation Fee ($) *</label>
                        <input
                          type="number"
                          value={hospFee}
                          onChange={(e) => setHospFee(e.target.value)}
                          placeholder="e.g. 35"
                          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Available Doctors *</label>
                        <input
                          type="number"
                          value={hospDocs}
                          onChange={(e) => setHospDocs(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Specialty Badge</label>
                        <input
                          type="text"
                          value={hospBadge}
                          onChange={(e) => setHospBadge(e.target.value)}
                          placeholder="e.g. Urgent Care Open, Orthopedic Clinic"
                          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                        <input
                          type="text"
                          value={hospDesc}
                          onChange={(e) => setHospDesc(e.target.value)}
                          placeholder="e.g. Specialized pediatric and emergency unit"
                          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                        />
                      </div>
                    </div>

                    {/* Banner Image Selection */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Select Hospital Banner Image</label>
                      <div className="grid grid-cols-2 gap-2">
                        {hospitalBanners.map((banner, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedImage(banner.url)}
                            className={`p-1.5 border rounded-lg text-left text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                              selectedImage === banner.url 
                                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <img src={banner.url} className="w-8 h-8 rounded object-cover" alt="" />
                            <span className="line-clamp-1">{banner.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Receptionist Account */}
                  <div className="space-y-3 pt-1">
                    <h4 className="text-[10px] uppercase font-bold tracking-wider text-blue-600">Step 2: Create Primary Receptionist Account</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Staff Full Name *</label>
                      <input
                        type="text"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g. Sarah Connor"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Username *</label>
                        <input
                          type="text"
                          value={staffUsername}
                          onChange={(e) => setStaffUsername(e.target.value)}
                          placeholder="e.g. sarah"
                          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password *</label>
                        <input
                          type="password"
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                          placeholder="e.g. 123"
                          className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-slate-50 text-slate-800"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={onboarding}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    {onboarding ? 'Onboarding Hospital & Staff...' : 'Onboard Hospital & Staff Account'}
                  </button>
                </form>
              )}
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-6">
              Empowering clinics everywhere. Hospira Cloud Queue Engine © 2026.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* Render main dashboard if logged in */
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
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {receptionist.name ? receptionist.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'ST'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-800 truncate" title={receptionist.name}>{receptionist.name}</p>
              <p className="text-[9px] text-slate-400 truncate" title={receptionist.hospitalName}>{receptionist.hospitalName}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-xs font-semibold text-slate-500 cursor-pointer"
          >
            <LogOut size={12} /> Log Out Receptionist
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
                  <p className="text-xs text-slate-400 mt-0.5">Real-time walk-in and remote triage register for <span className="font-semibold text-blue-600">{receptionist.hospitalName}</span></p>
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
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs space-x-1 flex justify-end items-center">
                          {t.status !== 'Completed' && t.status !== 'Cancelled' && (
                            <>
                              {t.status !== 'Called' && (
                                <button 
                                  onClick={() => updateTicketStatus(t.id, 'Called')}
                                  className="bg-blue-600 text-white px-3 py-1 rounded-md font-semibold text-xs hover:bg-blue-700 transition-all shadow-sm cursor-pointer whitespace-nowrap shrink-0"
                                >
                                  Call
                                </button>
                              )}
                              <button 
                                onClick={() => updateTicketStatus(t.id, 'Completed')}
                                className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-md font-semibold text-xs hover:bg-green-100/50 transition-all cursor-pointer whitespace-nowrap shrink-0"
                              >
                                Done
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => updateTicketStatus(t.id, 'Cancelled')}
                            className="bg-slate-50 text-red-600 p-1.5 rounded-md border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer inline-flex items-center shrink-0 ml-1"
                            title="Cancel Ticket"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTickets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs font-medium">
                          No active patient tickets in the queue for your hospital right now.
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
              <p className="text-xs text-slate-400 font-medium">Register a walk-in patient directly to your virtual queue.</p>
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
                  required
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
                  required
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
                          ? 'bg-blue-50 text-blue-600 border-blue-200 font-extrabold' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {dept.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-red-600 border-slate-200 rounded focus:ring-red-500 cursor-pointer shrink-0"
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
              <div className="overflow-hidden max-w-[60%]">
                <p className="text-xs font-bold text-slate-800 truncate" title={receptionist.name}>{receptionist.name}</p>
                <p className="text-[10px] text-slate-400 truncate" title={receptionist.hospitalName}>{receptionist.hospitalName}</p>
              </div>
              <span className="bg-green-50 text-green-700 border border-green-100 rounded-md px-2.5 py-0.5 text-[9px] font-bold uppercase whitespace-nowrap shrink-0">Station Active</span>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
