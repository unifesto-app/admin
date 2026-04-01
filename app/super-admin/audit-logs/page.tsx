'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import { adminApi, ApiResponse } from '../lib/api';

interface AuditLog { id: string; action: string; module: string; actor?: string; resource_id?: string; ip_address?: string; created_at: string; }

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [module, setModule] = useState('');
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (action) params.action = action;
      if (module) params.module = module;
      const res = await adminApi.get('audit-logs', params) as ApiResponse<AuditLog[]>;
      setLogs(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally { setLoading(false); }
  }, [page, action, module]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Audit Logs</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Full history of all admin and system-level actions.</p>
        </div>
        <BrandButton variant="outline">Export Logs</BrandButton>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput type="text" placeholder="Search by user, action, or resource..." className="w-80" />
        <BrandSelect value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
        </BrandSelect>
        <BrandSelect value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }}>
          <option value="">All Modules</option>
          <option value="users">Users</option>
          <option value="events">Events</option>
          <option value="organizations">Organizations</option>
          <option value="finance">Finance</option>
          <option value="settings">Settings</option>
        </BrandSelect>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Timestamp', 'Actor', 'Action', 'Module', 'Resource ID', 'IP Address'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>▤</div>
                    <p className="text-sm font-medium text-zinc-500">No audit logs yet</p>
                    <p className="text-xs text-zinc-400">All admin actions will be recorded here automatically.</p>
                  </div>
                </td>
              </tr>
            ) : logs.map((l) => (
              <tr key={l.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 text-zinc-400 text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                <td className="px-5 py-3 text-zinc-600 text-xs">{l.actor ?? '—'}</td>
                <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">{l.action}</span></td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{l.module}</td>
                <td className="px-5 py-3 font-mono text-xs text-zinc-400">{l.resource_id ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{l.ip_address ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {logs.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Previous</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
