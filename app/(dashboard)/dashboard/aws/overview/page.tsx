'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Server,
  Database,
  HardDrive,
  Cloud,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function OverviewPage() {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('unifesto_admin_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const [overviewRes, healthRes] = await Promise.all([
        axios.get(`${BASE_URL}/aws/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${BASE_URL}/aws/health`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setOverviewData(overviewRes.data);
      setHealthData(healthRes.data);
      setLastChecked(new Date());
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('unifesto_admin_token');
        window.location.href = '/login';
      } else if (err.response?.status === 403) {
        setError('Admin access required');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      healthy: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      running: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      available: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      connected: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      online: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle },
      error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      disconnected: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
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

  const getOverallStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'down':
        return 'bg-red-500/10 border-red-500/20';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  if (loading && !overviewData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading AWS infrastructure...</p>
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

  const services = overviewData?.services || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AWS Infrastructure</h1>
          <p className="text-muted-foreground mt-1">
            Region: {overviewData?.region || 'ap-south-1'} (Mumbai) • Last checked: {formatLastChecked(lastChecked)}
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Health Banner */}
      {healthData && (
        <Card className={`border-2 ${getOverallStatusColor(healthData.status)}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {healthData.status === 'healthy' ? 'All Systems Operational' : 
                     healthData.status === 'degraded' ? 'Some Services Degraded' : 'System Down'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Overall infrastructure health status
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold capitalize">{healthData.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* EC2 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <Server className="w-8 h-8 text-orange-500" />
              <StatusBadge status={services.ec2?.error ? 'error' : services.ec2?.state || 'unknown'} />
            </div>
            <CardTitle className="text-xl">EC2</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!services.ec2?.error ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium">{services.ec2?.instanceType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Public IP:</span>
                    <span className="font-medium truncate ml-2 max-w-[150px]">
                      {services.ec2?.publicIp 
                        ? `***.***.***.${services.ec2.publicIp.split('.')[3]}`
                        : 'N/A'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-destructive">Failed to fetch service data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RDS */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-blue-500" />
              <StatusBadge status={
                services.rds?.error ? 'error' : 
                healthData?.services?.database?.status || services.rds?.status || 'unknown'
              } />
            </div>
            <CardTitle className="text-xl">RDS Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!services.rds?.error ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engine:</span>
                    <span className="font-medium">{services.rds?.engine || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Storage:</span>
                    <span className="font-medium">{services.rds?.storageGB || 0} GB</span>
                  </div>
                  {healthData?.services?.database && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Latency:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {healthData.services.database.latency}ms
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-destructive">Failed to fetch service data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ElastiCache */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-8 h-8 text-red-500" />
              <StatusBadge status={
                services.elasticache?.error ? 'error' :
                healthData?.services?.redis?.status || services.elasticache?.status || 'unknown'
              } />
            </div>
            <CardTitle className="text-xl">ElastiCache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!services.elasticache?.error ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Node Type:</span>
                    <span className="font-medium truncate ml-2 max-w-[150px]">
                      {services.elasticache?.nodeType || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Engine:</span>
                    <span className="font-medium">{services.elasticache?.engine || 'N/A'}</span>
                  </div>
                  {healthData?.services?.redis && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Latency:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {healthData.services.redis.latency}ms
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-destructive">Failed to fetch service data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* S3 */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-2">
              <Cloud className="w-8 h-8 text-green-500" />
              <StatusBadge status={
                services.s3?.error ? 'error' :
                healthData?.services?.storage?.status || 'available'
              } />
            </div>
            <CardTitle className="text-xl">S3 Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {!services.s3?.error ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bucket:</span>
                    <span className="font-medium truncate ml-2 max-w-[150px]">
                      {services.s3?.bucketName || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Region:</span>
                    <span className="font-medium">{services.s3?.region || 'N/A'}</span>
                  </div>
                  {healthData?.services?.storage && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-muted-foreground">Latency:</span>
                      <span className="font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {healthData.services.storage.latency}ms
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-destructive">Failed to fetch service data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Server Health */}
      {healthData?.services?.app && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Application Server</CardTitle>
              <StatusBadge status={healthData.services.app.status} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Uptime</p>
                <p className="text-xl font-bold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {formatUptime(healthData.services.app.uptime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Memory Usage</p>
                <p className="text-xl font-bold">{healthData.services.app.memoryMB} MB</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Platform</p>
                <p className="text-xl font-bold">NestJS 11</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
