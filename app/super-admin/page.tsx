'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { API_BASE, adminApi, eventsApi, financeApi, orgsApi, trackersApi, usersApi, type ApiResponse } from '@/lib/api';

const actions = [
  { label: 'Create New Event', href: '/super-admin/events' },
  { label: 'Add User', href: '/super-admin/users' },
  { label: 'Manage Roles', href: '/super-admin/roles' },
  { label: 'View Analytics', href: '/super-admin/analytics' },
  { label: 'Manage API Keys', href: '/super-admin/api-keys' },
  { label: 'View Audit Logs', href: '/super-admin/audit-logs' },
];

type MetricCard = {
  label: string;
  value: string;
  helper: string;
};

type SecuritySignal = {
  label: string;
  value: string;
  state: 'good' | 'warn' | 'neutral';
};

type DashboardState = {
  metrics: MetricCard[];
  security: SecuritySignal[];
  recentActivity: Array<{ id: string; label: string; at: string }>;
  hasPartialData: boolean;
};

const toCardValue = (value: number | string | null | undefined) => {
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'string' && value.length > 0) return value;
  return 'N/A';
};

const stateClass: Record<SecuritySignal['state'], string> = {
  good: 'bg-green-50 text-green-700 border-green-100',
  warn: 'bg-amber-50 text-amber-700 border-amber-100',
  neutral: 'bg-zinc-50 text-zinc-600 border-zinc-200',
};

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snapshot, setSnapshot] = useState<DashboardState | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      const [usersRes, eventsRes, txRes, orgRes, auditRes, keysRes, viewsRes] = await Promise.allSettled([
        usersApi.list({ page: '1', limit: '1' }) as Promise<ApiResponse>,
        eventsApi.list({ page: '1', limit: '1' }) as Promise<ApiResponse>,
        financeApi.list('transactions', { page: '1', limit: '1' }) as Promise<ApiResponse>,
        orgsApi.list({ page: '1', limit: '1' }) as Promise<ApiResponse>,
        adminApi.get('audit-logs', { page: '1', limit: '5' }) as Promise<ApiResponse<Array<{ id: string; action: string; module: string; created_at: string }>>>,
        adminApi.get('api-keys') as Promise<ApiResponse<Array<{ id: string; expires_at?: string; last_used_at?: string }>>>,
        trackersApi.listViews(15),
      ]);

      if (!active) return;

      const usersTotal = usersRes.status === 'fulfilled' ? usersRes.value.meta?.total : null;
      const eventsTotal = eventsRes.status === 'fulfilled' ? eventsRes.value.meta?.total : null;
      const txTotal = txRes.status === 'fulfilled' ? txRes.value.meta?.total : null;
      const orgTotal = orgRes.status === 'fulfilled' ? orgRes.value.meta?.total : null;

      const auditLogs = auditRes.status === 'fulfilled' ? (auditRes.value.data ?? []) : [];
      const apiKeys = keysRes.status === 'fulfilled' ? (keysRes.value.data ?? []) : [];
      const trackerViews = viewsRes.status === 'fulfilled' ? viewsRes.value.total_unique_views : null;

      const expiringSoon = apiKeys.filter((k) => {
        if (!k.expires_at) return false;
        const expiresAt = new Date(k.expires_at).getTime();
        const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
        return expiresAt <= sevenDaysFromNow;
      }).length;

      const dashboardState: DashboardState = {
        metrics: [
          { label: 'Total Users', value: toCardValue(usersTotal), helper: 'Registered accounts' },
          { label: 'Active Events', value: toCardValue(eventsTotal), helper: 'Published event records' },
          { label: 'Transactions (Total)', value: toCardValue(txTotal), helper: 'All finance transactions' },
          { label: 'Organizations', value: toCardValue(orgTotal), helper: 'Managed organizations' },
          { label: 'Unique Admin Views', value: toCardValue(trackerViews), helper: 'Recent dashboard traffic' },
          { label: 'Audit Entries (Latest)', value: toCardValue(auditLogs.length), helper: 'Most recent security events' },
        ],
        security: [
          {
            label: 'API Key Hygiene',
            value: expiringSoon > 0 ? `${expiringSoon} key(s) expiring in 7 days` : 'No keys expiring soon',
            state: expiringSoon > 0 ? 'warn' : 'good',
          },
          {
            label: 'Audit Trail Stream',
            value: auditLogs.length > 0 ? `${auditLogs.length} recent admin action(s)` : 'No recent audit events found',
            state: auditLogs.length > 0 ? 'good' : 'neutral',
          },
          {
            label: 'Access Baseline',
            value: 'Role + status checks active in middleware',
            state: 'good',
          },
        ],
        recentActivity: auditLogs.map((log) => ({
          id: log.id,
          label: `${log.action} · ${log.module}`,
          at: log.created_at,
        })),
        hasPartialData: [usersRes, eventsRes, txRes, orgRes, auditRes, keysRes, viewsRes].some((result) => result.status === 'rejected'),
      };

      setSnapshot(dashboardState);
      if (dashboardState.hasPartialData) {
        setError('Some modules are temporarily unavailable. Showing partial dashboard data.');
      }
      setLoading(false);
    };

    load().catch(() => {
      if (!active) return;
      setError('Failed to load dashboard data. Please refresh and try again.');
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const renderedMetrics = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.metrics;
  }, [snapshot]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Dashboard Control Center</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Live operations, security posture, and system activity in one view.</p>
      </div>

      {error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-amber-700">Partial Data Notice</p>
          <p className="text-xs text-amber-600 mt-1">{error}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
            <div key={`loading-metric-${i}`} className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse mb-2" />
              <div className="h-7 w-20 bg-zinc-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-28 bg-zinc-50 rounded animate-pulse" />
            </div>
          ))
          : renderedMetrics.map((metric) => (
            <div key={metric.label} className="bg-white border border-zinc-200 rounded-xl p-5">
              <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-black mb-1">{metric.value}</p>
              <p className="text-xs text-zinc-400">{metric.helper}</p>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-black mb-4">Recent Security Activity</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`loading-activity-${i}`} className="h-12 bg-zinc-50 border border-zinc-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : snapshot && snapshot.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {snapshot.recentActivity.map((item) => (
                <div key={item.id} className="border border-zinc-100 rounded-lg px-3 py-2.5 flex items-center justify-between">
                  <p className="text-sm text-zinc-700 font-medium">{item.label}</p>
                  <p className="text-xs text-zinc-400">{new Date(item.at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3 text-lg" style={{ color: '#0062ff' }}>◷</div>
              <p className="text-sm text-zinc-500 font-medium">No activity yet</p>
              <p className="text-xs text-zinc-400 mt-1">Recent audit log actions will appear here automatically.</p>
            </div>
          )}
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-black mb-4">Security Posture</h2>
          <div className="space-y-2.5 mb-5">
            {(snapshot?.security ?? []).map((signal) => (
              <div key={signal.label} className={`border rounded-lg px-3 py-2 ${stateClass[signal.state]}`}>
                <p className="text-xs font-semibold uppercase tracking-wide">{signal.label}</p>
                <p className="text-xs mt-1">{signal.value}</p>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Quick Actions</h3>
          <div className="space-y-2">
            {actions.map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all text-sm text-zinc-700"
              >
                {a.label}<span className="text-zinc-300">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-blue-700 mb-1">API Connected</p>
          <p className="text-xs text-blue-600">
            Backend: <code className="bg-blue-100 px-1 rounded">{API_BASE}</code>
            {' '}— set <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> in <code className="bg-blue-100 px-1 rounded">.env.local</code> to point to your deployed API.
          </p>
        </div>
        <Link href="/super-admin/settings" className="text-xs border border-blue-200 text-blue-700 bg-white rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors">
          Review Security Settings
        </Link>
      </div>
    </div>
  );
}
