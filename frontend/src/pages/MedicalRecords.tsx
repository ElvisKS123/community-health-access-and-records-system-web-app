import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';

type RecordItem = {
  id: number;
  patient_id: number;
  patient_name?: string;
  date: string;
  diagnosis: string | null;
  treatment: string | null;
  notes: string | null;
  doctor_name: string | null;
};

const formatDate = (value: string) => new Date(value).toLocaleDateString();

export default function MedicalRecords() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<RecordItem | null>(null);

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

  const doctorOptions = useMemo(() => {
    const names = records
      .map((record) => record.doctor_name)
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set<string>(names)).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        !term ||
        record.patient_name?.toLowerCase().includes(term) ||
        record.diagnosis?.toLowerCase().includes(term) ||
        record.treatment?.toLowerCase().includes(term) ||
        record.notes?.toLowerCase().includes(term) ||
        record.doctor_name?.toLowerCase().includes(term);

      const matchesDoctor =
        doctorFilter === 'all' || (record.doctor_name || 'Unknown').toLowerCase() === doctorFilter.toLowerCase();

      return matchesSearch && matchesDoctor;
    });
  }, [records, search, doctorFilter]);

  return (
    <Layout activeTab="records" title="Medical Records History">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant/30 bg-surface-container-low flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-green-900 font-headline text-lg">Clinical Records</h3>
              <p className="text-xs text-slate-500 font-medium">
                Review diagnoses, treatments, and notes for patients in your care.
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              {filteredRecords.length} Visible Records
            </span>
          </div>

          <div className="px-6 py-5 border-b border-outline-variant/20 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-4">
            <input
              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search by patient, diagnosis, treatment, notes, or doctor"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
            >
              <option value="all">All doctors</option>
              {doctorOptions.map((doctor) => (
                <option key={doctor} value={doctor}>
                  {doctor}
                </option>
              ))}
            </select>
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
                  <th className="px-6 py-4">TREATMENT</th>
                  <th className="px-6 py-4">DATE</th>
                  <th className="px-6 py-4">DOCTOR</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="text-xs text-slate-400 font-medium">Fetching history...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-green-50/50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-green-900 font-bold">
                        <Link to={`/patient/${record.patient_id}`} className="hover:underline">
                          {record.patient_name || `Patient #${record.patient_id}`}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        <span className="px-2 py-0.5 rounded bg-slate-100 group-hover:bg-white transition-colors">
                          {record.diagnosis || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                        <p className="truncate">{record.treatment || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">{formatDate(record.date)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary font-bold">
                            {record.doctor_name ? record.doctor_name[0] : 'D'}
                          </div>
                          {record.doctor_name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-4">
                          <button
                            type="button"
                            className="text-[10px] font-bold text-primary hover:underline hover:text-primary-container transition-all tracking-widest"
                            onClick={() => setSelectedRecord(record)}
                          >
                            VIEW FULL
                          </button>
                          <Link
                            to={`/patient/${record.patient_id}`}
                            className="text-[10px] font-bold text-slate-600 hover:underline transition-all tracking-widest"
                          >
                            OPEN PATIENT
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
                {!loading && filteredRecords.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center" colSpan={6}>
                      <div className="flex flex-col items-center opacity-50">
                        <span className="material-symbols-outlined text-4xl mb-2">history</span>
                        <p className="text-sm font-medium">
                          {records.length === 0 ? 'No medical records found yet.' : 'No records match your filters.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-green-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-8 py-6 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-green-900 font-headline">Record Details</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedRecord.patient_name || `Patient #${selectedRecord.patient_id}`} on {formatDate(selectedRecord.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">DIAGNOSIS</p>
                  <p className="font-semibold text-green-900">{selectedRecord.diagnosis || '-'}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-1">DOCTOR</p>
                  <p className="font-semibold text-green-900">{selectedRecord.doctor_name || '-'}</p>
                </div>
              </div>

              <div className="p-5 bg-surface-container-low rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">TREATMENT</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedRecord.treatment || 'No treatment recorded.'}</p>
              </div>

              <div className="p-5 bg-surface-container-low rounded-2xl">
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mb-2">CLINICAL NOTES</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedRecord.notes || 'No clinical notes recorded.'}</p>
              </div>

              <div className="flex justify-end">
                <Link
                  to={`/patient/${selectedRecord.patient_id}`}
                  className="px-5 py-3 rounded-xl bg-primary text-white text-xs font-bold tracking-widest shadow-sm hover:bg-primary-container transition-all"
                >
                  OPEN FULL PATIENT PROFILE
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
