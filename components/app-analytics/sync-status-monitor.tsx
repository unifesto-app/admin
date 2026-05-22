'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { appAnalyticsApi } from '@/lib/api/app-analytics-api';
import { ManualSyncButton } from './manual-sync-button';
import { AppleLogo, GooglePlayLogo, FirebaseLogo } from './brand-icons';

export function SyncStatusMonitor() {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSyncStatus();

    if (autoRefresh) {
      const interval = setInterval(loadSyncStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSyncStatus = async () => {
    try {
      const data = await appAnalyticsApi.getSyncStatus();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-slate-200 rounded w-1/4"></div>
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-slate-100 rounded-xl"></div>
            <div className="h-16 bg-slate-100 rounded-xl"></div>
            <div className="h-16 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Data Synchronization</h3>
          <p className="text-xs text-slate-500 mt-0.5">Real-time connection status with platform providers</p>
        </div>
        <div className="flex flex-wrap items-center gap-3.5">
          <ManualSyncButton onSyncComplete={loadSyncStatus} />
          
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 transition-colors cursor-pointer"
            />
            Auto-refresh
          </label>
          <button
            onClick={loadSyncStatus}
            title="Refresh Status"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all active:scale-95 border border-transparent hover:border-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Apple Sync Status */}
        <SyncStatusItem
          source="Apple App Store"
          icon={<AppleLogo className="w-5 h-5 text-slate-800" />}
          iconBg="bg-slate-100 border-slate-200"
          status={syncStatus?.apple || 'unknown'}
          lastSync={syncStatus?.appleLastSync}
          nextSync={syncStatus?.appleNextSync}
        />

        {/* Google Sync Status */}
        <SyncStatusItem
          source="Google Play Console"
          icon={<GooglePlayLogo className="w-5 h-5" />}
          iconBg="bg-blue-50/50 border-blue-100"
          status={syncStatus?.google || 'unknown'}
          lastSync={syncStatus?.googleLastSync}
          nextSync={syncStatus?.googleNextSync}
        />

        {/* Firebase Sync Status */}
        <SyncStatusItem
          source="Firebase Analytics"
          icon={<FirebaseLogo className="w-5 h-5" />}
          iconBg="bg-amber-50/50 border-amber-100"
          status={syncStatus?.firebase || 'unknown'}
          lastSync={syncStatus?.firebaseLastSync}
          nextSync={syncStatus?.firebaseNextSync}
        />
      </div>

      {/* Overall Stats */}
      {syncStatus?.stats && (
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sync Execution Metrics</p>
            <div className="flex gap-8 text-center sm:text-right">
              <div>
                <p className="text-xs text-slate-500 font-medium">Successful Runs</p>
                <p className="text-xl font-bold text-emerald-600 mt-0.5">{syncStatus.stats.successful}</p>
              </div>
              <div className="w-px bg-slate-100 self-stretch"></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Failed Runs</p>
                <p className="text-xl font-bold text-rose-600 mt-0.5">{syncStatus.stats.failed}</p>
              </div>
              <div className="w-px bg-slate-100 self-stretch"></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Attempts</p>
                <p className="text-xl font-bold text-blue-600 mt-0.5">{syncStatus.stats.total}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SyncStatusItemProps {
  source: string;
  icon: React.ReactNode;
  iconBg: string;
  status: 'success' | 'failed' | 'running' | 'unknown';
  lastSync?: string;
  nextSync?: string;
}

function SyncStatusItem({ source, icon, iconBg, status, lastSync, nextSync }: SyncStatusItemProps) {
  const getStatusDetails = () => {
    switch (status) {
      case 'success':
        return {
          icon: <CheckCircle className="w-4 h-4 text-emerald-600" />,
          bgColor: 'bg-emerald-50 border-l-emerald-500',
          badge: 'bg-emerald-100/80 text-emerald-800 border-emerald-200',
          label: 'Connected'
        };
      case 'failed':
        return {
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          bgColor: 'bg-rose-50/50 border-l-rose-500',
          badge: 'bg-rose-100/80 text-rose-800 border-rose-200',
          label: 'Failing'
        };
      case 'running':
        return {
          icon: <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />,
          bgColor: 'bg-blue-50/50 border-l-blue-500 animate-pulse',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Syncing'
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4 text-slate-400" />,
          bgColor: 'bg-slate-50/50 border-l-slate-300',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          label: 'Unknown'
        };
    }
  };

  const details = getStatusDetails();

  return (
    <div className={`
      relative bg-white border border-slate-200 rounded-xl p-4.5 
      flex flex-col justify-between min-h-[110px] shadow-sm hover:shadow-md 
      transition-all duration-200 border-l-4 ${details.bgColor}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg border flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm tracking-tight">{source}</p>
            {lastSync ? (
              <p className="text-xxs text-slate-400 mt-1 font-mono">
                {new Date(lastSync).toLocaleDateString()} at {new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <p className="text-xxs text-slate-400 mt-1 font-mono">Never synced</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status</span>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${details.badge}`}>
          {details.icon}
          <span>{details.label}</span>
        </div>
      </div>
    </div>
  );
}

