'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Server, HardDrive, Activity, Clock, Zap } from 'lucide-react';
import { getHealthStatus, HealthResponse } from '@/lib/api/health-api';

export default function InfrastructureHealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHealthStatus();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch health status');
      console.error('Health check error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: 'connected' | 'disconnected' | 'online') => {
    const statusColors = {
      connected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      online: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      disconnected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getOverallStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
      case 'down':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
    }
  };

  const getOverallStatusText = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'All Systems Operational';
      case 'degraded':
        return 'Some Services Degraded';
      case 'down':
        return 'System Down';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Infrastructure Health</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of all infrastructure services
          </p>
        </div>
        <Button onClick={fetchHealth} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">Failed to fetch health status</p>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Status Banner */}
      {health && (
        <Card className={`border-2 ${getOverallStatusColor(health.status)}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{getOverallStatusText(health.status)}</h2>
                  <p className="text-sm text-muted-foreground">
                    Last checked: {formatLastChecked(lastChecked)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-2xl font-bold capitalize">{health.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && !health && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Cards */}
      {health && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Database Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Database className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                {getStatusBadge(health.services.database.status)}
              </div>
              <CardTitle className="text-lg">Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {health.services.database.latency}ms
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {health.services.database.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redis Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Server className="h-8 w-8 text-red-600 dark:text-red-400" />
                {getStatusBadge(health.services.redis.status)}
              </div>
              <CardTitle className="text-lg">Redis Cache</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {health.services.redis.latency}ms
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {health.services.redis.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <HardDrive className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                {getStatusBadge(health.services.storage.status)}
              </div>
              <CardTitle className="text-lg">S3 Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Latency</span>
                  <span className="font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {health.services.storage.latency}ms
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {health.services.storage.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                {getStatusBadge(health.services.app.status)}
              </div>
              <CardTitle className="text-lg">NestJS App</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatUptime(health.services.app.uptime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-medium">{health.services.app.memoryMB} MB</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Info */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">PostgreSQL Database (RDS)</span>
                <span className="text-muted-foreground">Amazon RDS with SSL enabled</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Redis Cache (ElastiCache)</span>
                <span className="text-muted-foreground">Amazon ElastiCache with TLS</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">S3 Storage</span>
                <span className="text-muted-foreground">Amazon S3 bucket for media storage</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">Application Server</span>
                <span className="text-muted-foreground">NestJS 11 on Node.js</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
