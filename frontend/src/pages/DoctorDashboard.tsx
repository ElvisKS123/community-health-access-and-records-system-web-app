import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { Link } from 'react-router-dom';
import { apiFetch } from '../lib/api';

type RecordItem = {
  id: number;
  patient_name: string;
  diagnosis: string | null;
  date: string;
};

type Assignment = {
  id: number;
  patient_id: number;
  patient_name: string;
  status: string;
  assigned_at: string;
  notes?: string | null;
};

export default function DoctorDashboard() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recordsRes, assignmentsRes] = await Promise.all([
          apiFetch<RecordItem[]>('/api/records'),
          apiFetch<Assignment[]>('/api/doctor/assignments')
        ]);
        setRecords(recordsRes.slice(0, 5));
        setAssignments(assignmentsRes);
      } catch (err) {
        setError('Failed to load doctor dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visibleAssignments = assignments.filter((assignment) => assignment.status !== 'completed');

  const updateAssignment = async (id: number, status: string) => {
    setUpdatingId(id);
    setError(null);
    try {
      const notes = status === 'completed' ? window.prompt('Add completion notes (optional):') : undefined;
      await apiFetch(`/api/assignments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes: notes || undefined }),
      });
      if (status === 'completed') {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
      } else {
        const res = await apiFetch<Assignment[]>('/api/doctor/assignments');
        setAssignments(res);
      }
    } catch (err) {
      setError('Failed to update assignment');
    } finally {
      setUpdatingId(null);
    }
  };

  const addAssignmentNote = async (assignment: Assignment) => {
    const note = window.prompt('Add a note to this assignment:', assignment.notes || '');
    if (note === null) return;
    setUpdatingId(assignment.id);
    setError(null);
    try {
      await apiFetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: assignment.status || 'assigned', notes: note }),
      });
      const res = await apiFetch<Assignment[]>('/api/doctor/assignments');
      setAssignments(res);
    } catch (err) {
      setError('Failed to update assignment notes');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout activeTab="doctor" title="Doctor Dashboard">
      {error && <p className="mb-4 text-xs text-error font-semibold">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30">
              <h3 className="font-bold text-green-900 font-headline">Assigned Patients</h3>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : assignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleAssignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 bg-surface-container-low rounded-xl border-l-4 border-primary hover:bg-primary-fixed/20 transition-all">
                      <div className="flex justify-between items-center">
                        <Link 
                          to={`/patient/${assignment.patient_id}`}
                          className="font-bold text-green-900 hover:text-primary transition-colors"
                        >
                          {assignment.patient_name}
                        </Link>
                        <span className="px-2 py-1 text-[10px] font-bold rounded bg-secondary-container text-on-secondary-container">
                          {assignment.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">
                        Assigned at {new Date(assignment.assigned_at).toLocaleTimeString()}
                      </p>
                      {assignment.notes && (
                        <p className="text-[10px] text-slate-400 mt-1">Notes: {assignment.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        <button
                          className="px-3 py-1 text-[10px] font-bold rounded bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => updateAssignment(assignment.id, 'in_progress')}
                          disabled={updatingId === assignment.id}
                        >
                          In Progress
                        </button>
                        <button
                          className="px-3 py-1 text-[10px] font-bold rounded bg-green-100 text-green-700 hover:bg-green-200"
                          onClick={() => updateAssignment(assignment.id, 'completed')}
                          disabled={updatingId === assignment.id}
                        >
                          Complete
                        </button>
                        <button
                          className="px-3 py-1 text-[10px] font-bold rounded bg-surface-container-high text-slate-600 hover:bg-surface-container-low"
                          onClick={() => addAssignmentNote(assignment)}
                          disabled={updatingId === assignment.id}
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-20">person_off</span>
                  <p className="text-sm">No patients assigned to you currently.</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-green-900 font-headline">Recent History</h3>
              <Link to="/records" className="text-xs font-bold text-primary hover:underline tracking-widest">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[10px] font-bold tracking-widest text-slate-500">
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Diagnosis</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-green-900 font-semibold">{record.patient_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{record.diagnosis || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(record.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-slate-500" colSpan={3}>
                        No recent records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
            <h3 className="font-bold text-green-900 mb-6 font-headline">Quick Resources</h3>
            <div className="space-y-3">
              <Link to="/records" className="w-full p-4 bg-surface-container-low rounded-xl flex items-center gap-4 hover:bg-primary-fixed/20 transition-all group">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">menu_book</span>
                <span className="text-sm font-bold text-green-900">Medical Records</span>
              </Link>
              <Link to="/lab" className="w-full p-4 bg-surface-container-low rounded-xl flex items-center gap-4 hover:bg-primary-fixed/20 transition-all group">
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">lab_profile</span>
                <span className="text-sm font-bold text-green-900">Lab Results</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
