/**
 * Platform Analytics Dashboard
 * 
 * Platform-wide analytics for Platform Super Admins
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlatformAdminGuard } from '@/components/permissions/permission-guard';
import {
  BarChart3,
  Users,
  Building2,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
} from 'lucide-react';

interface PlatformStats {
  total_organizations: number;
  total_users: number;
  total_events: number;
  active_events: number;
  total_members: number;
  growth_rate: number;
}

export default function PlatformAnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats>({
    total_organizations: 0,
    total_users: 0,
    total_events: 0,
    active_events: 0,
    total_members: 0,
    growth_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchPlatformStats();
  }, [dateRange]);

  const fetchPlatformStats = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const { data } = await getPlatformAnalytics({ date_range: dateRange });
      
      // Mock data for now
      setTimeout(() => {
        setStats({
          total_organizations: 156,
          total_users: 12453,
          total_events: 892,
          active_events: 234,
          total_members: 45678,
          growth_rate: 12.5,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      setLoading(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon');
  };

  return (
    <PlatformAdminGuard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Platform Analytics</h1>
            <p className="text-gray-600 mt-1">
              Overview of all organizations, users, and events across the platform
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchPlatformStats}
              disabled={loading}
              className="rounded-full"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} className="rounded-full">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
            <div className="flex gap-1">
              {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    dateRange === range
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range === '7d' && 'Last 7 Days'}
                  {range === '30d' && 'Last 30 Days'}
                  {range === '90d' && 'Last 90 Days'}
                  {range === '1y' && 'Last Year'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Organizations */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4" />
                +{stats.growth_rate}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats.total_organizations.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Organizations</div>
          </Card>

          {/* Total Users */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4" />
                +{stats.growth_rate}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats.total_users.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Users</div>
          </Card>

          {/* Total Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4" />
                +{stats.growth_rate}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats.total_events.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Events</div>
          </Card>

          {/* Active Events */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? '...' : stats.active_events.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">Active Events</div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Growth Trend</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Growth chart coming soon</p>
              </div>
            </div>
          </Card>

          {/* Activity Heatmap */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Heatmap</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Activity heatmap coming soon</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top Organizations */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Top Organizations</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Top organizations list coming soon
              </div>
            )}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Recent activity feed coming soon
              </div>
            )}
          </div>
        </Card>
      </div>
    </PlatformAdminGuard>
  );
}
