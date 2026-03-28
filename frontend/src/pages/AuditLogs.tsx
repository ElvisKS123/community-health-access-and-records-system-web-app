import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { apiFetch } from '../lib/api';

type AuditLog = {
  id: number;
  user_id: number | null;
  action: string;
  table_name: string;
  record_id: number;
  details_json: string | null;
  created_at: string;
  user_email?: string;
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<AuditLog[]>('/api/audit-logs');
        setLogs(result);
      } catch (err: any) {
        setError(err?.message || 'Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Layout activeTab="logs" title="Audit Logs" userRole="System Administrator" userName="Admin User">
      <div className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
          <h3 className="font-bold text-green-900 font-headline">Recent Activity</h3>
          {loading && <span className="text-xs text-slate-500">Loading...</span>}
        </div>
        {error && <p className="px-6 py-4 text-xs text-error font-semibold">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-low text-[10px] font-bold tracking-widest text-slate-500">
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{log.user_email || log.user_id || 'System'}</td>
                  <td className="px-6 py-4 text-xs font-bold tracking-widest text-primary">{log.action}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {log.table_name} #{log.record_id}
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-500" colSpan={4}>
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
