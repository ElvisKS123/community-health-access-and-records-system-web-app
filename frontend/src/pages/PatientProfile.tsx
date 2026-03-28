import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { apiFetch, apiFetchBlob, apiUpload } from '../lib/api';

type Patient = {
  id: number;
  full_name: string;
  dob: string;
  gender: string;
  phone: string | null;
  national_id: string | null;
  address: string | null;
  insurance_number: string | null;
  insurance_provider: string | null;
  insurance_status: string | null;
  last_visit: string | null;
};

type Triage = {
  id: number;
  patient_id: number;
  weight_kg: number | null;
  height_cm: number | null;
  blood_pressure: string | null;
  temperature_c: number | null;
  pulse: number | null;
  complaint: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

type Record = {
  id: number;
  date: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  doctor_name: string | null;
};

type LabResult = {
  id: number;
  test_type: string;
  status: string;
  result: string | null;
  ordered_at: string;
};

type Assignment = {
  id: number;
  patient_id: number;
  doctor_id: number | null;
  doctor_name: string | null;
  doctor_department: string | null;
  status: string | null;
};

type FileItem = {
  id: number;
  filename: string;
  original_name: string;
  mimetype: string;
  size: number;
  path: string;
  created_at: string;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
};

const calcAge = (dob: string) => {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

export default function PatientProfile() {
  const { id } = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [latestTriage, setLatestTriage] = useState<Triage | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [assignmentInfo, setAssignmentInfo] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'meds' | 'allergies' | 'imm' | 'problems' | 'triage'>('records');
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null);
  
  const [editForm, setEditForm] = useState({
    fullName: '',
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

  const [triageForm, setTriageForm] = useState({
    weightKg: '', heightCm: '', bloodPressure: '', temperatureC: '', pulse: '', complaint: '', notes: '', status: 'waiting'
  });

  const [newRecord, setNewRecord] = useState({
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  const [medForm, setMedForm] = useState({
    name: '', dosage: '', frequency: '', startDate: '', endDate: '', status: 'Active', notes: ''
  });
  const [allergyForm, setAllergyForm] = useState({
    allergen: '', reaction: '', severity: '', notes: ''
  });
  const [immForm, setImmForm] = useState({
    vaccine: '', date: '', dose: '', notes: ''
  });
  const [problemForm, setProblemForm] = useState({
    problem: '', status: 'Active', onsetDate: '', resolvedDate: '', notes: ''
  });

  const [medications, setMedications] = useState<any[]>([]);
  const [allergies, setAllergies] = useState<any[]>([]);
  const [immunizations, setImmunizations] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);

  const { user } = useAuth();
  const isDoctorOrAdmin = user?.role === 'doctor' || user?.role === 'admin';

  const patientId = useMemo(() => Number(id), [id]);

  const loadData = async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [patientRes, recordRes, fileRes, medsRes, allergyRes, immRes, problemRes, triageRes, labRes, assignmentRes] = await Promise.all([
        apiFetch<Patient>(`/api/patients/${patientId}`),
        apiFetch<Record[]>(`/api/patients/${patientId}/records`),
        apiFetch<FileItem[]>(`/api/patients/${patientId}/files`),
        apiFetch<any[]>(`/api/patients/${patientId}/medications`),
        apiFetch<any[]>(`/api/patients/${patientId}/allergies`),
        apiFetch<any[]>(`/api/patients/${patientId}/immunizations`),
        apiFetch<any[]>(`/api/patients/${patientId}/problems`),
        apiFetch<Triage | null>(`/api/patients/${patientId}/triage/latest`),
        apiFetch<LabResult[]>(`/api/patients/${patientId}/lab-results`),
        apiFetch<Assignment[]>(`/api/assignments`),
      ]);
      setPatient(patientRes);
      setLatestTriage(triageRes);
      setRecords(recordRes);
      setFiles(fileRes);
      setMedications(medsRes);
      setAllergies(allergyRes);
      setImmunizations(immRes);
      setProblems(problemRes);
      setLabs(labRes);
      const currentAssignment = assignmentRes.find(
        (assignment) => assignment.patient_id === patientId && assignment.status !== 'completed'
      );
      setAssignmentInfo(currentAssignment || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load patient profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId]);

  const handleUpload = async () => {
    if (!fileUpload || !patientId) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileUpload);
      formData.append('patientId', String(patientId));
      await apiUpload('/api/upload', formData);
      setFileUpload(null);
      await loadData();
    } catch (err) {
      // Ignore for now, surfaced via general error
    } finally {
      setUploading(false);
    }
  };

  const handleViewFile = async (file: FileItem) => {
    try {
      const blob = await apiFetchBlob(`/api/files/${file.id}/download`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      setError(err?.message || 'Failed to open file');
    }
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !newRecord.diagnosis || !newRecord.date) {
      setError('Please provide a date and diagnosis before saving.');
      return;
    }
    setLoading(true);
    try {
      setError(null);
      await apiFetch(`/api/patients/${patientId}/records`, {
        method: 'POST',
        body: JSON.stringify({
          ...newRecord,
          doctorName: user?.fullName || user?.email || undefined,
        }),
      });
      setNewRecord({ date: new Date().toISOString().split('T')[0], diagnosis: '', treatment: '', notes: '' });
      setShowAddRecord(false);
      setActiveTab('records');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to add medical record');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/api/patients/${patientId}/medications`, {
        method: 'POST',
        body: JSON.stringify(medForm),
      });
      setMedForm({ name: '', dosage: '', frequency: '', startDate: '', endDate: '', status: 'Active', notes: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to add medication');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/api/patients/${patientId}/allergies`, {
        method: 'POST',
        body: JSON.stringify(allergyForm),
      });
      setAllergyForm({ allergen: '', reaction: '', severity: '', notes: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to add allergy');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImmunization = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/api/patients/${patientId}/immunizations`, {
        method: 'POST',
        body: JSON.stringify(immForm),
      });
      setImmForm({ vaccine: '', date: '', dose: '', notes: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to add immunization');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch(`/api/patients/${patientId}/problems`, {
        method: 'POST',
        body: JSON.stringify(problemForm),
      });
      setProblemForm({ problem: '', status: 'Active', onsetDate: '', resolvedDate: '', notes: '' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to add problem');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setLoading(true);
    try {
      await apiFetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      setShowEditProfile(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleTriageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;
    setLoading(true);
    
    const payload = {
      ...triageForm,
      weightKg: triageForm.weightKg ? Number(triageForm.weightKg) : undefined,
      heightCm: triageForm.heightCm ? Number(triageForm.heightCm) : undefined,
      temperatureC: triageForm.temperatureC ? Number(triageForm.temperatureC) : undefined,
      pulse: triageForm.pulse ? Number(triageForm.pulse) : undefined,
    };

    try {
      await apiFetch(`/api/patients/${patientId}/triage`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTriageForm({ weightKg: '', heightCm: '', bloodPressure: '', temperatureC: '', pulse: '', complaint: '', notes: '', status: 'waiting' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to add triage record');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!patient) return;
    setEditForm({
      fullName: patient.full_name,
      dob: patient.dob.split('T')[0],
      gender: patient.gender,
      phone: patient.phone || '',
      nationalId: patient.national_id || '',
      address: patient.address || '',
      insuranceNumber: patient.insurance_number || '',
      insuranceProvider: patient.insurance_provider || '',
      insuranceStatus: patient.insurance_status || 'Active',
      lastVisit: patient.last_visit ? patient.last_visit.split('T')[0] : '',
    });
    setShowEditProfile(true);
  };

  const handleDeleteItem = async (path: string) => {
    if (!confirm('Are you sure you want to remove this entry?')) return;
    try {
      await apiFetch(path, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete item');
    }
  };

  return (
    <Layout activeTab="patients" title="Patient Profile">
      {error && <p className="mb-4 text-xs text-error font-semibold">{error}</p>}
      {loading && <p className="mb-4 text-xs text-slate-500">Loading...</p>}
      {patient && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-8 text-center relative">
              <div className="flex justify-end -mt-4 mb-2">
                <button 
                  onClick={openEditModal}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
                  title="Edit Profile"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
              </div>
              <div className="w-24 h-24 rounded-full bg-primary-fixed mx-auto mb-6 flex items-center justify-center text-3xl font-black text-primary">
                {getInitials(patient.full_name)}
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-1 font-headline">{patient.full_name}</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">{patient.national_id || 'No National ID'}</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">Age</p>
                  <p className="text-sm font-bold text-green-900">{calcAge(patient.dob)} Years</p>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">Gender</p>
                  <p className="text-sm font-bold text-green-900">{patient.gender}</p>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">DOB</p>
                  <p className="text-sm font-bold text-green-900">{new Date(patient.dob).toLocaleDateString()}</p>
                </div>
                <div className="p-3 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">Record ID</p>
                  <p className="text-sm font-bold text-green-900">#{patient.id}</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
              <h3 className="font-bold text-green-900 mb-6 font-headline">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-slate-400">call</span>
                  <p className="text-sm text-slate-600 font-medium">{patient.phone || '-'}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-slate-400">location_on</span>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{patient.address || '-'}</p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
              <h3 className="font-bold text-green-900 mb-6 font-headline">Insurance Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1 uppercase">Provider</p>
                    <p className="text-sm font-bold text-green-900">{patient.insurance_provider || 'Self Pay / None'}</p>
                  </div>
                  {patient.insurance_status && (
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${patient.insurance_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {patient.insurance_status.toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1 uppercase">Policy / Insurance #</p>
                  <p className="text-sm font-bold text-slate-600">{patient.insurance_number || '-'}</p>
                </div>
              </div>
            </section>


          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-green-900 font-headline">Patient Overview</h3>
                <p className="text-xs text-slate-500">Recent activity and clinical summary</p>
              </div>
              {isDoctorOrAdmin && (
                <button
                  onClick={() => setShowAddRecord(true)}
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold tracking-widest shadow-sm hover:bg-primary-container transition-all"
                >
                  NEW VISIT
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5">
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">LATEST VISIT</p>
                <p className="text-lg font-black text-green-900">
                  {records[0]?.date ? new Date(records[0].date).toLocaleDateString() : '—'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5">
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">ACTIVE MEDS</p>
                <p className="text-lg font-black text-green-900">
                  {medications.filter((m) => (m.status || 'Active') === 'Active').length}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5">
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">LAST LAB STATUS</p>
                <p className="text-lg font-black text-green-900">
                  {labs[0]?.status || '—'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-5">
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">ALLERGIES</p>
                <p className="text-lg font-black text-green-900">
                  {allergies.length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
              <h3 className="font-bold text-green-900 mb-4 font-headline">Staff / Provider</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">PRIMARY DOCTOR</p>
                  <p className="font-semibold text-green-900">{assignmentInfo?.doctor_name || records[0]?.doctor_name || '—'}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">LAST TREATING DOCTOR</p>
                  <p className="font-semibold text-green-900">{records[0]?.doctor_name || '—'}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">ASSIGNED DEPARTMENT</p>
                  <p className="font-semibold text-green-900">{assignmentInfo?.doctor_department || '—'}</p>
                </div>
              </div>
            </div>
            {latestTriage && (
              <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
                  <h3 className="font-bold text-green-900 font-headline">Latest Vitals & Triage</h3>
                  <span className="text-[10px] font-bold text-slate-500 tracking-widest italic">RECORDED ON {new Date(latestTriage.created_at).toLocaleDateString()}</span>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-primary font-bold tracking-widest mb-1 uppercase">Weight</p>
                    <p className="text-lg font-black text-green-900">{latestTriage.weight_kg || '-'} <span className="text-xs font-normal text-slate-400">kg</span></p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-primary font-bold tracking-widest mb-1 uppercase">Height</p>
                    <p className="text-lg font-black text-green-900">{latestTriage.height_cm || '-'} <span className="text-xs font-normal text-slate-400">cm</span></p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-primary font-bold tracking-widest mb-1 uppercase">BP</p>
                    <p className="text-lg font-black text-green-900">{latestTriage.blood_pressure || '-'}</p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-primary font-bold tracking-widest mb-1 uppercase">Temp</p>
                    <p className="text-lg font-black text-green-900">{latestTriage.temperature_c || '-'} <span className="text-xs font-normal text-slate-400">°C</span></p>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] text-primary font-bold tracking-widest mb-1 uppercase">Pulse</p>
                    <p className="text-lg font-black text-green-900">{latestTriage.pulse || '-'} <span className="text-xs font-normal text-slate-400">bpm</span></p>
                  </div>
                  <div className="col-span-2 md:col-span-5 pt-2 border-t border-outline-variant/20">
                    <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1 uppercase">Chief Complaint</p>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{latestTriage.complaint || 'No special complaint recorded.'}</p>
                    {latestTriage.notes && (
                      <div className="mt-4 p-4 bg-surface-container-low rounded-xl text-xs text-slate-600 border-l-4 border-primary">
                        <p className="font-bold mb-1">Triage Notes:</p>
                        {latestTriage.notes}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
              <div className="px-6 py-5 flex justify-between items-center">
                <h3 className="font-bold text-green-900 font-headline">Medical Records</h3>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-500">{records.length} entries</span>
                  {isDoctorOrAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddRecord(!showAddRecord)}
                        className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold tracking-widest shadow-sm hover:bg-primary-container transition-all"
                        title="New Visit"
                      >
                        {showAddRecord ? 'CLOSE' : 'NEW VISIT'}
                      </button>
                      <button 
                        onClick={() => setShowAddRecord(!showAddRecord)}
                        className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                        title="New Visit"
                      >
                        <span className="material-symbols-outlined text-xl">{showAddRecord ? 'close' : 'add'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mx-6 border-b border-outline-variant/20" />
              {showAddRecord && (
                <div className="fixed inset-0 bg-green-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-green-900 font-headline">New Visit</h3>
                        <p className="text-xs text-slate-500 font-medium">Add clinical updates for {patient.full_name}.</p>
                      </div>
                      <button
                        onClick={() => setShowAddRecord(false)}
                        className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div className="flex border-b border-outline-variant/30 overflow-x-auto no-scrollbar bg-white">
                      {[
                        { id: 'records', label: 'ENCOUNTER', icon: 'clinical_notes' },
                        { id: 'meds', label: 'MEDICATIONS', icon: 'prescriptions' },
                        { id: 'allergies', label: 'ALLERGIES', icon: 'warning' },
                        { id: 'imm', label: 'IMMUNIZATIONS', icon: 'vaccines' },
                        { id: 'problems', label: 'PROBLEMS', icon: 'list' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`px-6 py-4 text-[10px] font-bold tracking-widest whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                            activeTab === tab.id
                              ? 'text-primary border-primary bg-primary/5'
                              : 'text-slate-400 border-transparent hover:text-slate-600'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-8 overflow-y-auto">
                      {activeTab === 'records' && (
                        <form onSubmit={handleSubmitRecord} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">DATE</label>
                              <input
                                type="date"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={newRecord.date}
                                onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">DIAGNOSIS</label>
                              <input
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={newRecord.diagnosis}
                                onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">TREATMENT</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                value={newRecord.treatment}
                                onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">NOTES</label>
                              <textarea
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                value={newRecord.notes}
                                onChange={(e) => setNewRecord({ ...newRecord, notes: e.target.value })}
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-container transition-all"
                          >
                            SAVE VISIT
                          </button>
                        </form>
                      )}

                      {activeTab === 'meds' && (
                        <form onSubmit={handleAddMedication} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">MEDICATION</label>
                              <input
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={medForm.name}
                                onChange={(e) => setMedForm({ ...medForm, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">DOSAGE</label>
                              <input
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={medForm.dosage}
                                onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">FREQUENCY</label>
                              <input
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={medForm.frequency}
                                onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">STATUS</label>
                              <select
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={medForm.status}
                                onChange={(e) => setMedForm({ ...medForm, status: e.target.value })}
                              >
                                <option value="Active">Active</option>
                                <option value="Stopped">Stopped</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">START DATE</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={medForm.startDate}
                                onChange={(e) => setMedForm({ ...medForm, startDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">END DATE</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={medForm.endDate}
                                onChange={(e) => setMedForm({ ...medForm, endDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">NOTES</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                value={medForm.notes}
                                onChange={(e) => setMedForm({ ...medForm, notes: e.target.value })}
                              />
                            </div>
                          </div>
                          <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-container transition-all">
                            SAVE MEDICATION
                          </button>
                        </form>
                      )}

                      {activeTab === 'allergies' && (
                        <form onSubmit={handleAddAllergy} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">ALLERGEN</label>
                              <input
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={allergyForm.allergen}
                                onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">REACTION</label>
                              <input
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={allergyForm.reaction}
                                onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">SEVERITY</label>
                              <select
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={allergyForm.severity}
                                onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
                              >
                                <option value="">Select</option>
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                              </select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">NOTES</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                value={allergyForm.notes}
                                onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
                              />
                            </div>
                          </div>
                          <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-container transition-all">
                            SAVE ALLERGY
                          </button>
                        </form>
                      )}

                      {activeTab === 'imm' && (
                        <form onSubmit={handleAddImmunization} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">VACCINE</label>
                              <input
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={immForm.vaccine}
                                onChange={(e) => setImmForm({ ...immForm, vaccine: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">DATE</label>
                              <input
                                type="date"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={immForm.date}
                                onChange={(e) => setImmForm({ ...immForm, date: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">DOSE</label>
                              <input
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={immForm.dose}
                                onChange={(e) => setImmForm({ ...immForm, dose: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">NOTES</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                value={immForm.notes}
                                onChange={(e) => setImmForm({ ...immForm, notes: e.target.value })}
                              />
                            </div>
                          </div>
                          <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-container transition-all">
                            SAVE IMMUNIZATION
                          </button>
                        </form>
                      )}

                      {activeTab === 'problems' && (
                        <form onSubmit={handleAddProblem} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">PROBLEM</label>
                              <input
                                required
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={problemForm.problem}
                                onChange={(e) => setProblemForm({ ...problemForm, problem: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">STATUS</label>
                              <select
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={problemForm.status}
                                onChange={(e) => setProblemForm({ ...problemForm, status: e.target.value })}
                              >
                                <option value="Active">Active</option>
                                <option value="Resolved">Resolved</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">ONSET DATE</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={problemForm.onsetDate}
                                onChange={(e) => setProblemForm({ ...problemForm, onsetDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">RESOLVED DATE</label>
                              <input
                                type="date"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                value={problemForm.resolvedDate}
                                onChange={(e) => setProblemForm({ ...problemForm, resolvedDate: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 tracking-widest block">NOTES</label>
                              <textarea
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none"
                                value={problemForm.notes}
                                onChange={(e) => setProblemForm({ ...problemForm, notes: e.target.value })}
                              />
                            </div>
                          </div>
                          <button type="submit" className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-lg shadow-primary/20 hover:bg-primary-container transition-all">
                            SAVE PROBLEM
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-outline-variant/30 text-[10px] font-bold tracking-wider text-slate-700">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Diagnosis</th>
                      <th className="px-6 py-4">Doctor</th>
                      <th className="px-6 py-4">Notes</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {records.map((record) => (
                      <React.Fragment key={record.id}>
                        <tr className="hover:bg-green-50/30 transition-colors">
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-900">
                            {record.diagnosis || "No diagnosis"}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {record.doctor_name || "-"}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {record.notes || "-"}
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <button
                              className="text-xs font-bold text-primary hover:underline"
                              onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                            >
                              {expandedRecordId === record.id ? "Hide Details" : "View Details"}
                            </button>
                          </td>
                        </tr>
                        {expandedRecordId === record.id && (
                          <tr className="bg-surface-container-low/40">
                            <td className="px-6 py-4 text-xs text-slate-600" colSpan={5}>
                              <div className="space-y-2">
                                {record.treatment && <p>Treatment: {record.treatment}</p>}
                                {record.notes && <p>Notes: {record.notes}</p>}
                                <div className="pt-2 border-t border-outline-variant/20">
                                  <p className="text-[10px] font-bold text-slate-500 tracking-widest mb-2">LATEST LABS</p>
                                  {labs.slice(0, 3).map((lab) => (
                                    <div key={lab.id} className="flex justify-between">
                                      <span>{lab.test_type}</span>
                                      <span>{lab.status}</span>
                                    </div>
                                  ))}
                                  {labs.length === 0 && <p>No lab results.</p>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td className="px-6 py-6 text-sm text-slate-500" colSpan={5}>
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="px-6 py-5 flex justify-between items-center">
                  <h3 className="font-bold text-green-900 font-headline">Medications</h3>
                  <span className="text-xs text-slate-500">{medications.length} items</span>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {medications.map((med) => (
                    <div key={med.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-900">{med.name}</p>
                        <p className="text-[10px] text-slate-500">{med.dosage || '-'} · {med.frequency || '-'}</p>
                      </div>
                      {isDoctorOrAdmin && (
                        <button onClick={() => handleDeleteItem(`/api/medications/${med.id}`)} className="text-error">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {medications.length === 0 && (
                    <div className="px-6 py-6 text-sm text-slate-500">No medications recorded.</div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="px-6 py-5 flex justify-between items-center">
                  <h3 className="font-bold text-green-900 font-headline">Allergies</h3>
                  <span className="text-xs text-slate-500">{allergies.length} items</span>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {allergies.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-red-900">{item.allergen}</p>
                        <p className="text-[10px] text-slate-500">{item.reaction || '-'} · {item.severity || '-'}</p>
                      </div>
                      {isDoctorOrAdmin && (
                        <button onClick={() => handleDeleteItem(`/api/allergies/${item.id}`)} className="text-error">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {allergies.length === 0 && (
                    <div className="px-6 py-6 text-sm text-slate-500">No allergies recorded.</div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="px-6 py-5 flex justify-between items-center">
                  <h3 className="font-bold text-green-900 font-headline">Immunizations</h3>
                  <span className="text-xs text-slate-500">{immunizations.length} items</span>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {immunizations.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">{item.vaccine}</p>
                        <p className="text-[10px] text-slate-500">{new Date(item.date).toLocaleDateString()} · {item.dose || '-'}</p>
                      </div>
                      {isDoctorOrAdmin && (
                        <button onClick={() => handleDeleteItem(`/api/immunizations/${item.id}`)} className="text-error">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {immunizations.length === 0 && (
                    <div className="px-6 py-6 text-sm text-slate-500">No immunizations recorded.</div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                <div className="px-6 py-5 flex justify-between items-center">
                  <h3 className="font-bold text-green-900 font-headline">Problem List</h3>
                  <span className="text-xs text-slate-500">{problems.length} items</span>
                </div>
                <div className="divide-y divide-outline-variant/20">
                  {problems.map((item) => (
                    <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.problem}</p>
                        <p className="text-[10px] text-slate-500">{item.status || '-'} · Onset: {item.onset_date ? new Date(item.onset_date).toLocaleDateString() : '-'}</p>
                      </div>
                      {isDoctorOrAdmin && (
                        <button onClick={() => handleDeleteItem(`/api/problems/${item.id}`)} className="text-error">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      )}
                    </div>
                  ))}
                  {problems.length === 0 && (
                    <div className="px-6 py-6 text-sm text-slate-500">No problems recorded.</div>
                  )}
                </div>
              </section>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
              <div className="px-6 py-5 flex justify-between items-center">
                <h3 className="font-bold text-green-900 font-headline">Patient Files</h3>
                <span className="text-xs text-slate-500">{files.length} documents</span>
              </div>
              <div className="mx-6 border-b border-outline-variant/20" />
              
              <div className="divide-y divide-outline-variant/20">
                {files.map((file) => (
                  <div key={file.id} className="px-6 py-4 flex items-center justify-between group hover:bg-green-50/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-green-900">{file.original_name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Uploaded on {new Date(file.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary-fixed/20 rounded-lg transition-all"
                      onClick={() => handleViewFile(file)}
                    >
                      VIEW
                    </button>
                  </div>
                ))}
                {files.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <span className="material-symbols-outlined text-4xl mb-2 opacity-20">folder_open</span>
                    <p className="text-sm italic">No clinical documents uploaded yet.</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/20">
                <h4 className="text-[10px] font-bold text-slate-500 tracking-widest mb-4">UPLOAD NEW DOCUMENT</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <input
                      className="w-full px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                      type="file"
                      onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                    />
                  </div>
                  <button
                    className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold text-xs tracking-widest shadow-lg shadow-primary/10 hover:translate-y-[-1px] transition-all disabled:opacity-60 whitespace-nowrap"
                    disabled={!fileUpload || uploading}
                    onClick={handleUpload}
                  >
                    {uploading ? 'UPLOADING...' : 'UPLOAD'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {showEditProfile && (
        <div className="fixed inset-0 bg-green-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-green-900 font-headline">Edit Patient Profile</h3>
                <p className="text-xs text-slate-500 font-medium">Update basic demographics and insurance info.</p>
              </div>
              <button 
                onClick={() => setShowEditProfile(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleEditProfile} className="p-8 space-y-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Full Name</label>
                  <input required className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Date of Birth</label>
                  <input type="date" required className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Gender</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Phone Number</label>
                  <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">National ID</label>
                  <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.nationalId} onChange={e => setEditForm({...editForm, nationalId: e.target.value})} />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Address</label>
                  <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/30">
                <h4 className="text-[10px] font-black text-slate-400 tracking-[0.2em] mb-6 uppercase">Insurance & Billing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Insurance Provider</label>
                    <input placeholder="e.g. RSSB, Mutuelle" className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.insuranceProvider} onChange={e => setEditForm({...editForm, insuranceProvider: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Insurance/Policy Number</label>
                    <input className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.insuranceNumber} onChange={e => setEditForm({...editForm, insuranceNumber: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest block uppercase">Insurance Status</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-none text-sm outline-none focus:ring-2 focus:ring-primary-fixed font-medium" value={editForm.insuranceStatus} onChange={e => setEditForm({...editForm, insuranceStatus: e.target.value})}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button type="submit" className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold text-xs tracking-widest shadow-lg hover:bg-primary-container transition-all">SAVE CHANGES</button>
                <button type="button" onClick={() => setShowEditProfile(false)} className="px-8 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs tracking-widest hover:bg-slate-200 transition-all">CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
