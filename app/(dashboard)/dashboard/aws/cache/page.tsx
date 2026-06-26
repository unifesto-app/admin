'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  HardDrive,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Database,
  Zap,
  Clock,
  MemoryStick,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function CachePage() {
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

      const response = await axios.get(`${BASE_URL}/aws/cache`, {
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
        setError(err.response?.data?.message || 'Failed to fetch cache data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      available: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      connected: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      unavailable: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
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
          <p className="text-sm text-muted-foreground">Loading cache data...</p>
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

  const elasticache = data?.elasticache;
  const redis = data?.redis;
  const otpStore = data?.otpStore || { activeCount: 0, keys: [] };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ElastiCache</h1>
          <p className="text-muted-foreground mt-1">Redis cache cluster and memory management</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ElastiCache Cluster Details */}
      {elasticache && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-red-500" />
              ElastiCache Cluster
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Cluster ID</p>
                <p className="font-mono text-sm mt-1">{elasticache.clusterId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engine</p>
                <p className="mt-1 font-medium">
                  {elasticache.engine} {elasticache.engineVersion}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={elasticache.status || 'unknown'} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Node Type</p>
                <p className="mt-1 font-medium">{elasticache.nodeType || 'N/A'}</p>
              </div>
              {elasticache.endpoint && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Endpoint</p>
                    <p className="font-mono text-xs mt-1 truncate">{elasticache.endpoint}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Port</p>
                    <p className="mt-1 font-medium">{elasticache.port}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TLS Encryption</p>
                    <div className="mt-1">
                      <StatusBadge status={elasticache.tls ? 'Enabled' : 'Disabled'} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redis Connection Status */}
      {redis && !redis.connected && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Redis Connection Unavailable</p>
                <p className="text-sm text-muted-foreground">Unable to connect to Redis cache</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redis Memory Usage */}
      {redis?.connected && redis?.info && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MemoryStick className="h-5 w-5 text-blue-500" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Used Memory</p>
                    <p className="text-3xl font-bold">
                      {redis.info.usedMemoryMB} MB
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Max Memory</p>
                    <p className="text-2xl font-bold text-muted-foreground">
                      {redis.info.maxMemoryMB} MB
                    </p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-sm text-muted-foreground mb-1">Usage</p>
                    <p className="text-2xl font-bold">
                      {redis.info.usedMemoryPercent}%
                    </p>
                  </div>
                </div>

                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{
                      width: `${redis.info.usedMemoryPercent}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redis Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <Activity className="h-6 w-6 text-blue-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Connected Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{redis.info.connectedClients}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Database className="h-6 w-6 text-green-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{redis.info.totalKeysCount.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Zap className="h-6 w-6 text-purple-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Hit Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{redis.info.hitRate}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <Clock className="h-6 w-6 text-yellow-500" />
                <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatUptime(redis.info.uptimeSeconds)}</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* OTP Store */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-orange-500" />
            OTP Store
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">Active OTPs</p>
            <p className="text-3xl font-bold">{otpStore.activeCount}</p>
          </div>

          {otpStore.keys.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-2">Recent OTP Keys:</p>
              {otpStore.keys.map((key: string, idx: number) => (
                <div key={idx} className="px-3 py-2 bg-secondary rounded font-mono text-sm">
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active OTPs</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
