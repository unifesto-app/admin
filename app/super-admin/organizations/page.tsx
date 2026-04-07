'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import { useToast } from '../components/ToastProvider';
import { orgsApi, ApiResponse } from '@/lib/api';

interface Org { id: string; name: string; status: string; created_at: string; profiles?: { full_name: string; email: string }; }

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-600',
  suspended: 'bg-red-50 text-red-500',
  pending: 'bg-yellow-50 text-yellow-600',
};

export default function OrganizationsPage() {
  const { showToast } = useToast();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await orgsApi.list(params) as ApiResponse<Org[]>;
      setOrgs(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!newName || !newOwner) return;
    setSaving(true);
    try {
      await orgsApi.create({ name: newName, owner_id: newOwner });
      setShowAdd(false); setNewName(''); setNewOwner(''); load();
      showToast('Organization created', 'success');
    } catch { showToast('Failed to create organization', 'error'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try { await orgsApi.update(id, { status: newStatus }); load(); showToast('Organization updated', 'success'); }
    catch { showToast('Failed to update organization', 'error'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Organizations</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage all organizations and their event portfolios.</p>
        </div>
        <BrandButton onClick={() => setShowAdd(!showAdd)}>+ Add Organization</BrandButton>
      </div>

      {showAdd && (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-black">New Organization</h2>
          <div className="flex gap-3 flex-wrap items-end">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Name</label>
              <BrandInput type="text" placeholder="Organization name" className="w-56" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Owner User ID</label>
              <BrandInput type="text" placeholder="User UUID" className="w-64" value={newOwner} onChange={e => setNewOwner(e.target.value)} />
            </div>
            <BrandButton onClick={handleAdd} disabled={saving}>{saving ? 'Saving...' : 'Create'}</BrandButton>
            <BrandButton variant="outline" onClick={() => setShowAdd(false)}>Cancel</BrandButton>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput type="text" placeholder="Search organizations..." className="w-64"
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <BrandSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending Verification</option>
        </BrandSelect>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Organization', 'Owner', 'Status', 'Created', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : orgs.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>⬡</div>
                  <p className="text-sm font-medium text-zinc-500">No organizations yet</p>
                  <p className="text-xs text-zinc-400">Organizations will appear here once they register on the platform.</p>
                </div>
              </td></tr>
            ) : orgs.map(org => (
              <tr key={org.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-medium text-zinc-900">{org.name}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{org.profiles?.full_name ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[org.status] ?? 'bg-zinc-100 text-zinc-500'}`}>{org.status}</span>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3 flex gap-2">
                  {org.status !== 'active' && (
                    <button onClick={() => handleStatusChange(org.id, 'active')} className="text-xs text-green-500 hover:text-green-700 transition-colors">Activate</button>
                  )}
                  {org.status !== 'suspended' && (
                    <button onClick={() => handleStatusChange(org.id, 'suspended')} className="text-xs text-red-400 hover:text-red-600 transition-colors">Suspend</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {orgs.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Previous</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
