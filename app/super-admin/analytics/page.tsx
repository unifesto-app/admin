'use client';
import { useEffect, useState } from 'react';
import { usersApi, eventsApi, financeApi, ApiResponse } from '@/lib/api';

interface KPI { label: string; value: string | number; sub: string; }

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, eventsRes, txRes] = await Promise.allSettled([
          usersApi.list({ limit: '1' }) as Promise<ApiResponse>,
          eventsApi.list({ limit: '1' }) as Promise<ApiResponse>,
          financeApi.list('transactions', { limit: '1' }) as Promise<ApiResponse>,
        ]);

        const totalUsers = usersRes.status === 'fulfilled' ? (usersRes.value.meta?.total ?? '—') : '—';
        const totalEvents = eventsRes.status === 'fulfilled' ? (eventsRes.value.meta?.total ?? '—') : '—';
        const totalTx = txRes.status === 'fulfilled' ? (txRes.value.meta?.total ?? '—') : '—';

        setKpis([
          { label: 'Total Users', value: totalUsers, sub: 'All registered users' },
          { label: 'Total Events', value: totalEvents, sub: 'All events on platform' },
          { label: 'Total Transactions', value: totalTx, sub: 'All payment transactions' },
          { label: 'Conversion Rate', value: '—', sub: 'Connect analytics provider' },
        ]);
      } catch {
        setKpis([
          { label: 'Total Users', value: '—', sub: 'API unavailable' },
          { label: 'Total Events', value: '—', sub: 'API unavailable' },
          { label: 'Total Transactions', value: '—', sub: 'API unavailable' },
          { label: 'Conversion Rate', value: '—', sub: 'API unavailable' },
        ]);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const charts = [
    { title: 'Traffic Overview', desc: 'Visitor trends over time' },
    { title: 'Event Performance', desc: 'Registration and attendance rates per event' },
    { title: 'User Growth', desc: 'New vs returning users over time' },
    { title: 'Revenue Trends', desc: 'Monthly revenue breakdown' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Analytics</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Platform metrics pulled live from the API.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse mb-3" />
              <div className="h-7 w-16 bg-zinc-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-28 bg-zinc-50 rounded animate-pulse" />
            </div>
          ))
        ) : kpis.map(k => (
          <div key={k.label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">{k.label}</p>
            <p className="text-2xl font-bold text-black mb-1">{k.value}</p>
            <p className="text-xs text-zinc-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {charts.map(c => (
          <div key={c.title} className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-black">{c.title}</h2>
              <p className="text-xs text-zinc-400">{c.desc}</p>
            </div>
            <div className="h-48 bg-zinc-50 rounded-lg border border-dashed border-zinc-200 flex items-center justify-center">
              <p className="text-xs text-zinc-400">Integrate a charting library (e.g. Recharts) to visualise data</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
