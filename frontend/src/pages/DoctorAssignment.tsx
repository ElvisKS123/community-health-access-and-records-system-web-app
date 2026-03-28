import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';

type Patient = {
  id: number;
  full_name: string;
};

type Doctor = {
  id: number;
  full_name?: string | null;
  email: string;
  department?: string | null;
};

type Assignment = {
  id: number;
  patient_id: number;
  doctor_id: number;
  status: string;
  patient_name?: string;
  doctor_email?: string | null;
  doctor_name?: string | null;
  doctor_department?: string | null;
  notes?: string | null;
};

export default function DoctorAssignment() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientsRes, doctorsRes, assignmentsRes] = await Promise.all([
        apiFetch<{ data: Patient[] }>('/api/patients?limit=50&page=1'),
        apiFetch<Doctor[]>('/api/doctors'),
        apiFetch<Assignment[]>('/api/assignments'),
      ]);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes);
      setAssignments(assignmentsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const unassignedPatients = useMemo(() => {
    const assignedSet = new Set(assignments.map((a) => Number(a.patient_id)));
    return patients.filter((p) => !assignedSet.has(p.id));
  }, [patients, assignments]);

  const handleAssign = async () => {
    if (!selectedPatient || !selectedDoctor) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient,
          doctorId: selectedDoctor,
        }),
      });
      setSelectedPatient('');
      setSelectedDoctor('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to assign doctor');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (assignmentId: number, doctorId: string) => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/assignments/${assignmentId}/reassign`, {
        method: 'PUT',
        body: JSON.stringify({ doctorId }),
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to reassign');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (assignmentId: number) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/assignments/${assignmentId}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to unassign');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (assignmentId: number, status: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/assignments/${assignmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteUpdate = async (assignment: Assignment) => {
    const note = window.prompt('Update assignment note:', assignment.notes || '');
    if (note === null) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/assignments/${assignment.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: assignment.status, notes: note }),
      });
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const term = search.toLowerCase();
    return (
      a.patient_name?.toLowerCase().includes(term) ||
      a.doctor_email?.toLowerCase().includes(term) ||
      a.status.toLowerCase().includes(term)
    );
  });

  return (
    <Layout activeTab="assignment" title="Doctor Assignment">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
            <h3 className="font-bold text-green-900 mb-6 font-headline">Unassigned Patients</h3>
            <div className="space-y-4">
              {unassignedPatients.map((patient) => (
                <div key={patient.id} className="p-4 bg-surface-container-low rounded-xl border-l-4 border-primary flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-green-900">{patient.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Awaiting assignment</p>
                  </div>
                </div>
              ))}
              {unassignedPatients.length === 0 && (
                <p className="text-xs text-slate-500">All patients are assigned.</p>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-green-900 font-headline">Assign Patient to Doctor</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
              >
                <option value="">Select patient</option>
                {unassignedPatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </select>
              <select
                className="px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm outline-none"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                <option value="">Select doctor</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.full_name || 'Unknown Doctor'}
                  </option>
                ))}
              </select>
              {selectedDoctor && (
                <p className="text-[10px] text-slate-500 md:col-span-3">
                  Department:{' '}
                  {doctors.find((d) => String(d.id) === String(selectedDoctor))?.department || 'General'}
                </p>
              )}
              <button
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/10 hover:bg-primary-container transition-all disabled:opacity-60"
                onClick={handleAssign}
                disabled={loading || !selectedPatient || !selectedDoctor}
              >
                Assign
              </button>
              {error && <p className="text-xs text-error font-semibold md:col-span-3">{error}</p>}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-green-900 font-headline">Current Assignments</h3>
              <input
                className="px-4 py-2 bg-surface-container-low rounded-xl text-sm outline-none"
                placeholder="Search by patient/doctor/status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[10px] font-bold tracking-widest text-slate-500">
                    <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Doctor</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-green-900 font-semibold">{assignment.patient_name || `#${assignment.patient_id}`}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{assignment.doctor_name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{assignment.doctor_department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded tracking-tighter">
                          {assignment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2 items-center">
                          <select
                            className="px-2 py-1 bg-surface-container-low rounded-lg text-xs"
                            defaultValue=""
                            onChange={(e) => handleReassign(assignment.id, e.target.value)}
                          >
                            <option value="">Reassign</option>
                            {doctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>{doc.email}</option>
                            ))}
                          </select>
                          <select
                            className="px-2 py-1 bg-surface-container-low rounded-lg text-xs"
                            value={assignment.status}
                            onChange={(e) => handleStatusUpdate(assignment.id, e.target.value)}
                          >
                            <option value="assigned">assigned</option>
                            <option value="in_progress">in_progress</option>
                            <option value="completed">completed</option>
                          </select>
                          <button
                            className="text-xs text-slate-600 font-bold hover:underline"
                            onClick={() => handleNoteUpdate(assignment)}
                          >
                            Notes
                          </button>
                          <button
                            className="text-xs text-error font-bold hover:underline"
                            onClick={() => {
                              if (window.confirm('Unassign this patient?')) {
                                handleUnassign(assignment.id);
                              }
                            }}
                          >
                            Unassign
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!loading && filteredAssignments.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-slate-500" colSpan={5}>
                        No assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
