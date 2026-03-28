import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

type Patient = {
  id: number;
  full_name: string;
  dob: string;
  gender: string;
  phone: string | null;
  national_id: string | null;
  last_visit: string | null;
  insurance_status?: string | null;
  is_active?: boolean;
};

type PatientResponse = {
  data: Patient[];
  total: number;
  page: number;
  totalPages: number;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
};

export default function PatientDirectory() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastVisitFrom, setLastVisitFrom] = useState('');
  const [lastVisitTo, setLastVisitTo] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('search', search);
      params.set('page', String(page));
      params.set('limit', '10');
      params.set('includeInactive', 'true');
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (insuranceFilter !== 'all') params.set('insuranceStatus', insuranceFilter);
      if (lastVisitFrom) params.set('lastVisitFrom', lastVisitFrom);
      if (lastVisitTo) params.set('lastVisitTo', lastVisitTo);
      const result = await apiFetch<PatientResponse>(`/api/patients?${params.toString()}`);
      setPatients(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [page, search, statusFilter, lastVisitFrom, lastVisitTo, insuranceFilter]);

  const toggleStatus = async (patient: Patient) => {
    const next = patient.is_active === false;
    try {
      await apiFetch(`/api/patients/${patient.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: next }),
      });
      await loadPatients();
    } catch (err: any) {
      setError(err?.message || 'Failed to update patient status');
    }
  };

  return (
    <Layout activeTab="patients" title="Patient Directory">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm placeholder:text-slate-500"
                placeholder="Search by name or ID..."
                type="text"
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm"
              value={insuranceFilter}
              onChange={(e) => setInsuranceFilter(e.target.value)}
            >
              <option value="all">All Insurance</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
            <input
              className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm"
              type="date"
              value={lastVisitFrom}
              onChange={(e) => setLastVisitFrom(e.target.value)}
            />
          </div>
          <Link to="/intake" className="w-full md:w-auto px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">person_add</span>
            Register New Patient
          </Link>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          {error && <p className="px-6 py-4 text-xs text-error font-semibold">{error}</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-[10px] font-bold tracking-widest text-slate-500">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">National ID</th>
                  <th className="px-6 py-4">Last Visit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-green-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/patient/${patient.id}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-sm font-bold text-primary">
                          {getInitials(patient.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-900 group-hover:text-primary transition-colors">{patient.full_name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{patient.gender}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{patient.national_id || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded tracking-tighter ${patient.is_active === false ? 'bg-error/10 text-error' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {patient.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/patient/${patient.id}`} className="p-2 hover:bg-primary-fixed/20 rounded-lg transition-colors text-primary">
                          <span className="material-symbols-outlined text-lg">visibility</span>
                        </Link>
                        <button
                          className="p-2 hover:bg-primary-fixed/20 rounded-lg transition-colors text-slate-600"
                          onClick={() => toggleStatus(patient)}
                        >
                          <span className="material-symbols-outlined text-lg">{patient.is_active === false ? 'toggle_on' : 'toggle_off'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && patients.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-slate-500" colSpan={5}>
                      No patients found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/30 flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">Showing {patients.length} of {total} patients</p>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button className="p-2 hover:bg-white rounded-lg transition-colors disabled:opacity-30" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
