'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Server,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function EC2Page() {
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

      const response = await axios.get(`${BASE_URL}/aws/compute`, {
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
        setError(err.response?.data?.message || 'Failed to fetch EC2 data');
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
      running: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      stopped: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle },
      unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.unknown;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading EC2 data...</p>
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

  const ec2 = data?.ec2;
  const pm2 = data?.pm2 || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">EC2 Instances</h1>
          <p className="text-muted-foreground mt-1">Compute resources and application processes</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* EC2 Instance Details */}
      {ec2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-orange-500" />
              EC2 Instance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Instance ID</p>
                <p className="font-mono text-sm mt-1">{ec2.instanceId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="mt-1 font-medium">{ec2.instanceType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">State</p>
                <div className="mt-1">
                  <StatusBadge status={ec2.state || 'unknown'} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Public IP</p>
                <p className="font-mono text-sm mt-1">
                  {ec2.publicIp 
                    ? `***.***.***.${ec2.publicIp.split('.')[3]}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Usage */}
      {ec2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Usage */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Cpu className="h-8 w-8 text-blue-500" />
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold">{ec2.cpu?.utilizationPercent || 0}%</p>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{ width: `${ec2.cpu?.utilizationPercent || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <MemoryStick className="h-8 w-8 text-green-500" />
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold">{ec2.memory?.usedPercent || 0}%</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {ec2.memory?.usedMB || 0} / {ec2.memory?.totalMB || 0} MB
                  </p>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${ec2.memory?.usedPercent || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disk Usage */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <HardDrive className="h-8 w-8 text-purple-500" />
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Disk Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold">{ec2.disk?.usedPercent || 0}%</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    {ec2.disk?.usedGB || 0} / {ec2.disk?.totalGB || 0} GB
                  </p>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${ec2.disk?.usedPercent || 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PM2 Processes */}
      {pm2.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PM2 Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Uptime</th>
                    <th className="pb-3 font-medium">Restarts</th>
                    <th className="pb-3 font-medium">Memory</th>
                    <th className="pb-3 font-medium">CPU</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pm2.map((proc: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3 font-medium">{proc.name}</td>
                      <td className="py-3">
                        <StatusBadge status={proc.status} />
                      </td>
                      <td className="py-3">{formatUptime(proc.uptime)}</td>
                      <td className="py-3">{proc.restarts}</td>
                      <td className="py-3">{proc.memoryMB} MB</td>
                      <td className="py-3">{proc.cpu}%</td>
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
