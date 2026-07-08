import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Bot, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Hospital } from '../types';
import { activateEmergency } from '../services';

interface EmergencyChatbotProps {
  open: boolean;
  onClose: () => void;
  hospitals: Hospital[];
  defaultHospitalId?: string;
  onActivated: (ticketId: string) => void;
}

type Step = 'confirm' | 'hospital' | 'phone' | 'password' | 'symptoms' | 'loading' | 'success' | 'error';

interface ChatMessage {
  role: 'bot' | 'user';
  text: string;
}

export default function EmergencyChatbot({
  open,
  onClose,
  hospitals,
  defaultHospitalId,
  onActivated,
}: EmergencyChatbotProps) {
  const [step, setStep] = useState<Step>('confirm');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hospitalId, setHospitalId] = useState(defaultHospitalId || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    token: string;
    fullName: string;
    historySummary: string[];
    queuePosition: number;
    ticketId: string;
  } | null>(null);

  const addBot = (text: string) => setMessages((prev) => [...prev, { role: 'bot', text }]);
  const addUser = (text: string) => setMessages((prev) => [...prev, { role: 'user', text }]);

  useEffect(() => {
    if (!open) return;
    setStep('confirm');
    setMessages([{
      role: 'bot',
      text: "I'm the Hospira Emergency Assistant. For life-threatening emergencies, go to the nearest ER or call local emergency services. Are you experiencing a medical emergency and need immediate queue priority?",
    }]);
    setPhone('');
    setPassword('');
    setSymptoms('');
    setError('');
    setResult(null);
    setHospitalId(defaultHospitalId || hospitals[0]?.id || '');
  }, [open, defaultHospitalId]);

  const handleConfirmEmergency = (yes: boolean) => {
    if (!yes) {
      addUser('No');
      addBot('Understood. If your situation changes, you can open this assistant again from any Emergency button.');
      setStep('error');
      setError('No emergency declared. Stay safe.');
      return;
    }
    addUser('Yes, I need emergency assistance');
    addBot('Please select the hospital where you need care.');
    setStep('hospital');
  };

  const handleHospitalSelect = () => {
    const hospital = hospitals.find((h) => h.id === hospitalId);
    if (!hospital) {
      setError('Please select a hospital.');
      return;
    }
    addUser(hospital.name);
    addBot('Enter your registered phone number so we can load your medical history and prioritize your queue position.');
    setStep('phone');
  };

  const handlePhoneSubmit = () => {
    if (!phone.trim()) {
      setError('Please enter your registered phone number.');
      return;
    }
    addUser(phone);
    addBot('Enter your account password to verify your identity.');
    setStep('password');
    setError('');
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    addUser('••••••••');
    addBot('Briefly describe your symptoms (optional), then tap Activate Emergency Priority.');
    setStep('symptoms');
    setError('');
  };

  const handleActivate = async () => {
    if (!hospitalId) {
      setError('Please select a hospital.');
      return;
    }
    if (symptoms.trim()) addUser(symptoms.trim());

    setStep('loading');
    setError('');
    addBot('Looking up your record and prioritizing your queue position...');

    try {
      const data = await activateEmergency({
        phone,
        password,
        hospitalId,
        symptoms: symptoms.trim() || undefined,
      });

      const historyText =
        data.historySummary.length > 0
          ? data.historySummary.join(', ')
          : 'No prior conditions on file';

      setResult({
        token: data.ticket.token,
        fullName: data.patient.fullName,
        historySummary: data.historySummary,
        queuePosition: data.queuePosition,
        ticketId: data.ticket.id,
      });

      addBot(
        `Record found for ${data.patient.fullName}. Medical history: ${historyText}. You have been placed at position #${data.queuePosition} in the queue. Your emergency token is ${data.ticket.token}.`
      );
      setStep('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not activate emergency priority.';
      setError(message);
      addBot(message);
      setStep('error');
    }
  };

  const handleViewQueue = () => {
    if (result?.ticketId) {
      onActivated(result.ticketId);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} />
            <div>
              <h3 className="text-sm font-bold">Emergency Assistant</h3>
              <p className="text-[10px] text-red-100">Dummy triage chatbot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[280px]">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'bot'
                    ? 'bg-white border border-slate-200 text-slate-700'
                    : 'bg-red-600 text-white'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {step === 'loading' && (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {step === 'success' && result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-700 font-bold text-xs">
                <CheckCircle2 size={16} />
                Emergency priority activated
              </div>
              <p className="text-xs text-green-800">
                Token <span className="font-mono font-bold">{result.token}</span> — Queue position{' '}
                <span className="font-bold">#{result.queuePosition}</span>
              </p>
              {result.historySummary.length > 0 && (
                <p className="text-[10px] text-green-700">
                  On file: {result.historySummary.join(', ')}
                </p>
              )}
            </div>
          )}

          {step === 'error' && error && step !== 'confirm' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 bg-white space-y-3 shrink-0">
          {step === 'confirm' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleConfirmEmergency(true)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Yes — Emergency
              </button>
              <button
                onClick={() => handleConfirmEmergency(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                No
              </button>
            </div>
          )}

          {step === 'hospital' && (
            <>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs bg-slate-50"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleHospitalSelect}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Continue
              </button>
            </>
          )}

          {step === 'phone' && (
            <>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Registered phone number"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs"
              />
              {error && <p className="text-[10px] text-red-600">{error}</p>}
              <button
                onClick={handlePhoneSubmit}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Continue
              </button>
            </>
          )}

          {step === 'password' && (
            <>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Account password"
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-xs"
              />
              {error && <p className="text-[10px] text-red-600">{error}</p>}
              <button
                onClick={handlePasswordSubmit}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Continue
              </button>
            </>
          )}

          {step === 'symptoms' && (
            <>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe symptoms (optional)"
                rows={2}
                className="w-full p-3 border border-slate-200 rounded-lg text-xs resize-none"
              />
              <button
                onClick={handleActivate}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send size={14} /> Activate Emergency Priority
              </button>
            </>
          )}

          {step === 'success' && (
            <button
              onClick={handleViewQueue}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs cursor-pointer"
            >
              View Live Queue Status
            </button>
          )}

          {(step === 'error' || step === 'success') && (
            <button
              onClick={onClose}
              className="w-full py-2 text-slate-500 text-xs font-semibold hover:text-slate-700 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
