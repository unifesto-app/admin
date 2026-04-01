'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import { usersApi, ApiResponse } from '../lib/api';

interface User { id: string; full_name: string; email: string; role: string; status: string; created_at: string; }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (role) params.role = role;
      if (status) params.status = status;
      const res = await usersApi.list(params) as ApiResponse<User[]>;
      setUsers(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, role, status]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try { await usersApi.delete(id); load(); } catch { alert('Failed to delete user'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Users</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage all registered users and their access.</p>
        </div>
        <BrandButton>+ Add User</BrandButton>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput type="text" placeholder="Search by name or email..." className="w-64"
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <BrandSelect value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="super_admin">Admin</option>
          <option value="organizer">Organizer</option>
          <option value="attendee">Attendee</option>
        </BrandSelect>
        <BrandSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </BrandSelect>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Name', 'Email', 'Role', 'Status', 'Joined', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>◉</div>
                    <p className="text-sm font-medium text-zinc-500">No users found</p>
                    <p className="text-xs text-zinc-400">Users will appear here once they register or are added manually.</p>
                  </div>
                </td>
              </tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-medium text-zinc-900">{u.full_name || '—'}</td>
                <td className="px-5 py-3 text-zinc-600">{u.email}</td>
                <td className="px-5 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{u.role}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>{u.status}</span>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3">
                  <button onClick={() => handleDelete(u.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {users.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors disabled:opacity-40">Previous</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}
            className="px-3 py-1.5 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
