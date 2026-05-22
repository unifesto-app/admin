'use client';

import { useState, useEffect } from 'react';
import { appAnalyticsApi } from '@/lib/api/app-analytics-api';
import { AnalyticsOverview } from '@/components/app-analytics/analytics-overview';
import { UserMetrics } from '@/components/app-analytics/user-metrics';
import { ReviewsSection } from '@/components/app-analytics/reviews-section';
import { CrashesSection } from '@/components/app-analytics/crashes-section';
import { DateRangePicker } from '@/components/app-analytics/date-range-picker';
import { PlatformFilter } from '@/components/app-analytics/platform-filter';
import { SyncStatusMonitor } from '@/components/app-analytics/sync-status-monitor';
import { ExportButton } from '@/components/app-analytics/export-button';
import { LayoutDashboard, Users, MessageSquare, ShieldAlert } from 'lucide-react';

export default function AppAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [platform, setPlatform] = useState<'ios' | 'android' | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'reviews' | 'stability'>('overview');

  useEffect(() => {
    loadData();
  }, [dateRange, platform]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await appAnalyticsApi.getOverview({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        platform,
      });
      setOverview(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'users' as const, label: 'User Engagement', icon: Users },
    { id: 'reviews' as const, label: 'Store Reviews', icon: MessageSquare },
    { id: 'stability' as const, label: 'App Stability', icon: ShieldAlert },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
      {/* Header Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-sans">App Analytics</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Unified telemetry consolidated from Apple App Store, Google Play Console, and Firebase
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <PlatformFilter value={platform} onChange={setPlatform} />
          {overview && (
            <div className="hover:scale-102 transition-transform duration-200">
              <ExportButton 
                data={overview} 
                filename={`analytics-overview-${dateRange.startDate}-${dateRange.endDate}`}
                type="overview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Interactive Navigation Tabbar */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pr-4 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2.5 px-5 py-3.5 border-b-2 font-bold text-sm transition-all duration-200 whitespace-nowrap active:scale-98
                ${isActive 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/20' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }
              `}
            >
              <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-110' : 'opacity-80'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Tab View Panel */}
      <div className="transition-all duration-300 ease-in-out">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sync status widget inside operational overview */}
            <SyncStatusMonitor />
            
            <div>
              <h3 className="text-base font-bold text-slate-400 uppercase tracking-wider mb-4">Core Performance</h3>
              <AnalyticsOverview data={overview} loading={loading} />
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <UserMetrics dateRange={dateRange} platform={platform} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-fade-in">
            <ReviewsSection dateRange={dateRange} platform={platform} />
          </div>
        )}

        {activeTab === 'stability' && (
          <div className="animate-fade-in">
            <CrashesSection dateRange={dateRange} platform={platform} />
          </div>
        )}
      </div>
    </div>
  );
}

