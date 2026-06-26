'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Ban,
  TrendingUp,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function SESPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('unifesto_admin_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await axios.get(`${BASE_URL}/aws/ses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('unifesto_admin_token');
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('Admin access required');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch SES data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      success: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      verified: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle },
      failed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      bounced: { bg: 'bg-red-500/20', text: 'text-red-400', icon: Ban },
      complained: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: AlertTriangle },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading SES data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-12 h-12 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={fetchData} variant="outline">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const config = data?.config || {};
  const stats = data?.stats || {};
  const quota = data?.quota || {};
  const identities = data?.identities || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SES Email Service</h1>
          <p className="text-muted-foreground mt-1">Simple Email Service configuration and statistics</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* SES Configuration */}
      {config && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-500" />
              SES Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="mt-1 font-medium">{config.region || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <div className="mt-1">
                  <StatusBadge status={config.accountStatus || 'pending'} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sending Enabled</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      config.sendingEnabled
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {config.sendingEnabled ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {config.sendingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Production Access</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      config.productionAccess
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {config.productionAccess ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {config.productionAccess ? 'Granted' : 'Sandbox'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sending Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Send className="h-8 w-8 text-blue-500" />
            <CardTitle className="text-lg">Emails Sent (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.sentLast24h?.toLocaleString() || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">successful deliveries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Ban className="h-8 w-8 text-red-500" />
            <CardTitle className="text-lg">Bounces (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.bouncesLast24h || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.bounceRate ? `${stats.bounceRate}%` : '0%'} bounce rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
            <CardTitle className="text-lg">Complaints (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.complaintsLast24h || 0}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.complaintRate ? `${stats.complaintRate}%` : '0%'} complaint rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <CardTitle className="text-lg">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.deliveryRate || 0}%</p>
            <p className="text-sm text-muted-foreground mt-1">successful deliveries</p>
          </CardContent>
        </Card>
      </div>

      {/* Sending Quota */}
      {quota && Object.keys(quota).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Sending Quota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">24-Hour Sending Quota</p>
                  <p className="text-sm font-medium">
                    {quota.sentLast24Hours || 0} / {quota.max24HourSend || 0}
                  </p>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{
                      width: `${quota.max24HourSend ? ((quota.sentLast24Hours || 0) / quota.max24HourSend) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Max Send Rate</p>
                  <p className="text-2xl font-bold mt-1">{quota.maxSendRate || 0}</p>
                  <p className="text-xs text-muted-foreground">emails per second</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Quota</p>
                  <p className="text-2xl font-bold mt-1">
                    {(quota.max24HourSend || 0) - (quota.sentLast24Hours || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">emails remaining today</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verified Identities */}
      {identities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verified Identities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {identities.map((identity: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{identity.identity}</p>
                      <p className="text-xs text-muted-foreground">{identity.type || 'Email'}</p>
                    </div>
                  </div>
                  <StatusBadge status={identity.verificationStatus || 'pending'} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Timestamp</th>
                    <th className="pb-3 font-medium">Recipient</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentActivity.map((activity: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3">
                        {new Date(activity.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 font-mono text-xs">{activity.recipient}</td>
                      <td className="py-3 truncate max-w-xs">{activity.subject}</td>
                      <td className="py-3">
                        <StatusBadge status={activity.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
