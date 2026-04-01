'use client';
import { useEffect, useState, useCallback } from 'react';
import BrandButton from '../components/BrandButton';
import { BrandInput, BrandSelect } from '../components/BrandInput';
import { financeApi, ApiResponse } from '../lib/api';

interface Transaction { id: string; status: string; amount: number; created_at: string; }

const statusColors: Record<string, string> = {
  success: 'bg-green-50 text-green-600',
  pending: 'bg-yellow-50 text-yellow-600',
  failed: 'bg-red-50 text-red-500',
  refunded: 'bg-zinc-100 text-zinc-500',
};

export default function TransactionsPage() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (status) params.status = status;
      const res = await financeApi.list('transactions', params) as ApiResponse<Transaction[]>;
      setRows(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions');
    } finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Transactions</h1>
          <p className="text-sm text-zinc-400 mt-0.5">All payment transactions across the platform.</p>
        </div>
        <BrandButton variant="outline">Export CSV</BrandButton>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <BrandInput type="text" placeholder="Search by transaction ID or user..." className="w-72" />
        <BrandSelect value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </BrandSelect>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              {['Transaction ID', 'Amount', 'Status', 'Date'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-zinc-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg" style={{ color: '#0062ff' }}>◎</div>
                    <p className="text-sm font-medium text-zinc-500">No transactions yet</p>
                    <p className="text-xs text-zinc-400">Transactions will appear here once payments are processed.</p>
                  </div>
                </td>
              </tr>
            ) : rows.map((t) => (
              <tr key={t.id} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-zinc-600">{t.id}</td>
                <td className="px-5 py-3 font-medium text-zinc-900">₹{(t.amount / 100).toLocaleString()}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] ?? 'bg-zinc-100 text-zinc-500'}`}>{t.status}</span>
                </td>
                <td className="px-5 py-3 text-zinc-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing {rows.length} of {total} results</span>
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
