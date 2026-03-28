import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';

type Patient = {
  id: number;
  full_name: string;
};

type RecordItem = {
  id: number;
  date: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  doctor_name: string | null;
  patient_name?: string;
};

type Medication = {
  id: number;
  name: string;
  dosage: string | null;
  frequency: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  prescribed_by: string | null;
};

type Allergy = {
  id: number;
  allergen: string;
  reaction: string | null;
  severity: string | null;
  notes: string | null;
  recorded_at: string;
};

type Immunization = {
  id: number;
  vaccine: string;
  date: string;
  dose: string | null;
  notes: string | null;
};

type ProblemItem = {
  id: number;
  problem: string;
  status: string | null;
  onset_date: string | null;
  resolved_date: string | null;
  notes: string | null;
};

export default function MedicalRecords() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const recordsRes = await apiFetch<RecordItem[]>('/api/records');
      setRecords(recordsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Layout activeTab="records" title="Medical Records History">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
            <div>
              <h3 className="font-bold text-green-900 font-headline text-lg">Recent Records</h3>
              <p className="text-xs text-slate-500 font-medium">Overview of all clinical encounters across the facility.</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{records.length} Total Entries</span>
          </div>
          
          {error && (
            <div className="p-6 bg-error/10 border-b border-error/20 flex items-center gap-3">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="text-sm text-error font-medium">{error}</p>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50 text-[10px] font-bold tracking-widest text-slate-500 border-b border-outline-variant/20">
                  <th className="px-6 py-4">PATIENT</th>
                  <th className="px-6 py-4">DIAGNOSIS</th>
                  <th className="px-6 py-4">DATE</th>
                  <th className="px-6 py-4">DOCTOR</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-xs text-slate-400 font-medium">Fetching history...</p>
                      </div>
                    </td>
                  </tr>
                ) : records.map((record) => (
                  <tr key={record.id} className="hover:bg-green-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-green-900 font-bold">{record.patient_name || 'Patient'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-100 group-hover:bg-white transition-colors">{record.diagnosis || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{new Date(record.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                        {record.doctor_name ? record.doctor_name[0] : 'D'}
                      </div>
                      {record.doctor_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[10px] font-bold text-primary hover:underline hover:text-primary-container transition-all tracking-widest">
                        VIEW FULL
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && records.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={5}>
                      <div className="flex flex-col items-center opacity-40">
                        <span className="material-symbols-outlined text-4xl mb-2">history</span>
                        <p className="text-sm font-medium">No medical records found in this facility.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
