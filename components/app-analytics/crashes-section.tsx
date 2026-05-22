'use client';

import { useState, useEffect } from 'react';
import { appAnalyticsApi } from '@/lib/api/app-analytics-api';
import { AlertTriangle, AlertCircle, Bug, Smartphone, Calendar } from 'lucide-react';
import { AppleLogo, GooglePlayLogo } from './brand-icons';

interface CrashesSectionProps {
  dateRange: { startDate: string; endDate: string };
  platform: 'ios' | 'android' | 'all';
}

export function CrashesSection({ dateRange, platform }: CrashesSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [dateRange, platform, selectedVersion]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await appAnalyticsApi.getCrashAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        platform,
        appVersion: selectedVersion,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load crash analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="h-6 bg-slate-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (!data) return null;

  const crashFreeColor = data.metrics.crashFreeUsersPercentage >= 99 ? 'text-emerald-600' : 
                         data.metrics.crashFreeUsersPercentage >= 95 ? 'text-amber-600' : 'text-rose-600';

  const crashFreeBgColor = data.metrics.crashFreeUsersPercentage >= 99 ? 'from-emerald-50/70 to-emerald-100/40 border-emerald-100/50' : 
                           data.metrics.crashFreeUsersPercentage >= 95 ? 'from-amber-50/70 to-amber-100/40 border-amber-100/50' : 'from-rose-50/70 to-rose-100/40 border-rose-100/50';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
      <div className="mb-6 border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Crash Diagnostics</h2>
        <p className="text-xs text-slate-500 mt-0.5">App stability, unexpected terminations, and diagnostic logs</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-rose-50/70 to-rose-100/40 border border-rose-100/50 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-2">
            <Bug className="w-4.5 h-4.5 text-rose-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Crashes</p>
          </div>
          <p className="text-2xl font-black text-rose-600 tracking-tight">{data.metrics.totalCrashes.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50/70 to-orange-100/40 border border-orange-100/50 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4.5 h-4.5 text-orange-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">ANRs</p>
          </div>
          <p className="text-2xl font-black text-orange-600 tracking-tight">{data.metrics.totalAnrs.toLocaleString()}</p>
        </div>

        <div className={`bg-gradient-to-br ${crashFreeBgColor} rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-200 border`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className={`w-4.5 h-4.5 ${crashFreeColor}`} />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Crash-Free Rate</p>
          </div>
          <p className={`text-2xl font-black ${crashFreeColor} tracking-tight`}>
            {data.metrics.crashFreeUsersPercentage.toFixed(2)}%
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50/70 to-purple-100/40 border border-purple-100/50 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-4.5 h-4.5 text-purple-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Affected Users</p>
          </div>
          <p className="text-2xl font-black text-purple-600 tracking-tight">{data.metrics.affectedUsers.toLocaleString()}</p>
        </div>
      </div>

      {/* Version Filter */}
      {data.byVersion.length > 0 && (
        <div className="mb-6 p-4.5 bg-slate-50/50 border border-slate-200 rounded-xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Filter by Version</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedVersion(undefined)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 border ${
                !selectedVersion
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                  : 'bg-white text-slate-600 hover:text-slate-850 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              All Versions
            </button>
            {data.byVersion.slice(0, 5).map((version: any) => (
              <button
                key={version.version}
                onClick={() => setSelectedVersion(version.version)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 border ${
                  selectedVersion === version.version
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-100'
                    : 'bg-white text-slate-600 hover:text-slate-850 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                v{version.version} ({version.crashes + version.anrs})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Crashes by Version */}
      <div className="mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Crashes Distribution by Version</h3>
        <div className="space-y-2.5">
          {data.byVersion.slice(0, 10).map((version: any, index: number) => {
            const totalIssues = version.crashes + version.anrs;
            const maxIssues = Math.max(...data.byVersion.map((v: any) => v.crashes + v.anrs));
            const percentage = (totalIssues / maxIssues) * 100;

            return (
              <div key={version.version} className="flex items-center gap-4 p-3 bg-slate-50/50 border border-slate-200/50 rounded-xl hover:bg-white hover:border-slate-200 transition-all duration-150">
                <div className="w-20 font-mono text-xs font-bold text-slate-700">
                  v{version.version}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-xxs font-semibold text-slate-500 font-mono">
                    <span>Crashes: {version.crashes}</span>
                    <span>ANRs: {version.anrs}</span>
                    <span>Affected Users: {version.affectedUsers}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Crashes */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Top System Issues</h3>
        <div className="space-y-4">
          {data.topCrashes.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
              <Bug className="w-8 h-8 stroke-1.5 mb-2 text-slate-300" />
              <p className="text-sm font-medium">No crash records found for this period</p>
            </div>
          ) : (
            data.topCrashes.slice(0, 5).map((crash: any, index: number) => (
              <div 
                key={crash.id} 
                className="border border-slate-200 rounded-xl p-4.5 bg-white hover:border-slate-300 hover:shadow-xs transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                      crash.crash_type === 'anr' 
                        ? 'bg-orange-50 text-orange-800 border-orange-200' 
                        : 'bg-rose-50 text-rose-850 border-rose-200'
                    }`}>
                      {crash.crash_type.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-slate-800 font-sans">
                      {crash.exception_type || 'Unknown Exception'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <span className="text-xxs text-slate-400 font-mono">v{crash.app_version}</span>
                    <div className={`
                      flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold
                      ${crash.platform === 'ios' 
                        ? 'bg-slate-50 text-slate-800 border-slate-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                      }
                    `}>
                      {crash.platform === 'ios' ? (
                        <AppleLogo className="w-3 h-3 text-slate-800" />
                      ) : (
                        <GooglePlayLogo className="w-3 h-3" />
                      )}
                      <span className="text-[10px] uppercase tracking-wider">{crash.platform === 'ios' ? 'iOS' : 'Android'}</span>
                    </div>
                  </div>
                </div>

                {crash.error_message && (
                  <p className="text-xs text-rose-700 font-semibold mb-3.5 font-mono bg-rose-50/40 border border-rose-100/50 p-3 rounded-lg leading-relaxed overflow-x-auto">
                    {crash.error_message}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xxs font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <span className="flex items-center gap-1">
                    <Bug className="w-3.5 h-3.5 text-slate-450" />
                    {crash.occurrence_count} occurrences
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-slate-450" />
                    {crash.affected_users} users affected
                  </span>
                  {crash.device_model && (
                    <span className="bg-slate-100 border border-slate-200/50 px-2 py-0.5 rounded text-[10px] normal-case">
                      {crash.device_model}
                    </span>
                  )}
                  <span className="flex items-center gap-1 ml-auto normal-case text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Last seen: {new Date(crash.last_occurred_at).toLocaleDateString()}
                  </span>
                </div>

                {crash.stack_trace && (
                  <details className="mt-4 border-t border-slate-100 pt-3 group">
                    <summary className="text-xs font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors select-none">
                      <span className="group-open:hidden">Show diagnostic stack trace</span>
                      <span className="hidden group-open:inline">Hide diagnostic stack trace</span>
                    </summary>
                    <pre className="mt-3 text-[11px] bg-slate-950 text-slate-300 p-4 rounded-xl overflow-x-auto font-mono border border-slate-900 leading-relaxed max-h-[250px]">
                      {crash.stack_trace.slice(0, 500)}
                      {crash.stack_trace.length > 500 && '... [truncated]'}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
