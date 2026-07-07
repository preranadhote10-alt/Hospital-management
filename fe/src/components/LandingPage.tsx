import React, { useState } from 'react';
import { 
  Heart, 
  Stethoscope, 
  MapPin, 
  Star, 
  Clock, 
  ChevronRight, 
  ArrowRight, 
  Activity, 
  Baby, 
  Brain, 
  Sparkles, 
  Eye, 
  ShieldAlert, 
  Bell, 
  User,
  Search,
  Phone
} from 'lucide-react';
import { Hospital } from '../types';

interface LandingPageProps {
  hospitals: Hospital[];
  onJoinQueue: (hospital: Hospital) => void;
  onNavigateToStaff: () => void;
  onNavigateToStatus: (ticketId: string) => void;
}

export default function LandingPage({ 
  hospitals, 
  onJoinQueue, 
  onNavigateToStaff,
  onNavigateToStatus
}: LandingPageProps) {
  const [specialtySearch, setSpecialtySearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  // Handle specialty card clicks to auto-fill search
  const selectSpecialty = (name: string) => {
    setSpecialtySearch(name);
  };

  const filteredHospitals = hospitals.filter(h => {
    const matchesSpec = h.description.toLowerCase().includes(specialtySearch.toLowerCase()) || 
                        h.name.toLowerCase().includes(specialtySearch.toLowerCase());
    const matchesLoc = h.address.toLowerCase().includes(locationSearch.toLowerCase());
    return matchesSpec && matchesLoc;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* TopAppBar */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="flex justify-between items-center w-full px-8 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            <span className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer" onClick={() => window.location.reload()}>
              Hospira
            </span>
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#" className="text-xs font-semibold text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</a>
              <button onClick={onNavigateToStaff} className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer">Reception Desk</button>
              <a href="#specialties" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">Specialties</a>
              <a href="#hospitals" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">Hospitals Near You</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+1-800-467-7472" className="hidden md:flex bg-red-600 text-white px-5 py-1.5 rounded-lg font-semibold text-xs hover:bg-red-700 transition-all shadow-sm cursor-pointer">
              Emergency
            </a>
            <div className="flex items-center gap-2">
              <button onClick={onNavigateToStaff} className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative cursor-pointer" title="Staff Portal">
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              </button>
              <button onClick={onNavigateToStaff} className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors cursor-pointer" title="Staff Portal">
                <User size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-slate-50 border-b border-slate-100 pt-16 pb-24 px-8 overflow-hidden relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6">
            <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-md text-xs font-semibold tracking-wide">
              Verified Healthcare Network
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Join the queue <br />from your couch.
            </h1>
            <p className="text-base text-slate-600 max-w-xl">
              Hospira connects you directly with the best medical facilities. See live wait times, book remotely, and only arrive when the doctor is ready for you.
            </p>

            {/* Search Bar Widget */}
            <div className="bg-white p-2.5 rounded-xl shadow-md border border-slate-200 flex flex-col md:flex-row gap-2 max-w-2xl">
              <div className="flex-1 flex items-center gap-2 px-3 border-b md:border-b-0 md:border-r border-slate-200 py-2">
                <Stethoscope className="text-blue-500" size={18} />
                <input 
                  type="text" 
                  value={specialtySearch}
                  onChange={(e) => setSpecialtySearch(e.target.value)}
                  className="w-full border-none focus:outline-none bg-transparent text-sm placeholder-slate-400 text-slate-800"
                  placeholder="Specialty (e.g. Cardiology, Pediatrics)"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 py-2">
                <MapPin className="text-blue-500" size={18} />
                <input 
                  type="text" 
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  className="w-full border-none focus:outline-none bg-transparent text-sm placeholder-slate-400 text-slate-800"
                  placeholder="Hospital or City Location"
                />
              </div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-xs hover:bg-blue-700 transition-colors shadow-sm cursor-pointer">
                Search
              </button>
            </div>

            {/* Micro proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCikDq0rsQCmdsakJRCBbhTF2QT_XXeL6iNJ2Pf9OG2eBPfY2dbjXiEO8qDF05KcmDS78hJf0o8kTs2k2IjiwqFVhUtf75jezWNks8ylYLe9r-2QBgk1MdAI0HTDllxC0VHZylVlBqRlsf-QhHV6GWnO8eV6_sQpTRruwWjNGBMPHwVB6nqLwnpe1GaOHIy1cfdZxXthCH31BkuVScyBwf1GDbqfAnn4QsKeZtPESKxRLItuLe9otf7vcq4uyy6tlZjTVuKaCsSrn4" alt="Doctor 1" />
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAukeKTcq93E5nZa2nazLCx_HjHcVA7kfePaay7UGXaObDV4-fGOjSFx4VDnEU6K8KFQtYGB29IpUtGaV7oa0V_3Mp8Hq3fwePUr_Dx7TNI-UEJ6V-BeK38p0dZ24o0rhc8LvEPOgfpBeUZ5UNrFC16ZVwtXVP_uhX3gMD9zNH81S2QipSucrbtxmySSe-1m7htlDi1eVkD7qoxc0td4VUQMjY9V-YXRexbiQOIJbIW3UeZ3AMiSPFm51u8T-KrLyvvyVxN1EB9xo4" alt="Pediatrician 2" />
                <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-[10px] shadow-sm">5k+</div>
              </div>
              <p className="text-xs text-slate-500 font-medium">Trusted by 5,000+ medical professionals daily</p>
            </div>
          </div>

          {/* Right column (Bento Card) */}
          <div className="hidden lg:block relative">
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="relative bg-white p-3 rounded-2xl shadow-md border border-slate-200">
              <img 
                className="rounded-xl w-full h-[360px] object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuApsI6LAd-DOe6hiq_DLG1JrlZXNgwC_DOfo03ISPSoGghZ2NYUS8sS_dM7uzv9ZQCZdMny8iyWsY4Y9GWlu27MydrMaOOGz8ZGCKAukmqhKjyG4ZkDshuZCDeLvaPSAkcPWxx8x6kH6rWUDRfMdM1q4zRxd1ImG-xZ4vodTXi1Dd3fsBx_WWsWUR_KwbMY71HYnzoElDQXhRyk2DJZk9aX2QSjcYeMd7aL8piaCiJc3a-4sOHj-W0lI2QPEU0iFkuppK1LvEvX0jI" 
                alt="City General Hospital Lobby" 
              />
              <div className="absolute bottom-6 right-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">City General Hospital</h4>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1">
                    <Star size={13} className="fill-amber-400 text-amber-400" /> 4.8 Rating • 1.2 miles away
                  </p>
                </div>
                <div className="bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-lg text-center">
                  <p className="text-[9px] uppercase font-bold tracking-wider opacity-90 leading-none">Wait Time</p>
                  <p className="text-lg font-black mt-1 leading-none">12m</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section id="specialties" className="py-20 px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Explore Specialties</h2>
              <p className="text-slate-500 mt-1 text-sm">Quick access to specialized healthcare providers</p>
            </div>
            <button className="text-blue-600 font-semibold text-xs flex items-center gap-1 hover:text-blue-700 transition-colors cursor-pointer">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {/* Specialty Cards */}
            {[
              { name: 'Cardiology', icon: <Heart size={24} />, bg: 'hover:border-red-500' },
              { name: 'Pediatrics', icon: <Baby size={24} />, bg: 'hover:border-green-500' },
              { name: 'Neurology', icon: <Brain size={24} />, bg: 'hover:border-cyan-500' },
              { name: 'Orthopedics', icon: <Activity size={24} />, bg: 'hover:border-blue-500' },
              { name: 'Ophthalmology', icon: <Eye size={24} />, bg: 'hover:border-purple-500' },
              { name: 'Dermatology', icon: <Sparkles size={24} />, bg: 'hover:border-orange-500' },
            ].map((spec) => (
              <div 
                key={spec.name}
                onClick={() => selectSpecialty(spec.name)}
                className={`group p-5 rounded-xl border border-slate-200 hover:shadow-sm transition-all duration-300 cursor-pointer text-center bg-white ${spec.bg}`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <div className="text-slate-600 group-hover:text-blue-600 transition-colors">
                    {spec.icon}
                  </div>
                </div>
                <p className="font-semibold text-xs text-slate-800">{spec.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hospitals Near You */}
      <section id="hospitals" className="py-20 px-8 bg-[#f8fafc] border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Hospitals Near You</h2>
              <p className="text-slate-500 mt-1 text-sm">Real-time walk-in queues near your location</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHospitals.map((hospital) => (
              <div 
                key={hospital.id} 
                className="bg-white rounded-xl overflow-hidden border border-slate-200 group shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
              >
                <div className="h-44 overflow-hidden relative">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
                    src={hospital.image} 
                    alt={hospital.name} 
                  />
                  {hospital.badge && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-sm">
                      {hospital.badge}
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{hospital.name}</h3>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-slate-400" /> {hospital.distance}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-blue-700">{hospital.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 my-2.5">
                      {hospital.description}
                    </p>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-4 py-2 border-y border-slate-100 mb-4">
                      <div className="flex-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Live Queue</p>
                        <p className="text-lg font-extrabold text-green-600">{hospital.liveQueueWait} mins</p>
                      </div>
                      <div className="flex-1 border-l border-slate-100 pl-4">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Consultation</p>
                        <p className="text-lg font-extrabold text-slate-800">${hospital.consultationFee}</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => onJoinQueue(hospital)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Join Queue <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredHospitals.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-semibold text-sm">No hospitals found matching your search.</p>
                <button onClick={() => { setSpecialtySearch(''); setLocationSearch(''); }} className="text-blue-600 font-bold text-xs underline mt-2 cursor-pointer">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4 Simple Steps */}
      <section className="py-20 px-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Healthcare in 4 Simple Steps</h2>
          <p className="text-slate-500 mt-2 max-w-xl mx-auto text-sm">
            No more waiting in crowded clinic rooms. Manage your visits from start to finish via our streamlined digital platform.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mt-16 relative">
            <div className="hidden md:block absolute top-10 left-[12%] right-[12%] h-[1px] bg-slate-200 z-0"></div>
            
            {[
              { step: '1', title: 'Search', desc: 'Find a certified medical facility or specialist based on wait times.', icon: <Search size={20} /> },
              { step: '2', title: 'Join', desc: 'Secure your spot in the virtual triage queue with one simple tap.', icon: <Heart size={20} /> },
              { step: '3', title: 'Track', desc: 'Get dynamic live updates on your phone while you wait comfortably at home.', icon: <Clock size={20} /> },
              { step: '4', title: 'Visit', desc: 'Arrive at the clinic precisely when the physician is ready for your treatment.', icon: <Stethoscope size={20} /> },
            ].map((item) => (
              <div key={item.step} className="relative z-10 group text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 transition-all duration-300">
                  {item.icon}
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-xs text-slate-500 max-w-[200px] mx-auto leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="mx-8 my-12">
        <div className="max-w-7xl mx-auto bg-slate-900 p-8 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg text-white">
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-md shrink-0">
              <ShieldAlert size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">Emergency Situation?</h2>
              <p className="text-slate-400 max-w-xl text-xs leading-relaxed">
                If you are experiencing life-threatening symptoms, call our medical emergency hotline immediately or proceed directly to the nearest ER.
              </p>
            </div>
          </div>
          <div className="relative z-10">
            <a href="tel:+1-800-467-7472" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
              <Phone size={14} /> 1-800-HOSPIRA
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-8">
          <div>
            <span className="text-xl font-bold text-blue-600">Hospira</span>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Pioneering a world where healthcare access is seamless, efficient, and patient-centered.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Company</h4>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <a href="#" className="hover:text-blue-600 transition-colors">About Us</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Careers</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Contact Us</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Legal</h4>
            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-blue-600 transition-colors">Cookie Settings</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-3">Staff Actions</h4>
            <button onClick={onNavigateToStaff} className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer">
              Enter Reception Desk Dashboard
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 pt-8 mt-8 border-t border-slate-200/50 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400">
          <p>© 2026 Hospira Medical Systems. All Rights Reserved.</p>
          <p className="mt-2 sm:mt-0 italic font-mono text-[10px]">Clean Minimalism Theme</p>
        </div>
      </footer>
    </div>
  );
}
