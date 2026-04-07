'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { financeApi, ApiResponse } from '@/lib/api';

interface Invoice { id: string; status: string; amount: number; due_date?: string; created_at: string; }

const statusColors: Record<string, string> = {
  paid: 'bg-green-50 text-green-600',
  unpaid: 'bg-yellow-50 text-yellow-600',
  overdue: 'bg-red-50 text-red-500',
  void: 'bg-zinc-100 text-zinc-400',
};

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (status) params.status = status;
      const res = await financeApi.list('invoices', params) as ApiResponse<Invoice[]>;
      setRows(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    if (rows.length === 0) {
      showToast('No invoices to export', 'info');
      return;
    }

    const header = ['id', 'amount', 'due_date', 'status', 'created_at'];
    const lines = rows.map((inv) => [inv.id, String(inv.amount), inv.due_date ?? '', inv.status, inv.created_at]);
    const csv = [header, ...lines].map((line) => line.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateInvoice = async () => {
    const amount = Number(newAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }

    setSaving(true);
    try {
      await financeApi.create('invoices', {
        amount: Math.round(amount * 100),
        status: 'unpaid',
        due_date: newDueDate || undefined,
      });
      setShowCreateModal(false);
      setNewAmount('');
      setNewDueDate('');
      await load();
      showToast('Invoice created', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Failed to create invoice', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await financeApi.updateStatus('invoices', id, newStatus);
      await load();
      showToast('Invoice updated', 'success');
    }
    catch {
      showToast('Failed to update invoice', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Invoices</h1>
          <p className="text-sm text-zinc-400 mt-0.5">View and manage all invoices issued on the platform.</p>
        </div>
        <div className="flex gap-2">
          <BrandButton variant="outline" onClick={handleExport}>Export</BrandButton>
          <BrandButton onClick={() => setShowCreateModal(true)}>+ Create Invoice</BrandButton>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput type="text" placeholder="Search by invoice number or org..." className="w-72" />
        <BrandSelect value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
          <option value="void">Void</option>
        </BrandSelect>
        <BrandInput type="date" />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Invoice #', 'Amount', 'Due Date', 'Status', 'Issued On', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>▤</div>
                  <p className="text-sm font-medium text-zinc-500">No invoices yet</p>
                  <p className="text-xs text-zinc-400">Invoices will appear here once they are created or generated.</p>
                </div>
              </td></tr>
            ) : rows.map(inv => (
              <tr key={inv.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-zinc-600">{inv.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-5 py-3 font-medium text-zinc-900">₹{(inv.amount / 100).toLocaleString()}</td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[inv.status] ?? 'bg-zinc-100 text-zinc-500'}`}>{inv.status}</span>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 flex gap-2">
                  {inv.status === 'unpaid' && <button onClick={() => updateStatus(inv.id, 'paid')} className="text-xs text-green-500 hover:text-green-700 transition-colors">Mark Paid</button>}
                  {inv.status !== 'void' && <button onClick={() => updateStatus(inv.id, 'void')} className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors">Void</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {rows.length} of {total} results</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Previous</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40">Next</button>
        </div>
      </div>

      <Modal
        open={showCreateModal}
        title="Create Invoice"
        confirmLabel="Create Invoice"
        busy={saving}
        onConfirm={handleCreateInvoice}
        onCancel={() => {
          if (saving) return;
          setShowCreateModal(false);
        }}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Amount (INR)</label>
            <BrandInput type="number" min="1" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="1999" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Due Date (optional)</label>
            <BrandInput type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
