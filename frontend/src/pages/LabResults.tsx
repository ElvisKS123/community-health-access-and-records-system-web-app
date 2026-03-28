import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';

type LabResult = {
  id: number;
  patient_id: number;
  patient_name?: string;
  test_type: string;
  status: string;
  result: string | null;
  ordered_at: string;
};

type Patient = {
  id: number;
  full_name: string;
};

export default function LabResults() {
  const [results, setResults] = useState<LabResult[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({
    patientId: '',
    testType: '',
    status: 'Ordered',
    result: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LabResult | null>(null);
  const [updateForm, setUpdateForm] = useState({
    status: 'Ordered',
    result: '',
  });

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [resultsRes, patientsRes] = await Promise.all([
        apiFetch<LabResult[]>('/api/lab-results'),
        apiFetch<{ data: Patient[] }>('/api/patients?limit=50&page=1'),
      ]);
      setResults(resultsRes);
      setPatients(patientsRes.data);
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load lab results');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (form.status === 'Completed' && !form.result.trim()) {
      setSubmitError('Result is required when status is Completed.');
      return;
    }
    try {
      await apiFetch('/api/lab-results', {
        method: 'POST',
        body: JSON.stringify({
          patientId: form.patientId,
          testType: form.testType,
          status: form.status,
          result: form.result || null,
        }),
      });
      setForm({ patientId: '', testType: '', status: 'Ordered', result: '' });
      await loadData();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to create lab request');
    }
  };

  const beginEdit = (row: LabResult) => {
    setSelected(row);
    setUpdateError(null);
    setUpdateForm({
      status: row.status,
      result: row.result || '',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setUpdateError(null);
    if (updateForm.status === 'Completed' && !updateForm.result.trim()) {
      setUpdateError('Result is required when status is Completed.');
      return;
    }
    try {
      await apiFetch(`/api/lab-results/${selected.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: updateForm.status,
          result: updateForm.result || null,
        }),
      });
      setSelected(null);
      await loadData();
    } catch (err: any) {
      setUpdateError(err?.message || 'Failed to update lab result');
    }
  };

  const filteredResults = results.filter((row) => {
    const term = search.toLowerCase();
    const matchesTerm =
      row.patient_name?.toLowerCase().includes(term) ||
      row.test_type.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || row.status === statusFilter;
    const orderedDate = new Date(row.ordered_at);
    const matchesFrom = dateFrom ? orderedDate >= new Date(dateFrom) : true;
    const matchesTo = dateTo ? orderedDate <= new Date(dateTo + 'T23:59:59') : true;
    return (
      matchesTerm &&
      matchesStatus &&
      matchesFrom &&
      matchesTo
    );
  });

  return (
    <Layout activeTab="lab" title="Laboratory Results">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all text-sm placeholder:text-slate-500"
                placeholder="Search by patient or test type..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Ordered">Ordered</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
            </select>
            <input
              className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <input
              className="px-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm outline-none"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
          <h3 className="font-bold text-green-900 mb-4 font-headline">New Lab Request</h3>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleSubmit}>
            <select
              className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              required
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
            <input
              className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
              placeholder="Test type"
              value={form.testType}
              onChange={(e) => setForm({ ...form, testType: e.target.value })}
              required
            />
            <input
              className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
              placeholder="Result (optional)"
              value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
            />
            <select
              className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option>Ordered</option>
              <option>Processing</option>
              <option>Completed</option>
            </select>
            <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:bg-primary-container transition-all">
              Create Request
            </button>
          </form>
          {submitError && <p className="mt-3 text-xs text-error font-semibold">{submitError}</p>}
        </section>

        {selected && (
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-green-900 font-headline">Update Lab Result</h3>
              <button
                className="text-xs text-slate-500 hover:underline"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
            <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={handleUpdate}>
              <select
                className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
              >
                <option>Ordered</option>
                <option>Processing</option>
                <option>Completed</option>
              </select>
              <input
                className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
                placeholder="Result"
                value={updateForm.result}
                onChange={(e) => setUpdateForm({ ...updateForm, result: e.target.value })}
              />
              <button className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:bg-primary-container transition-all">
                Save Update
              </button>
            </form>
            {updateError && <p className="mt-3 text-xs text-error font-semibold">{updateError}</p>}
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-[10px] font-bold tracking-widest text-slate-500">
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Test Type</th>
                  <th className="px-6 py-4">Date Ordered</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Result</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredResults.map((row) => (
                  <tr key={row.id} className="hover:bg-green-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm text-green-900 font-semibold">
                      {row.patient_name ? (
                        <Link className="hover:underline" to={`/patient/${row.patient_id}`}>{row.patient_name}</Link>
                      ) : (
                        `#${row.patient_id}`
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.test_type}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(row.ordered_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded tracking-tighter">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{row.result || 'Pending'}</td>
                    <td className="px-6 py-4 text-xs">
                      <button
                        className="text-primary font-bold hover:underline"
                        onClick={() => beginEdit(row)}
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredResults.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-slate-500" colSpan={6}>
                      No lab results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && <p className="px-6 py-4 text-xs text-slate-500">Loading lab results...</p>}
          {loadError && <p className="px-6 pb-4 text-xs text-error font-semibold">{loadError}</p>}
        </section>
      </div>
    </Layout>
  );
}
