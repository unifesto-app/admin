'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  HardDrive,
  Zap,
  ChevronRight,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function RDSPage() {
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

      const response = await axios.get(`${BASE_URL}/aws/database`, {
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
        setError(err.response?.data?.message || 'Failed to fetch RDS data');
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading RDS data...</p>
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

  const rds = data?.rds;
  const tables = data?.tables || [];
  const migrations = data?.migrations || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">RDS Database</h1>
          <p className="text-muted-foreground mt-1">PostgreSQL database instance and statistics</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* RDS Instance Details */}
      {rds && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-500" />
              RDS Instance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Identifier</p>
                <p className="font-mono text-sm mt-1">{rds.identifier || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Engine</p>
                <p className="mt-1 font-medium">
                  {rds.engine} {rds.engineVersion}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={rds.status || 'unknown'} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage</p>
                <p className="mt-1 font-medium">
                  {rds.storageGB || 0} GB ({rds.storageType})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Metrics */}
      {rds?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <Activity className="h-6 w-6 text-blue-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rds.metrics.cpuPercent || 0}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Database className="h-6 w-6 text-green-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rds.metrics.connectionCount || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <HardDrive className="h-6 w-6 text-purple-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Free Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rds.metrics.freeStorageGB || 0} GB</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Zap className="h-6 w-6 text-yellow-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Read Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rds.metrics.readLatencyMs || 0} ms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Zap className="h-6 w-6 text-orange-500" />
              <CardTitle className="text-sm font-medium text-muted-foreground">Write Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{rds.metrics.writeLatencyMs || 0} ms</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Database Tables */}
      {tables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Table Name</th>
                    <th className="pb-3 font-medium text-right">Row Count</th>
                    <th className="pb-3 font-medium text-right">Size (MB)</th>
                    <th className="pb-3 font-medium text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {tables.map((table: any) => (
                    <tr key={table.name} className="border-b hover:bg-secondary/50 transition-colors group">
                      <td className="py-3">
                        <Link 
                          href={`/dashboard/aws/rds/${table.name}`}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-medium">{table.name}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="py-3 text-right font-semibold">
                        {table.rowCount.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {table.sizeMB ? table.sizeMB.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-3 text-center">
                        {table.rowCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                            Empty
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td className="py-3">Total ({tables.length} tables)</td>
                    <td className="py-3 text-right">
                      {tables.reduce((sum: number, t: any) => sum + t.rowCount, 0).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      {tables.reduce((sum: number, t: any) => sum + (t.sizeMB || 0), 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Migrations */}
      {migrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Migrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {migrations.map((migration: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-mono">{migration.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(migration.appliedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
