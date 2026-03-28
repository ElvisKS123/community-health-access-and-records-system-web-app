import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { apiFetch } from '../lib/api';

type User = {
  id: number;
  full_name?: string | null;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  department?: string | null;
  is_active?: boolean;
  created_at?: string;
};

export default function UserManagement() {
  const { user } = useAuth();
  const isReceptionist = user?.role === 'receptionist';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'receptionist', department: '' });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch<User[]>('/api/users');
      setUsers(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          role: isReceptionist ? 'receptionist' : form.role,
          department: form.department || undefined,
        }),
      });
      setForm({ fullName: '', email: '', password: '', role: 'receptionist', department: '' });
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId: number, role: User['role']) => {
    setError(null);
    try {
      await apiFetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update role');
    }
  };

  const handleStatusToggle = async (userId: number, isActive: boolean) => {
    setError(null);
    try {
      await apiFetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
      await fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (userId: number) => {
    const password = window.prompt('Enter a new temporary password (min 6 chars):');
    if (!password) return;
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError(null);
    try {
      await apiFetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      alert('Password reset successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this account? This action cannot be undone.')) return;
    setError(null);
    try {
      await apiFetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      await fetchUsers();
      alert('User deleted successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete user');
    }
  };

  return (
    <Layout activeTab="users" title="User Management" userRole="System Administrator" userName="Admin User">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
          <h3 className="font-bold text-green-900 mb-4 font-headline">Create New User</h3>
          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">Full Name</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">Email</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">Password</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            {!isReceptionist && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">Role</label>
                <select
                  className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="receptionist">Receptionist</option>
                  <option value="doctor">Doctor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">Department</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                type="text"
                placeholder="e.g. General, Pediatrics"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
            {error && <p className="text-xs text-error font-semibold">{error}</p>}
            <button className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all">
              Create User
            </button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
          <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
            <h3 className="font-bold text-green-900 font-headline">Users</h3>
            {loading && <span className="text-xs text-slate-500">Loading...</span>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100/80 border-b border-outline-variant/30 text-xs font-bold tracking-wider text-slate-700">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-green-900 font-semibold">{user.full_name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-green-900 font-semibold">{user.email}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600 uppercase tracking-widest">
                      {user.role}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {(() => {
                        const isActive = user.is_active !== false;
                        return (
                      <button
                        className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                          isActive ? 'bg-green-100 text-green-700' : 'bg-error/10 text-error'
                        }`}
                        onClick={() => handleStatusToggle(user.id, !isActive)}
                      >
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 text-xs space-x-2 flex items-center h-full">
                      <button
                        className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                        onClick={() => handleResetPassword(user.id)}
                        title="Reset Password"
                      >
                        <span className="material-symbols-outlined text-lg">lock_reset</span>
                      </button>
                      
                      {(() => {
                        const isActive = user.is_active !== false;
                        return (
                          <button
                            className={`p-2 rounded-lg transition-colors ${
                              isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                            }`}
                            onClick={() => handleStatusToggle(user.id, !isActive)}
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {isActive ? 'person_off' : 'person_check'}
                            </span>
                          </button>
                        );
                      })()}

                      <button
                        className="p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                        onClick={() => handleDelete(user.id)}
                        title="Delete Account"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && users.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-sm text-slate-500" colSpan={7}>
                      No users found.
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
