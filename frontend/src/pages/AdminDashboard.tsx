import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';
import { Link } from 'react-router-dom';

type User = {
  id: number;
  email: string;
  role: string;
  created_at: string;
};

type AuditLog = {
  id: number;
  action: string;
  table_name: string;
  record_id: number;
  created_at: string;
  user_email?: string;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, logsRes] = await Promise.all([
          apiFetch<User[]>('/api/users'),
          apiFetch<AuditLog[]>('/api/audit-logs'),
        ]);
        setUsers(usersRes.slice(0, 5));
        setLogs(logsRes.slice(0, 5));
      } catch {
        // Silent fallback
      }
    };
    load();
  }, []);

  return (
    <Layout activeTab="admin" title="IT & System Administration" userRole="System Administrator" userName="Admin User">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
              <h3 className="font-bold text-green-900 font-headline">User Management</h3>
              <Link to="/admin/users" className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg tracking-widest hover:bg-primary-container transition-all">Manage Users</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low text-[10px] font-bold tracking-widest text-slate-500">
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-green-900">{user.email}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-600 tracking-tighter">{user.role}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{new Date(user.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-sm text-slate-500" colSpan={3}>
                        No users found.
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
            <h3 className="font-bold text-green-900 mb-6 font-headline">Audit Logs</h3>
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex gap-4">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-xs font-bold text-green-900">{log.action}</p>
                    <p className="text-[10px] text-slate-500">{log.table_name} #{log.record_id}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p className="text-xs text-slate-500">No logs yet.</p>}
            </div>
            <Link to="/admin/logs" className="w-full mt-6 py-2 text-xs font-bold text-primary border border-primary/20 rounded-lg hover:bg-primary/5 transition-all tracking-widest block text-center">
              View Full Logs
            </Link>
          </section>
        </div>
      </div>
    </Layout>
  );
}
