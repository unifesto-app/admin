'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { appAnalyticsApi } from '@/lib/api/app-analytics-api';

interface RevenueChartProps {
  dateRange: { startDate: string; endDate: string };
  platform: 'ios' | 'android' | 'all';
}

export function RevenueChart({ dateRange, platform }: RevenueChartProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  useEffect(() => {
    loadData();
  }, [dateRange, platform]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await appAnalyticsApi.getRevenue({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        platform,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load revenue data:', error);
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
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Revenue Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total: {formatCurrency(data.totalRevenue)} | Proceeds: {formatCurrency(data.totalProceeds)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setChartType('area')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'area'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('line')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              chartType === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Line
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">iOS Revenue</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.byPlatform.ios.revenue)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.byPlatform.ios.newSubscriptions} new subscriptions
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Android Revenue</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.byPlatform.android.revenue)}</p>
          <p className="text-xs text-gray-500 mt-1">
            {data.byPlatform.android.newSubscriptions} new subscriptions
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Active Subscriptions</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.byPlatform.ios.activeSubscriptions + data.byPlatform.android.activeSubscriptions}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            iOS: {data.byPlatform.ios.activeSubscriptions} | Android: {data.byPlatform.android.activeSubscriptions}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'area' ? (
          <AreaChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Legend />
            <Area
              type="monotone"
              dataKey="ios"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              name="iOS"
            />
            <Area
              type="monotone"
              dataKey="android"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              name="Android"
            />
          </AreaChart>
        ) : (
          <LineChart data={data.chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: any) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="ios" stroke="#3b82f6" strokeWidth={2} name="iOS" />
            <Line type="monotone" dataKey="android" stroke="#10b981" strokeWidth={2} name="Android" />
            <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Total" />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
