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
  Shield,
  DollarSign,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function OverviewPage() {
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

      const response = await axios.get(`${BASE_URL}/aws/overview`, {
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
        setError(err.response?.data?.message || 'Failed to fetch overview data');
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
      healthy: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      running: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      available: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle },
      error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
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
          <p className="text-sm text-muted-foreground">Loading overview...</p>
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

  const services = data?.services || {};
  const costs = data?.estimatedMonthlyCost || {};

  const serviceCards = [
    {
      name: 'EC2',
      key: 'ec2',
      icon: Server,
      color: 'text-orange-500',
      details: [
        { label: 'Type', value: services.ec2?.instanceType },
        { label: 'Public IP', value: services.ec2?.publicIp },
      ],
    },
    {
      name: 'RDS',
      key: 'rds',
      icon: Database,
      color: 'text-blue-500',
      details: [
        { label: 'Engine', value: services.rds?.engine },
        { label: 'Storage', value: `${services.rds?.storageGB || 0} GB` },
      ],
    },
    {
      name: 'ElastiCache',
      key: 'elasticache',
      icon: HardDrive,
      color: 'text-red-500',
      details: [
        { label: 'Node Type', value: services.elasticache?.nodeType },
        { label: 'Engine', value: services.elasticache?.engine },
      ],
    },
    {
      name: 'S3',
      key: 's3',
      icon: Cloud,
      color: 'text-green-500',
      details: [
        { label: 'Bucket', value: services.s3?.bucketName },
        { label: 'Region', value: services.s3?.region },
      ],
    },
    {
      name: 'IAM',
      key: 'iam',
      icon: Shield,
      color: 'text-purple-500',
      details: [
        { label: 'Role', value: services.iam?.roleName },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AWS Overview</h1>
          <p className="text-muted-foreground mt-1">
            Region: {data?.region || 'ap-south-1'} (Mumbai)
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Total Cost Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Estimated Monthly Cost</p>
              <p className="text-4xl font-bold">${costs.total || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">All AWS services</p>
            </div>
            <DollarSign className="w-16 h-16 text-primary/50" />
          </div>
        </CardContent>
      </Card>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {serviceCards.map((service) => {
          const Icon = service.icon;
          const serviceData = services[service.key];
          const status = serviceData?.state || serviceData?.status || 'unknown';
          const cost = costs[service.key] || 0;
          const hasError = serviceData?.error;

          return (
            <Card key={service.key} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-8 h-8 ${service.color}`} />
                  <StatusBadge status={hasError ? 'error' : status} />
                </div>
                <CardTitle className="text-xl">{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {!hasError ? (
                    <>
                      {service.details.map((detail, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{detail.label}:</span>
                          <span className="font-medium truncate ml-2 max-w-[150px]">
                            {detail.value || 'N/A'}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 mt-2 border-t">
                        <span className="text-sm text-muted-foreground">Cost/month:</span>
                        <span className="font-semibold text-green-500">${cost}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-destructive">
                      Failed to fetch service data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(costs)
              .filter(([key]) => key !== 'total')
              .map(([key, value]: [string, any]) => {
                const percentage = costs.total > 0 ? Math.round((value / costs.total) * 100) : 0;
                const service = serviceCards.find((s) => s.key === key);
                const Icon = service?.icon || Activity;

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium capitalize">{key}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{percentage}%</span>
                        <span className="font-bold">${value}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/dashboard/aws/health">
                <Activity className="w-6 h-6" />
                <span className="text-sm">Infrastructure Health</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/dashboard/aws/ec2">
                <Server className="w-6 h-6" />
                <span className="text-sm">EC2 Details</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/dashboard/aws/rds">
                <Database className="w-6 h-6" />
                <span className="text-sm">Database</span>
              </a>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <a href="/dashboard/aws/billing">
                <DollarSign className="w-6 h-6" />
                <span className="text-sm">Billing</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
