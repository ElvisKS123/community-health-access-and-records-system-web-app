import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { useAuth } from '../lib/auth';
import { apiFetch } from '../lib/api';

export default function Settings() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout activeTab="settings" title="Settings">
      <div className="max-w-4xl mx-auto space-y-8">
        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
          <h3 className="font-bold text-green-900 mb-4 font-headline">Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 bg-surface-container-low rounded-xl">
              <p className="text-[10px] font-bold tracking-widest text-slate-500 mb-1">EMAIL</p>
              <p className="font-semibold text-green-900">{user?.email || '-'}</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <p className="text-[10px] font-bold tracking-widest text-slate-500 mb-1">NAME</p>
              <p className="font-semibold text-green-900">{user?.fullName || '-'}</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <p className="text-[10px] font-bold tracking-widest text-slate-500 mb-1">ROLE</p>
              <p className="font-semibold text-green-900">{user?.role?.toUpperCase() || '-'}</p>
            </div>
            <div className="p-4 bg-surface-container-low rounded-xl">
              <p className="text-[10px] font-bold tracking-widest text-slate-500 mb-1">DEPARTMENT</p>
              <p className="font-semibold text-green-900">{user?.department || '-'}</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
          <h3 className="font-bold text-green-900 mb-4 font-headline">Change Password</h3>
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">Current Password</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">New Password</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant tracking-wider block">Confirm New Password</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all outline-none"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-xs text-error font-semibold">{error}</p>}
            {success && <p className="text-xs text-primary font-semibold">{success}</p>}
            <button
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-primary/10 hover:bg-primary-container active:scale-95 transition-all"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 p-6">
          <h3 className="font-bold text-green-900 mb-4 font-headline">Session</h3>
          <button
            className="px-4 py-3 bg-surface-container-low rounded-xl text-sm font-bold text-green-900 hover:bg-primary-fixed/20 transition-all"
            onClick={() => logout()}
          >
            Log Out
          </button>
        </section>
      </div>
    </Layout>
  );
}
