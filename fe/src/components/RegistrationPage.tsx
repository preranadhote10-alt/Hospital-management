import React, { useState } from 'react';
import { 
  Heart, 
  MapPin, 
  Clock, 
  ChevronLeft, 
  Check, 
  UploadCloud, 
  Trash2, 
  PhoneCall, 
  AlertCircle,
  FileText,
  User,
  Info
} from 'lucide-react';
import { Hospital, TicketSeverity, TicketType } from '../types';

interface RegistrationPageProps {
  hospital: Hospital;
  onBack: () => void;
  onSubmit: (formData: any) => Promise<void>;
}

export default function RegistrationPage({ hospital, onBack, onSubmit }: RegistrationPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Select Gender');
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState<TicketSeverity>('Mild');
  const [historyCheckboxes, setHistoryCheckboxes] = useState({
    diabetes: false,
    highBP: false,
    asthma: false,
    allergies: false,
    heartCondition: false,
    surgeries: false
  });
  const [otherConditions, setOtherConditions] = useState('');
  
  // Preload interactive files for visual demonstration and allow users to delete/add
  const [uploadedFiles, setUploadedFiles] = useState([
    { name: 'lab_report_01.pdf', size: '2MB', type: 'PDF', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf7CUcNbdE4weIx_83cqT2Rw1YeE0dCFXUIfAQ_wTTZXNuu3OPwWazXPUP9Pxy6Cj3MmokOYfaAjxnADHPYVXYnuj5qVUlI2OKlC2MIcxd7LcuzPoFSYbYSCni_naNO_n9iRPp17zC_eM4KG-q1BlXrNTcO0HgfwoTo5ajs79YN8iZ3oGl4CyaSPWCzVw0wfKvaniP9-xmK1VvwIwsFR5OdPQ7Xnal5Bynj8Vlc40-47i6-sxWIary_oAdKXJhKJGyB_EptfiOr70' },
    { name: 'prescription_scan.jpg', size: '1.2MB', type: 'JPG', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvnKMF-dz_LXPcKZd6pgAII1wjuAYJeBet2LkGTUtucWb873LyI7ffsDXVywCJGe7-L_qLpnqiRrrSQhFEi6rMJ_T4oDPNHa7B483_W8g7I9zuHt2GQtLrlAxHn6iVBwHAa65kDHrVyx_YxvB3_shjI70w5wkbBQiF2a1u5J9VfVMwT7-oE2DpmGQjb7YckPikPkCK8pn1TVvVAFShKqd3JMiY9SBxxJ2uRjDq_qMzsDBjP3sNbDWpSePBostIkVySnkNnYR-pzuM' },
    { name: 'xray_chest.png', size: '5.4MB', type: 'PNG', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD3vVczFewIPC8sC2SX75Tqt5_EGl5LyH1HgcO-iXe9gJcdGS7cc3FIUd1CmIumnyuQtlyPvkUiiSLjEcFcHL7AbAoGPqxt4c3RW53bWELgAlrFOJiBbtZ8urpjLaqIJD1YbO6XXCrVG-HijivVNJGgGi8HabaL_M97xs60yU9VGjscU_qmLTFAAJHA3XZjnBFGhe5AgV-5jmIEDXZM6vY7F0oZNzdnvb6MLBonWsBUm6uYQx6VGQZZs4ZPwCAExV-kzNh1JZMTyDI' }
  ]);

  const [loading, setLoading] = useState(false);

  // File Delete Handler
  const handleDeleteFile = (fileName: string) => {
    setUploadedFiles(uploadedFiles.filter(f => f.name !== fileName));
  };

  // Checkbox toggle handler
  const handleCheckboxChange = (key: keyof typeof historyCheckboxes) => {
    setHistoryCheckboxes(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Form submission coordinator
  const handleCompleteRegistration = async () => {
    if (!fullName.trim() || !phone.trim()) {
      alert('Please fill out your Full Name and Phone Number in Step 2.');
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      const selectedDepartment = severity === 'Critical' ? 'Cardiology' : 'General';
      const registrationData = {
        fullName,
        phone,
        age: age ? parseInt(age) : 30,
        gender,
        symptoms,
        severity,
        type: 'Walk-in' as TicketType, // default walk-in for direct registration flow
        reason: severity === 'Critical' ? 'Emergency / Urgent Care' : 'General Consultation',
        department: selectedDepartment,
        hospitalId: hospital.id,
        hospitalName: hospital.name
      };

      await onSubmit(registrationData);
    } catch (err) {
      console.error(err);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Move forward
  const nextStep = () => {
    if (currentStep === 2) {
      if (!fullName.trim()) {
        alert('Please enter your full name to proceed.');
        return;
      }
      if (!phone.trim()) {
        alert('Please enter your phone number.');
        return;
      }
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteRegistration();
    }
  };

  // Move backward
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-16">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm flex justify-between items-center w-full px-8 py-3 sticky top-0 z-50">
        <span className="text-2xl font-bold text-blue-600 tracking-tight cursor-pointer" onClick={onBack}>
          Hospira
        </span>
        <div className="hidden md:flex gap-6">
          <a className="text-xs font-semibold text-blue-600 border-b-2 border-blue-600 pb-1 cursor-pointer" onClick={onBack}>Dashboard</a>
          <a className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer" onClick={onBack}>Patients</a>
          <a className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer" onClick={onBack}>Specialties</a>
          <a className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer" onClick={onBack}>Reports</a>
        </div>
        <div>
          <span className="bg-red-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-red-700 transition-colors">Emergency</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Form Flow */}
        <div className="flex-1 space-y-6">
          
          {/* Stepper Header */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center overflow-x-auto gap-4">
            {[
              { num: 1, label: 'Overview' },
              { num: 2, label: 'Details' },
              { num: 3, label: 'History' },
              { num: 4, label: 'Documents' },
              { num: 5, label: 'Review' }
            ].map((step, idx) => (
              <React.Fragment key={step.num}>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    currentStep === step.num 
                      ? 'border-blue-600 text-blue-600 font-bold scale-105 bg-blue-50/50' 
                      : currentStep > step.num 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'border-slate-200 text-slate-400'
                  }`}>
                    {currentStep > step.num ? <Check size={14} /> : step.num}
                  </span>
                  <span className={`text-xs font-semibold ${
                    currentStep === step.num ? 'text-blue-600' : 'text-slate-400'
                  }`}>{step.label}</span>
                </div>
                {idx < 4 && <div className="h-[1px] flex-1 bg-slate-200 min-w-[20px]" />}
              </React.Fragment>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8">
              
              {/* STEP 1: Hospital Overview */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Hospital Overview</h2>
                    <p className="text-xs text-slate-500">Verify the clinic or facility details before proceeding with registration.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="col-span-1 rounded-xl overflow-hidden h-40 border border-slate-200">
                      <img className="w-full h-full object-cover" src={hospital.image} alt={hospital.name} />
                    </div>
                    <div className="col-span-2 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{hospital.name}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin size={14} className="text-slate-400" /> {hospital.address}
                          </p>
                        </div>
                        <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0">OPEN NOW</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Wait</p>
                          <p className="text-xl font-black text-blue-600">~{hospital.liveQueueWait} Mins</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available Doctors</p>
                          <p className="text-xl font-black text-slate-800">{hospital.availableDocs}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mt-2">{hospital.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Personal Details</h2>
                    <p className="text-xs text-slate-500">Please enter your basic information to help triage your priority.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Mobile Number *</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Age</label>
                      <input 
                        type="number" 
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="Years"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gender</label>
                      <select 
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white text-slate-800"
                      >
                        <option>Select Gender</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Non-binary</option>
                        <option>Prefer not to say</option>
                      </select>
                    </div>
                    <div className="col-span-full space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Primary Symptoms</label>
                      <textarea 
                        value={symptoms}
                        onChange={(e) => setSymptoms(e.target.value)}
                        placeholder="Please describe how you are feeling (e.g. chest pain, severe cough, headache)..."
                        className="w-full p-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800"
                        rows={3}
                      />
                    </div>
                    <div className="col-span-full space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Severity Level Indicator</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(['Mild', 'Moderate', 'Severe', 'Critical'] as TicketSeverity[]).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setSeverity(level)}
                            className={`py-2.5 rounded-lg border font-semibold text-xs transition-all cursor-pointer ${
                              severity === level 
                                ? level === 'Critical'
                                  ? 'bg-red-50 text-red-600 border-red-500 border-2'
                                  : 'bg-blue-50 text-blue-600 border-blue-500 border-2'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Medical History */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Medical History Check</h2>
                    <p className="text-xs text-slate-500">Select any chronic or pre-existing conditions that apply to you.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {[
                      { key: 'diabetes', label: 'Diabetes (Type I or II)' },
                      { key: 'highBP', label: 'High Blood Pressure (BP)' },
                      { key: 'asthma', label: 'Asthma / Respiratory issues' },
                      { key: 'allergies', label: 'Drug / Food Allergies' },
                      { key: 'heartCondition', label: 'Heart Conditions' },
                      { key: 'surgeries', label: 'Previous Major Surgeries' },
                    ].map((item) => (
                      <label 
                        key={item.key} 
                        className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <input 
                          type="checkbox" 
                          checked={historyCheckboxes[item.key as keyof typeof historyCheckboxes]}
                          onChange={() => handleCheckboxChange(item.key as keyof typeof historyCheckboxes)}
                          className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                      </label>
                    ))}
                    <div className="col-span-full space-y-1.5 mt-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Additional Health Notes / Medications</label>
                      <textarea 
                        value={otherConditions}
                        onChange={(e) => setOtherConditions(e.target.value)}
                        placeholder="List any daily medications, current health conditions, or comments..."
                        className="w-full p-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Document Upload */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Document Upload</h2>
                    <p className="text-xs text-slate-500">Upload insurance cards, prescriptions, or laboratory reports to accelerate triage.</p>
                  </div>
                  
                  {/* Interactive Drag & Drop Box */}
                  <div 
                    onClick={() => {
                      const mockFiles = [
                        { name: 'insurance_card.pdf', size: '1.5MB', type: 'PDF', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDf7CUcNbdE4weIx_83cqT2Rw1YeE0dCFXUIfAQ_wTTZXNuu3OPwWazXPUP9Pxy6Cj3MmokOYfaAjxnADHPYVXYnuj5qVUlI2OKlC2MIcxd7LcuzPoFSYbYSCni_naNO_n9iRPp17zC_eM4KG-q1BlXrNTcO0HgfwoTo5ajs79YN8iZ3oGl4CyaSPWCzVw0wfKvaniP9-xmK1VvwIwsFR5OdPQ7Xnal5Bynj8Vlc40-47i6-sxWIary_oAdKXJhKJGyB_EptfiOr70' }
                      ];
                      setUploadedFiles([...uploadedFiles, ...mockFiles]);
                    }}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-600 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/10 transition-all cursor-pointer animate-fade-in"
                  >
                    <UploadCloud size={32} className="text-blue-500 mb-3" />
                    <p className="font-bold text-xs text-slate-800">Click to upload or drag & drop files</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, or PNG (Max 10MB per document)</p>
                  </div>

                  {/* Previews Grid */}
                  {uploadedFiles.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Uploaded Documents ({uploadedFiles.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {uploadedFiles.map((file) => (
                          <div key={file.name} className="relative group aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
                            <img className="w-full h-full object-cover opacity-80" src={file.image} alt={file.name} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }}
                                className="bg-red-600 text-white p-2 rounded-full hover:scale-110 transition-transform cursor-pointer"
                                title="Delete document"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 text-white p-1.5 text-[9px] truncate">
                              {file.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 5: Review & Submit */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Review & Submit</h2>
                    <p className="text-xs text-slate-500">Confirm your triaged details before submitting to generate a digital token.</p>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patient Name</p>
                        <p className="text-base font-bold text-blue-600">{fullName || 'N/A'}</p>
                      </div>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Triage Severity Level</p>
                        <p className={`text-base font-extrabold ${
                          severity === 'Critical' || severity === 'Severe' ? 'text-red-600' : 'text-green-600'
                        }`}>{severity.toUpperCase()}</p>
                      </div>
                      <button type="button" onClick={() => setCurrentStep(2)} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Healthcare Clinic</p>
                      <p className="text-xs font-semibold text-slate-800">{hospital.name}</p>
                      <p className="text-[10px] text-slate-400">{hospital.address}</p>
                    </div>

                    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 flex gap-3">
                      <Info size={16} className="shrink-0 text-blue-500 mt-0.5" />
                      <p className="text-xs leading-relaxed">
                        By completing this registration, you authorize Hospira to allocate your spot in the virtual triage system. You will receive real-time SMS tracking updates at the provided mobile number.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Form Actions Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <button 
                type="button" 
                onClick={prevStep}
                className="px-5 py-2 rounded-lg border border-slate-200 font-semibold text-xs text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button 
                type="button" 
                onClick={nextStep}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Submitting...' : currentStep === 5 ? 'Complete Registration' : 'Continue'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Expected Queue Status */}
        <aside className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="text-sm font-bold tracking-tight">Live Queue Reference</h3>
              <p className="text-[10px] text-slate-400">Current Hospital Status</p>
            </div>
            <div className="p-5 space-y-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Token Serving</p>
                <p className="text-3xl font-black text-blue-600 mt-1">#128</p>
                <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-md px-2.5 py-0.5 text-[10px] font-bold mt-3 animate-pulse">
                  <Clock size={10} /> Moving Fast
                </div>
              </div>
              
              <div className="h-[1px] bg-slate-100" />

              <div className="text-center opacity-60">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Your Estimated Spot</p>
                <p className="text-xl font-bold text-slate-800 mt-1">#142</p>
                <p className="text-xs text-slate-500 mt-1">~14 patients ahead of you</p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-bold text-slate-700 border-b border-slate-100 pb-1 uppercase tracking-wider">Queue Stats</h4>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Avg Consult Time</span>
                  <span className="font-bold text-slate-800">12m</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>On-Duty Physicians</span>
                  <span className="font-bold text-slate-800">8/10 Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assistant Info */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Need assistance with details?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              If you have any questions during registration, feel free to speak with our receptionist.
            </p>
            <a href="tel:+1-800-467-7472" className="w-full py-2 bg-white hover:bg-slate-50 border border-blue-600 text-blue-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
              <PhoneCall size={12} /> Call Front Desk
            </a>
          </div>
        </aside>

      </main>
    </div>
  );
}
