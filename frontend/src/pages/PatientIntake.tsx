import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function PatientIntake() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    phone: '',
    nationalId: '',
    address: '',
    insuranceNumber: '',
    insuranceProvider: '',
    insuranceStatus: 'Active',
    lastVisit: '',
  });
  const [clinical, setClinical] = useState({
    weightKg: '',
    heightCm: '',
    bloodPressure: '',
    temperatureC: '',
    pulse: '',
    complaint: '',
    notes: '',
  });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [idCheck, setIdCheck] = useState<{ checked: boolean; exists: boolean; id?: number | null }>({
    checked: false,
    exists: false,
    id: null,
  });

  const checkNationalId = async () => {
    if (!form.nationalId) return;
    try {
      const res = await apiFetch<{ exists: boolean; id?: number | null }>(
        `/api/patients/check-national-id?value=${encodeURIComponent(form.nationalId)}`
      );
      setIdCheck({ checked: true, exists: res.exists, id: res.id || null });
    } catch {
      // Ignore check errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        dob: form.dob,
        gender: form.gender,
        phone: form.phone,
        nationalId: form.nationalId,
        address: form.address,
        insuranceNumber: form.insuranceNumber || undefined,
        insuranceProvider: form.insuranceProvider || undefined,
        insuranceStatus: form.insuranceStatus || undefined,
        lastVisit: form.lastVisit || '',
      };
      const result = await apiFetch<{ id: number }>('/api/patients', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const hasClinical =
        clinical.weightKg ||
        clinical.heightCm ||
        clinical.bloodPressure ||
        clinical.temperatureC ||
        clinical.pulse ||
        clinical.complaint ||
        clinical.notes;
      if (hasClinical) {
        await apiFetch(`/api/patients/${result.id}/triage`, {
          method: 'POST',
          body: JSON.stringify({
            weightKg: clinical.weightKg ? Number(clinical.weightKg) : undefined,
            heightCm: clinical.heightCm ? Number(clinical.heightCm) : undefined,
            bloodPressure: clinical.bloodPressure || undefined,
            temperatureC: clinical.temperatureC ? Number(clinical.temperatureC) : undefined,
            pulse: clinical.pulse ? Number(clinical.pulse) : undefined,
            complaint: clinical.complaint || undefined,
            notes: clinical.notes || undefined,
            status: 'waiting',
          }),
        });
      }
      setSuccess('Patient created successfully.');
      setForm({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        phone: '',
        nationalId: '',
        address: '',
        insuranceNumber: '',
        insuranceProvider: '',
        insuranceStatus: 'Active',
        lastVisit: '',
      });
      setClinical({
        weightKg: '',
        heightCm: '',
        bloodPressure: '',
        temperatureC: '',
        pulse: '',
        complaint: '',
        notes: '',
      });
      navigate(`/patient/${result.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout activeTab="dashboard" title="New Patient Intake">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="grid md:grid-cols-4">
            <div className="md:col-span-1 bg-surface-container-low p-8 border-r border-outline-variant/30">
              <nav className="space-y-8">
                <button type="button" onClick={() => setStep(1)} className={`w-full flex items-center gap-4 ${step === 1 ? '' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full ${step === 1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center font-bold`}>1</div>
                  <span className={`text-sm font-bold ${step === 1 ? 'text-green-900' : 'text-on-surface-variant'} tracking-widest`}>Identity</span>
                </button>
                <button type="button" onClick={() => setStep(2)} className={`w-full flex items-center gap-4 ${step === 2 ? '' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full ${step === 2 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center font-bold`}>2</div>
                  <span className={`text-sm font-bold ${step === 2 ? 'text-green-900' : 'text-on-surface-variant'} tracking-widest`}>Insurance</span>
                </button>
                <button type="button" onClick={() => setStep(3)} className={`w-full flex items-center gap-4 ${step === 3 ? '' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full ${step === 3 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-surface-container-high text-on-surface-variant'} flex items-center justify-center font-bold`}>3</div>
                  <span className={`text-sm font-bold ${step === 3 ? 'text-green-900' : 'text-on-surface-variant'} tracking-widest`}>Clinical</span>
                </button>
              </nav>
            </div>
            <div className="md:col-span-3 p-10">
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-green-900 mb-2 font-headline">Patient Identification</h2>
                <p className="text-on-surface-variant text-sm">Basic demographic information for the medical record.</p>
              </div>
              <form className="space-y-8" onSubmit={handleSubmit}>
                {step === 1 && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">First Name *</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                      placeholder="e.g. John"
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Last Name *</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                      placeholder="e.g. Doe"
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Date of Birth *</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                      type="date"
                      value={form.dob}
                      onChange={(e) => setForm({ ...form, dob: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Gender *</label>
                    <select
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none appearance-none"
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Last Visit</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                      type="date"
                      value={form.lastVisit}
                      onChange={(e) => setForm({ ...form, lastVisit: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">ID / Passport Number *</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none font-mono"
                      placeholder="e.g. 11992883774"
                      type="text"
                      value={form.nationalId}
                      onChange={(e) => {
                        setForm({ ...form, nationalId: e.target.value });
                        setIdCheck({ checked: false, exists: false, id: null });
                      }}
                      onBlur={checkNationalId}
                      required
                    />
                    {idCheck.checked && idCheck.exists && (
                      <p className="text-[10px] text-error">A patient with this ID already exists.</p>
                    )}
                    {idCheck.checked && !idCheck.exists && (
                      <p className="text-[10px] text-primary">ID available.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Phone Number *</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                      placeholder="+250 788 000 000"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Residential Address *</label>
                  <textarea
                    className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none min-h-[100px]"
                    placeholder="Street, Sector, District"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  ></textarea>
                </div>
                </>
                )}
                {step === 2 && (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Insurance Provider</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                      placeholder="Provider name"
                      type="text"
                      value={form.insuranceProvider}
                      onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Insurance Number</label>
                    <input
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                      placeholder="Policy number"
                      type="text"
                      value={form.insuranceNumber}
                      onChange={(e) => setForm({ ...form, insuranceNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant tracking-widest block">Insurance Status</label>
                    <select
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none appearance-none"
                      value={form.insuranceStatus}
                      onChange={(e) => setForm({ ...form, insuranceStatus: e.target.value })}
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                      <option>Pending</option>
                    </select>
                  </div>
                </div>
                </>
                )}
                {step === 3 && (
                  <div className="space-y-6">
                    <p className="text-sm text-slate-500">Capture basic vitals and triage notes.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm"
                        placeholder="Weight (kg)"
                        value={clinical.weightKg}
                        onChange={(e) => setClinical({ ...clinical, weightKg: e.target.value })}
                      />
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm"
                        placeholder="Height (cm)"
                        value={clinical.heightCm}
                        onChange={(e) => setClinical({ ...clinical, heightCm: e.target.value })}
                      />
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm"
                        placeholder="Blood Pressure"
                        value={clinical.bloodPressure}
                        onChange={(e) => setClinical({ ...clinical, bloodPressure: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm"
                        placeholder="Temperature (°C)"
                        value={clinical.temperatureC}
                        onChange={(e) => setClinical({ ...clinical, temperatureC: e.target.value })}
                      />
                      <input
                        className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm"
                        placeholder="Pulse"
                        value={clinical.pulse}
                        onChange={(e) => setClinical({ ...clinical, pulse: e.target.value })}
                      />
                    </div>
                    <textarea
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm min-h-[100px]"
                      placeholder="Chief complaint"
                      value={clinical.complaint}
                      onChange={(e) => setClinical({ ...clinical, complaint: e.target.value })}
                    ></textarea>
                    <textarea
                      className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm min-h-[100px]"
                      placeholder="Additional triage notes"
                      value={clinical.notes}
                      onChange={(e) => setClinical({ ...clinical, notes: e.target.value })}
                    ></textarea>
                  </div>
                )}
                {error && <p className="text-xs text-error font-semibold">{error}</p>}
                {success && <p className="text-xs text-primary font-semibold">{success}</p>}
                <div className="pt-6 flex justify-end gap-4">
                  <button
                    className="px-8 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all"
                    type="button"
                    onClick={() => navigate('/dashboard')}
                  >
                    Cancel
                  </button>
                  {step > 1 && (
                    <button
                      className="px-8 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all"
                      type="button"
                      onClick={() => setStep((s) => Math.max(1, s - 1))}
                    >
                      Back
                    </button>
                  )}
                  {step < 3 && (
                    <button
                      className="px-10 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95 transition-all flex items-center gap-2"
                      type="button"
                      onClick={() => setStep((s) => Math.min(3, s + 1))}
                    >
                      Next
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                  )}
                  <button
                    className="px-10 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                    type="submit"
                    disabled={loading || step !== 3 || idCheck.exists}
                  >
                    {loading ? 'Saving...' : 'Save Patient'}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
