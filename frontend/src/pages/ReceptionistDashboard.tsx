import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';

type Patient = {
  id: number;
  full_name: string;
  national_id: string | null;
  created_at: string;
};

type Doctor = {
  id: number;
  full_name?: string | null;
  email: string;
  is_active: boolean;
  department?: string | null;
};

type Assignment = {
  id: number;
  patient_id: number;
  patient_name?: string;
  doctor_id: number | null;
  doctor_email?: string | null;
  status: string;
};

type TriageEntry = {
  id: number;
  patient_id: number;
  patient_name?: string;
  status: string;
  complaint?: string | null;
  created_at: string;
};

export default function ReceptionistDashboard() {
  const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
  const [totalPatients, setTotalPatients] = useState(0);
  const [activeDoctors, setActiveDoctors] = useState(0);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [triage, setTriage] = useState<TriageEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const [patientsRes, doctorsRes, assignmentsRes, triageRes] = await Promise.all([
        apiFetch<{ data: Patient[]; total: number }>('/api/patients?limit=5&page=1'),
          apiFetch<Array<{ id: number; is_active: boolean; department?: string | null; email?: string }>>('/api/doctors'),
        apiFetch<Assignment[]>('/api/assignments'),
        apiFetch<TriageEntry[]>('/api/triage?limit=6'),
      ]);
      setRecentPatients(patientsRes.data);
      setTotalPatients(patientsRes.total);
      setDoctors(doctorsRes as Doctor[]);
      setActiveDoctors(doctorsRes.filter((doc) => doc.is_active).length);
      setAssignments(assignmentsRes.slice(0, 5));
      setTriage(triageRes);
    } catch {
      setError('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateTriageStatus = async (id: number, status: string) => {
    try {
      await apiFetch(`/api/triage/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch {
      setError('Failed to update triage status');
    }
  };

  return (
    <Layout activeTab="dashboard">
      {error && <p className="mb-4 text-xs text-error font-semibold">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary-container p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-xs font-bold tracking-widest opacity-80 mb-1">Total Patients</p>
                <h3 className="text-4xl font-black font-headline">{totalPatients}</h3>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:scale-110 transition-transform">group</span>
            </div>
            <div className="bg-secondary-container p-6 rounded-2xl text-on-secondary-container shadow-sm relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-xs font-bold tracking-widest opacity-70 mb-1">Active Doctors</p>
                <h3 className="text-4xl font-black font-headline">{activeDoctors}</h3>
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:scale-110 transition-transform">stethoscope</span>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-green-900 font-headline">Recent Registrations</h3>
              <Link to="/patients" className="text-xs font-bold text-primary hover:underline tracking-widest">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[10px] font-bold tracking-widest text-slate-500">
                    <th className="px-6 py-4">Patient Name</th>
                    <th className="px-6 py-4">ID / Passport</th>
                    <th className="px-6 py-4">Registered</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {recentPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-xs font-bold text-primary">
                            {patient.full_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-900">{patient.full_name}</p>
                            <p className="text-[10px] text-slate-500">Registered recently</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">{patient.national_id || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(patient.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <Link to={`/patient/${patient.id}`} className="p-2 hover:bg-primary-fixed/20 rounded-lg transition-colors text-primary">
                          <span className="material-symbols-outlined text-lg">person_search</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recentPatients.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-slate-500" colSpan={4}>
                        No recent registrations yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-green-900 font-headline">Triage Queue</h3>
              <span className="text-xs text-slate-500">{triage.length} entries</span>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {triage.map((entry) => (
                <div key={entry.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-900">{entry.patient_name || `#${entry.patient_id}`}</p>
                    <p className="text-[10px] text-slate-500">{entry.complaint || 'No complaint noted'}</p>
                    <p className="text-[10px] text-slate-400">{new Date(entry.created_at).toLocaleTimeString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-[10px] font-bold rounded bg-secondary-container text-on-secondary-container">
                      {entry.status}
                    </span>
                    <select
                      className="px-2 py-1 bg-surface-container-low rounded text-xs"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) updateTriageStatus(entry.id, e.target.value);
                      }}
                    >
                      <option value="">Update</option>
                      <option value="waiting">Waiting</option>
                      <option value="in_consultation">In Consultation</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
              {triage.length === 0 && (
                <div className="px-6 py-6 text-sm text-slate-500">No triage entries yet.</div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
            <h3 className="font-bold text-green-900 mb-6 font-headline">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/intake" className="p-4 bg-surface-container-low rounded-xl flex flex-col items-center gap-3 hover:bg-primary-fixed/20 transition-all group">
                <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">person_add</span>
                <span className="text-xs font-bold text-green-900 tracking-widest">New Intake</span>
              </Link>
              <Link to="/assignment" className="p-4 bg-surface-container-low rounded-xl flex flex-col items-center gap-3 hover:bg-primary-fixed/20 transition-all group">
                <span className="material-symbols-outlined text-primary text-3xl group-hover:scale-110 transition-transform">assignment_ind</span>
                <span className="text-xs font-bold text-green-900 tracking-widest">Assign Doc</span>
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
            <h3 className="font-bold text-green-900 mb-6 font-headline">Active Doctors</h3>
            <div className="space-y-3">
              {doctors.filter((doc) => doc.is_active).map((doc) => (
                <div key={doc.id} className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-900">{doc.full_name || doc.email}</p>
                    <p className="text-[10px] text-slate-500">{doc.department || 'General'} · Available</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                </div>
              ))}
              {doctors.filter((doc) => doc.is_active).length === 0 && (
                <p className="text-xs text-slate-500">No active doctors.</p>
              )}
            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}
