'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { financeApi, ApiResponse } from '@/lib/api';

interface Payout {
  id: string;
  amount: number;
  status: string;
  method?: string;
  recipient?: string;
  recipient_name?: string;
  created_at: string;
  processed_at?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-700',
  on_hold: 'bg-zinc-100 text-zinc-600',
};

export default function PayoutsPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Payout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newMethod, setNewMethod] = useState('bank_transfer');
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (status) params.status = status;
      const res = await financeApi.list('payouts', params) as ApiResponse<Payout[]>;
      setRows(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load payouts');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      row.id.toLowerCase().includes(q)
      || (row.recipient_name ?? row.recipient ?? '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const createPayout = async () => {
    if (!newRecipient.trim()) {
      showToast('Recipient is required', 'error');
      return;
    }
    const amount = Number(newAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    setSaving(true);
    try {
      await financeApi.create('payouts', {
        recipient: newRecipient.trim(),
        amount: Math.round(amount * 100),
        method: newMethod,
        status: 'pending',
      });
      setShowCreate(false);
      setNewRecipient('');
      setNewAmount('');
      setNewMethod('bank_transfer');
      await load();
      showToast('Payout created', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create payout', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, nextStatus: string) => {
    try {
      await financeApi.updateStatus('payouts', id, nextStatus);
      await load();
      showToast('Payout updated', 'success');
    } catch {
      showToast('Failed to update payout', 'error');
    }
  };

  const summary = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending').length;
    const completedThisMonth = rows.filter((r) => {
      if (r.status !== 'completed') return false;
      const d = new Date(r.processed_at ?? r.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const totalPaidOut = rows.filter((r) => r.status === 'completed').reduce((sum, row) => sum + (row.amount ?? 0), 0);
    const onHold = rows.filter((r) => r.status === 'on_hold').length;
    return { pending, completedThisMonth, totalPaidOut, onHold };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Payouts</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage and process payouts to organizers and organizations.</p>
        </div>
        <BrandButton onClick={() => setShowCreate(true)}>Process Payout</BrandButton>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Pending Payouts</p>
          <p className="text-xl font-semibold text-black">{summary.pending}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Processed This Month</p>
          <p className="text-xl font-semibold text-black">{summary.completedThisMonth}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Total Paid Out</p>
          <p className="text-xl font-semibold text-black">₹{(summary.totalPaidOut / 100).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">On Hold</p>
          <p className="text-xl font-semibold text-black">{summary.onHold}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput
          type="text"
          placeholder="Search by recipient or payout ID..."
          className="w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <BrandSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="on_hold">On Hold</option>
        </BrandSelect>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Payout ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Recipient</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Method</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Requested</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Processed</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg">◐</div>
                    <p className="text-sm font-medium text-zinc-500">No payouts yet</p>
                    <p className="text-xs text-zinc-400">Payout requests will appear here once organizers request withdrawals.</p>
                  </div>
                </td>
              </tr>
            ) : filteredRows.map((row) => (
              <tr key={row.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-zinc-600">{row.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-5 py-3 text-zinc-700">{row.recipient_name ?? row.recipient ?? '—'}</td>
                <td className="px-5 py-3 font-medium text-zinc-900">₹{((row.amount ?? 0) / 100).toLocaleString()}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{row.method ?? '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[row.status] ?? 'bg-zinc-100 text-zinc-600'}`}>{row.status}</span>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{row.processed_at ? new Date(row.processed_at).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3 flex gap-2">
                  {row.status !== 'completed' && <button onClick={() => updateStatus(row.id, 'completed')} className="text-xs text-green-600 hover:text-green-700">Complete</button>}
                  {row.status !== 'on_hold' && <button onClick={() => updateStatus(row.id, 'on_hold')} className="text-xs text-zinc-500 hover:text-zinc-700">Hold</button>}
                  {row.status !== 'failed' && <button onClick={() => updateStatus(row.id, 'failed')} className="text-xs text-red-500 hover:text-red-700">Fail</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {filteredRows.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Previous</button>
          <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>

      <Modal
        open={showCreate}
        title="Process Payout"
        confirmLabel="Create Payout"
        busy={saving}
        onConfirm={createPayout}
        onCancel={() => {
          if (saving) return;
          setShowCreate(false);
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Recipient</label>
            <BrandInput type="text" value={newRecipient} onChange={(e) => setNewRecipient(e.target.value)} placeholder="Organizer / Organization" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Amount (INR)</label>
            <BrandInput type="number" min="1" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="1000" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Method</label>
            <BrandSelect value={newMethod} onChange={(e) => setNewMethod(e.target.value)}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="paypal">PayPal</option>
            </BrandSelect>
          </div>
        </div>
      </Modal>
    </div>
  );
}
