import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Clock,
  Check,
  UploadCloud,
  Trash2,
  PhoneCall,
  Info,
  FileText,
} from 'lucide-react';
import { Hospital, TicketSeverity, TicketType, Ticket, MedicalHistory } from '../types';
import { uploadTicketDocuments, subscribeHospitalTickets } from '../services';
import { CreateTicketPayload } from '../services';

interface RegistrationPageProps {
  hospital: Hospital;
  onBack: () => void;
  onSubmit: (formData: CreateTicketPayload) => Promise<void>;
  onOpenEmergencyChat: () => void;
}

export default function RegistrationPage({ hospital, onBack, onSubmit, onOpenEmergencyChat }: RegistrationPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    surgeries: false,
  });
  const [otherConditions, setOtherConditions] = useState('');

  // Real files selected by the user (uploaded to Firebase Storage on submit).
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  // Live queue reference for the sidebar (real Firestore data).
  const [queue, setQueue] = useState<Ticket[]>([]);
  useEffect(() => {
    const unsub = subscribeHospitalTickets(hospital.id, setQueue);
    return () => unsub();
  }, [hospital.id]);

  const waiting = queue.filter((t) => t.status === 'Waiting' || t.status === 'Urgent');
  const nowServing =
    queue.find((t) => t.status === 'Called')?.token ||
    queue.find((t) => t.status === 'Urgent')?.token ||
    '—';
  const patientsAhead = waiting.length;

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleDeleteFile = (name: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleCheckboxChange = (key: keyof typeof historyCheckboxes) => {
    setHistoryCheckboxes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCompleteRegistration = async () => {
    if (!fullName.trim() || !phone.trim()) {
      alert('Please fill out your Full Name and Phone Number in Step 2.');
      setCurrentStep(2);
      return;
    }
    if (!password || password.length < 6) {
      alert('Please set a password (at least 6 characters) in Step 2.');
      setCurrentStep(2);
      return;
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match. Please re-enter them in Step 2.');
      setCurrentStep(2);
      return;
    }

    setLoading(true);
    try {
      let documents: Ticket['documents'] = [];
      if (selectedFiles.length > 0) {
        documents = await uploadTicketDocuments(selectedFiles);
      }

      const medicalHistory: MedicalHistory = {
        ...historyCheckboxes,
        otherConditions,
      };

      const selectedDepartment = severity === 'Critical' ? 'Cardiology' : 'General';
      const registrationData: CreateTicketPayload = {
        fullName,
        phone,
        password,
        age: age ? parseInt(age) : 30,
        gender,
        symptoms,
        severity,
        type: 'Walk-in' as TicketType,
        reason: severity === 'Critical' ? 'Emergency / Urgent Care' : 'General Consultation',
        department: selectedDepartment,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        medicalHistory,
        documents,
      };

      await onSubmit(registrationData);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Registration failed.';
      if (message.includes('already have an active queue ticket')) {
        alert(message + ' Use "Track My Queue" on the home page to log in.');
      } else if (message.includes('already registered')) {
        alert(message);
      } else {
        alert('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
      if (!password || password.length < 6) {
        alert('Please set a password (at least 6 characters).');
        return;
      }
      if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCompleteRegistration();
    }
  };

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
          <span
            onClick={onOpenEmergencyChat}
            className="bg-red-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-red-700 transition-colors"
          >
            Emergency
          </span>
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
              { num: 5, label: 'Review' },
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
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Account Password * (min 6)</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password to track your queue later"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Confirm Password *</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full h-11 px-4 rounded-lg border border-slate-200 text-xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none text-slate-800"
                      />
                    </div>
                    <p className="col-span-full text-[10px] text-slate-400 -mt-2">
                      Use this phone and password to log in and view your live queue position anytime.
                    </p>
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

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-blue-600 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/10 transition-all cursor-pointer"
                  >
                    <UploadCloud size={32} className="text-blue-500 mb-3" />
                    <p className="font-bold text-xs text-slate-800">Click to upload or drag & drop files</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, or PNG (Max 10MB per document)</p>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Selected Documents ({selectedFiles.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {selectedFiles.map((file) => {
                          const isImage = file.type.startsWith('image/');
                          const previewUrl = isImage ? URL.createObjectURL(file) : '';
                          return (
                            <div key={file.name} className="relative group aspect-square rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shadow-sm">
                              {isImage ? (
                                <img className="w-full h-full object-cover opacity-90" src={previewUrl} alt={file.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <FileText size={30} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }}
                                  className="bg-red-600 text-white p-2 rounded-full hover:scale-110 transition-transform cursor-pointer"
                                  title="Remove document"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 text-white p-1.5 text-[9px] truncate">
                                {file.name} • {formatSize(file.size)}
                              </div>
                            </div>
                          );
                        })}
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

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Attached Documents</p>
                        <p className="text-base font-bold text-slate-800">{selectedFiles.length} file(s)</p>
                      </div>
                      <button type="button" onClick={() => setCurrentStep(4)} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">Edit</button>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Healthcare Clinic</p>
                      <p className="text-xs font-semibold text-slate-800">{hospital.name}</p>
                      <p className="text-[10px] text-slate-400">{hospital.address}</p>
                    </div>

                    <div className="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 flex gap-3">
                      <Info size={16} className="shrink-0 text-blue-500 mt-0.5" />
                      <p className="text-xs leading-relaxed">
                        By completing this registration, you authorize Hospira to allocate your spot in the virtual triage system. You will receive real-time tracking updates on the next screen.
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

        {/* Right Sidebar: Expected Queue Status (live) */}
        <aside className="w-full lg:w-80 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 bg-slate-900 text-white">
              <h3 className="text-sm font-bold tracking-tight">Live Queue Reference</h3>
              <p className="text-[10px] text-slate-400">Current Hospital Status</p>
            </div>
            <div className="p-5 space-y-6">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Token Serving</p>
                <p className="text-3xl font-black text-blue-600 mt-1">{nowServing}</p>
                <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-md px-2.5 py-0.5 text-[10px] font-bold mt-3">
                  <Clock size={10} /> {hospital.liveQueueWait} min avg wait
                </div>
              </div>

              <div className="h-[1px] bg-slate-100" />

              <div className="text-center opacity-80">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Patients Currently Waiting</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{patientsAhead}</p>
                <p className="text-xs text-slate-500 mt-1">in the active triage queue</p>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-[10px] font-bold text-slate-700 border-b border-slate-100 pb-1 uppercase tracking-wider">Queue Stats</h4>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Consultation Fee</span>
                  <span className="font-bold text-slate-800">${hospital.consultationFee}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>On-Duty Physicians</span>
                  <span className="font-bold text-slate-800">{hospital.availableDocs} Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assistant Info */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">Need assistance with details?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Need urgent help? Use the emergency assistant to load your medical history and jump to the front of the queue.
            </p>
            <button
              type="button"
              onClick={onOpenEmergencyChat}
              className="w-full py-2 bg-white hover:bg-red-50 border border-red-300 text-red-600 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <PhoneCall size={12} /> Emergency Assistant
            </button>
          </div>
        </aside>

      </main>
    </div>
  );
}
