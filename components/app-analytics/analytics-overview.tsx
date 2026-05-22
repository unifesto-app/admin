'use client';

import { TrendingUp, TrendingDown, Download, Users, Activity, AlertCircle } from 'lucide-react';
import { AppleLogo, GooglePlayLogo } from './brand-icons';

interface AnalyticsOverviewProps {
  data: any;
  loading: boolean;
}

export function AnalyticsOverview({ data, loading }: AnalyticsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
            <div className="h-10 bg-slate-100 rounded-xl w-10"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-100 rounded w-1/2"></div>
              <div className="h-7 bg-slate-100 rounded w-3/4"></div>
            </div>
            <div className="h-6 bg-slate-50 border border-slate-100 rounded-lg pt-3 w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      title: 'Total Downloads',
      value: formatNumber(data.metrics.totalDownloads + data.metrics.totalInstalls),
      icon: Download,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-100/50',
      ios: formatNumber(data.byPlatform.ios.downloads + data.byPlatform.ios.installs),
      android: formatNumber(data.byPlatform.android.downloads + data.byPlatform.android.installs),
    },
    {
      title: 'Active Users',
      value: formatNumber(data.metrics.totalActiveUsers),
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100/50',
      ios: formatNumber(data.byPlatform.ios.activeUsers),
      android: formatNumber(data.byPlatform.android.activeUsers),
    },
    {
      title: 'Total Sessions',
      value: formatNumber(data.metrics.totalSessions),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-100/50',
      ios: formatNumber(data.byPlatform.ios.sessions),
      android: formatNumber(data.byPlatform.android.sessions),
    },
    {
      title: 'Crash-Free Rate',
      value: `${data.metrics.avgCrashFreePercentage.toFixed(2)}%`,
      icon: data.metrics.avgCrashFreePercentage >= 99 ? Activity : AlertCircle,
      color: data.metrics.avgCrashFreePercentage >= 99 ? 'text-emerald-600' : 'text-amber-600',
      bgColor: data.metrics.avgCrashFreePercentage >= 99 ? 'bg-emerald-50 border-emerald-100/50' : 'bg-amber-50 border-amber-100/50',
      ios: `${data.byPlatform.ios.crashFreePercentage.toFixed(2)}%`,
      android: `${data.byPlatform.android.crashFreePercentage.toFixed(2)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div 
          key={index} 
          className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 p-6 flex flex-col justify-between hover:-translate-y-0.5"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl border flex items-center justify-center ${metric.bgColor}`}>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </div>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{metric.title}</h3>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{metric.value}</p>
          </div>
          
          <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 mt-5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg">
              <AppleLogo className="w-3 h-3 text-slate-800" />
              <span className="font-bold text-slate-600 font-mono">{metric.ios}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2 py-1 rounded-lg">
              <GooglePlayLogo className="w-3 h-3" />
              <span className="font-bold text-slate-600 font-mono">{metric.android}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

