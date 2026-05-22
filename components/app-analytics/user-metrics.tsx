'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { appAnalyticsApi } from '@/lib/api/app-analytics-api';
import { Users, UserPlus, Activity } from 'lucide-react';

interface UserMetricsProps {
  dateRange: { startDate: string; endDate: string };
  platform: 'ios' | 'android' | 'all';
}

export function UserMetrics({ dateRange, platform }: UserMetricsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, platform]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await appAnalyticsApi.getUserAnalytics({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        platform,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load user metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 transition-all duration-300 hover:shadow-md">
      <div className="mb-6 border-b border-slate-100 pb-5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight font-sans">User Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">Active users, organic retention, and general session engagement metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50/70 to-blue-100/40 border border-blue-100/50 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-250">
          <div className="flex items-center gap-2 mb-2.5">
            <Users className="w-4.5 h-4.5 text-blue-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Active Users</p>
          </div>
          <p className="text-2xl font-extrabold text-blue-600 tracking-tight">{formatNumber(data.metrics.totalActiveUsers)}</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 border border-emerald-100/50 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-250">
          <div className="flex items-center gap-2 mb-2.5">
            <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">New Users</p>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 tracking-tight">{formatNumber(data.metrics.totalNewUsers)}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50/70 to-purple-100/40 border border-purple-100/50 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-250">
          <div className="flex items-center gap-2 mb-2.5">
            <Activity className="w-4.5 h-4.5 text-purple-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg DAU</p>
          </div>
          <p className="text-2xl font-extrabold text-purple-600 tracking-tight">{formatNumber(data.metrics.avgDau)}</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50/70 to-orange-100/40 border border-orange-100/50 rounded-xl p-4.5 shadow-sm hover:shadow transition-shadow duration-250">
          <div className="flex items-center gap-2 mb-2.5">
            <Activity className="w-4.5 h-4.5 text-orange-600" />
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">DAU/MAU Ratio</p>
          </div>
          <p className="text-2xl font-extrabold text-orange-600 tracking-tight">{data.metrics.dauMauRatio.toFixed(1)}%</p>
        </div>
      </div>

      {/* User Trend Chart */}
      <div className="mb-8 p-5 border border-slate-200/80 rounded-xl bg-slate-50/20 shadow-xxs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">User Growth & Activity Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
            <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600, color: '#475569' }} />
            <Line type="monotone" dataKey="activeUsers" stroke="#3b82f6" strokeWidth={2.5} activeDot={{ r: 6 }} name="Active Users" />
            <Line type="monotone" dataKey="newUsers" stroke="#10b981" strokeWidth={2.5} name="New Users" />
            <Line type="monotone" dataKey="dau" stroke="#8b5cf6" strokeWidth={2.5} name="DAU" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Retention Metrics */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Retention Cohorts</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Day 1 Retention</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{data.retention.day1.toFixed(1)}%</p>
              <div className="flex-1 bg-slate-100 rounded-full h-2 mb-1 border border-slate-200/50">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data.retention.day1}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Day 7 Retention</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{data.retention.day7.toFixed(1)}%</p>
              <div className="flex-1 bg-slate-100 rounded-full h-2 mb-1 border border-slate-200/50">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data.retention.day7}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow duration-200">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Day 30 Retention</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-black text-slate-800 tracking-tight leading-none">{data.retention.day30.toFixed(1)}%</p>
              <div className="flex-1 bg-slate-100 rounded-full h-2 mb-1 border border-slate-200/50">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${data.retention.day30}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}
