'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
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
  Clock,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

interface Section {
  id: string;
  name: string;
  icon: React.ElementType;
}

const sections: Section[] = [
  { id: 'overview', name: 'Overview', icon: Activity },
  { id: 'compute', name: 'Compute', icon: Server },
  { id: 'database', name: 'Database', icon: Database },
  { id: 'cache', name: 'Cache', icon: HardDrive },
  { id: 'storage', name: 'Storage', icon: Cloud },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'cost', name: 'Cost', icon: DollarSign },
];

export function AWSAdminDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('unifesto_admin_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await axios.get(`${BASE_URL}/aws/${activeSection}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setData(response.data);
      setCountdown(60);
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
  }, [activeSection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchData]);

  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      healthy: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      running: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      available: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
      warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle },
      degraded: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle },
      unhealthy: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
      unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.unknown;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const renderContent = () => {
    if (loading && !data) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return <OverviewSection data={data} />;
      case 'compute':
        return <ComputeSection data={data} />;
      case 'database':
        return <DatabaseSection data={data} />;
      case 'cache':
        return <CacheSection data={data} />;
      case 'storage':
        return <StorageSection data={data} />;
      case 'security':
        return <SecuritySection data={data} />;
      case 'cost':
        return <CostSection data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-[#1a1a1a] border-r border-gray-800 p-4">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-500" />
            AWS Dashboard
          </h2>
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="bg-[#1a1a1a] border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h1 className="text-2xl font-bold capitalize">{activeSection}</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Region: ap-south-1 (Mumbai)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Refresh in {countdown}s</span>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}

// Shared StatusBadge component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
    healthy: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
    running: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
    available: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
    warning: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle },
    degraded: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: AlertCircle },
    unhealthy: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
    error: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle },
    unknown: { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: AlertCircle },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

// Overview Section
function OverviewSection({ data }: { data: any }) {
  if (!data) return null;

  const services = [
    { name: 'EC2', key: 'ec2', icon: Server, color: 'text-orange-500' },
    { name: 'RDS', key: 'rds', icon: Database, color: 'text-blue-500' },
    { name: 'ElastiCache', key: 'elasticache', icon: HardDrive, color: 'text-red-500' },
    { name: 'S3', key: 's3', icon: Cloud, color: 'text-green-500' },
    { name: 'IAM', key: 'iam', icon: Shield, color: 'text-purple-500' },
  ];

  const costMapping: Record<string, number> = {
    ec2: data.estimatedMonthlyCost?.ec2 || 0,
    rds: data.estimatedMonthlyCost?.rds || 0,
    elasticache: data.estimatedMonthlyCost?.elasticache || 0,
    s3: data.estimatedMonthlyCost?.s3 || 0,
    iam: 0,
  };

  return (
    <div className="space-y-6">
      {/* Total Cost */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Estimated Monthly Cost</p>
            <p className="text-4xl font-bold mt-1">${data.estimatedMonthlyCost?.total || 0}</p>
          </div>
          <DollarSign className="w-12 h-12 text-green-500" />
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => {
          const serviceData = data.services?.[service.key];
          const Icon = service.icon;
          const status = serviceData?.state || serviceData?.status || 'unknown';
          const cost = costMapping[service.key];

          return (
            <div key={service.key} className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon className={`w-6 h-6 ${service.color}`} />
                  <h3 className="font-semibold">{service.name}</h3>
                </div>
                <StatusBadge status={status} />
              </div>

              <div className="space-y-2 text-sm">
                {service.key === 'ec2' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span>{serviceData?.instanceType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP:</span>
                      <span className="font-mono text-xs">{serviceData?.publicIp || 'N/A'}</span>
                    </div>
                  </>
                )}

                {service.key === 'rds' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Engine:</span>
                      <span>{serviceData?.engine || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage:</span>
                      <span>{serviceData?.storageGB || 0} GB</span>
                    </div>
                  </>
                )}

                {service.key === 'elasticache' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span>{serviceData?.nodeType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Engine:</span>
                      <span>{serviceData?.engine || 'N/A'}</span>
                    </div>
                  </>
                )}

                {service.key === 's3' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Bucket:</span>
                      <span className="truncate max-w-[150px]">{serviceData?.bucketName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Region:</span>
                      <span>{serviceData?.region || 'N/A'}</span>
                    </div>
                  </>
                )}

                {service.key === 'iam' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Role:</span>
                      <span className="truncate max-w-[150px]">{serviceData?.roleName || 'N/A'}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between pt-2 mt-2 border-t border-gray-800">
                  <span className="text-gray-400">Cost/month:</span>
                  <span className="font-semibold text-green-500">${cost}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compute Section
function ComputeSection({ data }: { data: any }) {
  if (!data) return null;

  const ec2 = data.ec2;
  const pm2 = data.pm2 || [];

  return (
    <div className="space-y-6">
      {/* EC2 Details */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-orange-500" />
          EC2 Instance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Instance ID</p>
            <p className="font-mono text-sm mt-1">{ec2?.instanceId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Type</p>
            <p className="mt-1">{ec2?.instanceType || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">State</p>
            <div className="mt-1">
              <StatusBadge status={ec2?.state || 'unknown'} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Public IP</p>
            <p className="font-mono text-sm mt-1">{ec2?.publicIp || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CPU */}
        <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
          <p className="text-sm text-gray-400 mb-3">CPU Usage</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold">{ec2?.cpu?.utilizationPercent || 0}%</p>
          </div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${ec2?.cpu?.utilizationPercent || 0}%` }}
            />
          </div>
        </div>

        {/* Memory */}
        <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
          <p className="text-sm text-gray-400 mb-3">Memory Usage</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold">{ec2?.memory?.usedPercent || 0}%</p>
            <p className="text-sm text-gray-400 mb-1">
              {ec2?.memory?.usedMB || 0} / {ec2?.memory?.totalMB || 0} MB
            </p>
          </div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${ec2?.memory?.usedPercent || 0}%` }}
            />
          </div>
        </div>

        {/* Disk */}
        <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
          <p className="text-sm text-gray-400 mb-3">Disk Usage</p>
          <div className="flex items-end gap-3">
            <p className="text-3xl font-bold">{ec2?.disk?.usedPercent || 0}%</p>
            <p className="text-sm text-gray-400 mb-1">
              {ec2?.disk?.usedGB || 0} / {ec2?.disk?.totalGB || 0} GB
            </p>
          </div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${ec2?.disk?.usedPercent || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* PM2 Processes */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">PM2 Processes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-gray-800">
                <th className="pb-3">Name</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Uptime</th>
                <th className="pb-3">Restarts</th>
                <th className="pb-3">Memory</th>
                <th className="pb-3">CPU</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {pm2.map((proc: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-800">
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
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Database Section
function DatabaseSection({ data }: { data: any }) {
  if (!data) return null;

  const rds = data.rds;
  const tables = data.tables || [];
  const migrations = data.migrations || [];

  return (
    <div className="space-y-6">
      {/* RDS Details */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          RDS Instance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Identifier</p>
            <p className="font-mono text-sm mt-1">{rds?.identifier || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Engine</p>
            <p className="mt-1">{rds?.engine} {rds?.engineVersion}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <div className="mt-1">
              <StatusBadge status={rds?.status || 'unknown'} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Storage</p>
            <p className="mt-1">{rds?.storageGB || 0} GB ({rds?.storageType})</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="CPU"
          value={`${rds?.metrics?.cpuPercent || 0}%`}
          color="text-blue-500"
        />
        <MetricCard
          title="Connections"
          value={rds?.metrics?.connectionCount || 0}
          color="text-green-500"
        />
        <MetricCard
          title="Free Storage"
          value={`${rds?.metrics?.freeStorageGB || 0} GB`}
          color="text-purple-500"
        />
        <MetricCard
          title="Read Latency"
          value={`${rds?.metrics?.readLatencyMs || 0} ms`}
          color="text-yellow-500"
        />
        <MetricCard
          title="Write Latency"
          value={`${rds?.metrics?.writeLatencyMs || 0} ms`}
          color="text-orange-500"
        />
      </div>

      {/* Tables */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Database Tables</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tables.map((table: any) => (
            <div key={table.name} className="bg-gray-800/50 rounded-lg p-4">
              <p className="text-sm text-gray-400">{table.name}</p>
              <p className="text-2xl font-bold mt-1">{table.rowCount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Migrations */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Recent Migrations</h3>
        <div className="space-y-2">
          {migrations.map((migration: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
            >
              <p className="text-sm font-mono">{migration.name}</p>
              <p className="text-xs text-gray-400">
                {new Date(migration.appliedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
      <p className="text-sm text-gray-400 mb-2">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

// Cache Section
function CacheSection({ data }: { data: any }) {
  if (!data) return null;

  const elasticache = data.elasticache;
  const redis = data.redis;
  const otpStore = data.otpStore || { activeCount: 0, keys: [] };

  return (
    <div className="space-y-6">
      {/* ElastiCache Details */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-red-500" />
          ElastiCache Cluster
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Cluster ID</p>
            <p className="font-mono text-sm mt-1">{elasticache?.clusterId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Engine</p>
            <p className="mt-1">{elasticache?.engine} {elasticache?.engineVersion}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <div className="mt-1">
              <StatusBadge status={elasticache?.status || 'unknown'} />
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-400">Node Type</p>
            <p className="mt-1">{elasticache?.nodeType || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Redis Info */}
      {redis?.connected && redis?.info && (
        <>
          {/* Memory Usage */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
            <div className="flex items-end gap-4 mb-3">
              <p className="text-3xl font-bold">
                {redis.info.usedMemoryMB} / {redis.info.maxMemoryMB} MB
              </p>
              <p className="text-lg text-gray-400 mb-1">
                {Math.round((redis.info.usedMemoryMB / redis.info.maxMemoryMB) * 100)}%
              </p>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${Math.round((redis.info.usedMemoryMB / redis.info.maxMemoryMB) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Redis Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Connected Clients"
              value={redis.info.connectedClients}
              color="text-blue-500"
            />
            <MetricCard
              title="Total Keys"
              value={redis.info.totalKeysCount}
              color="text-green-500"
            />
            <MetricCard
              title="Hit Rate"
              value={`${redis.info.hitRate}%`}
              color="text-purple-500"
            />
            <MetricCard
              title="Uptime"
              value={formatUptime(redis.info.uptimeSeconds)}
              color="text-yellow-500"
            />
          </div>
        </>
      )}

      {!redis?.connected && (
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-red-800">
          <div className="flex items-center gap-3 text-red-400">
            <XCircle className="w-6 h-6" />
            <p>Redis connection unavailable</p>
          </div>
        </div>
      )}

      {/* OTP Store */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">OTP Store</h3>
        <p className="text-sm text-gray-400 mb-4">
          Active OTPs: <span className="text-white font-semibold">{otpStore.activeCount}</span>
        </p>
        {otpStore.keys.length > 0 && (
          <div className="space-y-2">
            {otpStore.keys.map((key: string, idx: number) => (
              <div key={idx} className="px-3 py-2 bg-gray-800/50 rounded font-mono text-sm">
                {key}
              </div>
            ))}
          </div>
        )}
        {otpStore.keys.length === 0 && (
          <p className="text-sm text-gray-500">No active OTPs</p>
        )}
      </div>
    </div>
  );
}

// Storage Section
function StorageSection({ data }: { data: any }) {
  if (!data) return null;

  const bucket = data.bucket;
  const stats = data.stats || { totalObjects: 0, totalSizeMB: 0 };
  const folders = data.folders || [];

  return (
    <div className="space-y-6">
      {/* S3 Bucket Details */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-green-500" />
          S3 Bucket
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Bucket Name</p>
            <p className="font-mono text-sm mt-1">{bucket?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Region</p>
            <p className="mt-1">{bucket?.region || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Versioning</p>
            <p className="mt-1">{bucket?.versioning ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Public Access</p>
            <p className="mt-1">{bucket?.publicAccess ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Total Objects"
          value={stats.totalObjects.toLocaleString()}
          color="text-green-500"
        />
        <MetricCard
          title="Total Size"
          value={`${stats.totalSizeMB} MB`}
          color="text-blue-500"
        />
      </div>

      {/* Folders */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Storage Folders</h3>
        <div className="space-y-4">
          {folders.map((folder: any) => (
            <div key={folder.prefix} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">{folder.prefix}</h4>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400">
                    {folder.objectCount} objects
                  </span>
                  <span className="text-gray-400">{folder.sizeMB} MB</span>
                </div>
              </div>

              {folder.recentFiles?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 mb-2">Recent Files:</p>
                  {folder.recentFiles.map((file: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 bg-gray-900/50 rounded"
                    >
                      <span className="font-mono truncate flex-1">{file.key}</span>
                      <span className="text-gray-400 ml-2">{file.sizeMB} MB</span>
                      <span className="text-gray-400 ml-2">
                        {new Date(file.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Security Section
function SecuritySection({ data }: { data: any }) {
  if (!data) return null;

  const iamRole = data.iamRole;
  const securityGroups = data.securityGroups || [];

  return (
    <div className="space-y-6">
      {/* IAM Role */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-500" />
          IAM Role
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Role Name</p>
              <p className="font-mono text-sm mt-1">{iamRole?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Created</p>
              <p className="text-sm mt-1">
                {iamRole?.createDate
                  ? new Date(iamRole.createDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {iamRole?.arn && (
            <div>
              <p className="text-sm text-gray-400 mb-1">ARN</p>
              <p className="font-mono text-xs bg-gray-800/50 p-2 rounded">{iamRole.arn}</p>
            </div>
          )}

          {iamRole?.attachedPolicies?.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">Attached Policies</p>
              <div className="space-y-2">
                {iamRole.attachedPolicies.map((policy: any, idx: number) => (
                  <div key={idx} className="bg-gray-800/50 rounded p-3">
                    <p className="font-medium text-sm">{policy.name}</p>
                    <p className="font-mono text-xs text-gray-400 mt-1">{policy.arn}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {iamRole?.lastUsed && (
            <div>
              <p className="text-sm text-gray-400">Last Used</p>
              <p className="text-sm mt-1">
                {new Date(iamRole.lastUsed.date).toLocaleString()} in {iamRole.lastUsed.region}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Security Groups */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Security Groups</h3>
        {securityGroups.map((sg: any) => (
          <div key={sg.id} className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
            <div className="mb-4">
              <h4 className="font-semibold">{sg.name}</h4>
              <p className="text-sm text-gray-400 mt-1">{sg.description}</p>
              <p className="font-mono text-xs text-gray-400 mt-1">{sg.id}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inbound Rules */}
              <div>
                <p className="text-sm font-medium text-green-400 mb-2">
                  Inbound Rules ({sg.inboundRules?.length || 0})
                </p>
                <div className="space-y-2">
                  {sg.inboundRules?.map((rule: any, idx: number) => (
                    <div key={idx} className="bg-gray-800/50 rounded p-2 text-xs">
                      <div className="flex justify-between">
                        <span>{rule.type}</span>
                        <span className="text-gray-400">Port {rule.port}</span>
                      </div>
                      <div className="text-gray-400 mt-1">Source: {rule.source}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outbound Rules */}
              <div>
                <p className="text-sm font-medium text-blue-400 mb-2">
                  Outbound Rules ({sg.outboundRules?.length || 0})
                </p>
                <div className="space-y-2">
                  {sg.outboundRules?.map((rule: any, idx: number) => (
                    <div key={idx} className="bg-gray-800/50 rounded p-2 text-xs">
                      <div className="flex justify-between">
                        <span>{rule.type}</span>
                        <span className="text-gray-400">Port {rule.port}</span>
                      </div>
                      <div className="text-gray-400 mt-1">Dest: {rule.destination}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cost Section
function CostSection({ data }: { data: any }) {
  if (!data) return null;

  const budget = data.budget || { min: 75, max: 99, currency: 'USD' };
  const current = data.current || {};
  const total = data.total || 0;
  const projected = data.projected || 0;
  const withinBudget = data.withinBudget;
  const tips = data.tips || [];

  const budgetPercentage = Math.round((total / budget.max) * 100);

  return (
    <div className="space-y-6">
      {/* Budget Progress */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
        <div className="space-y-4">
          <div className="flex items-end gap-4">
            <div>
              <p className="text-sm text-gray-400">Current Spend</p>
              <p className="text-4xl font-bold text-green-500">${total}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Budget</p>
              <p className="text-2xl font-bold text-gray-400">${budget.max}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Projected</p>
              <p className="text-2xl font-bold text-yellow-500">${projected}</p>
            </div>
            <div className="ml-auto">
              {withinBudget ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Within Budget
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Over Budget
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-400">Budget Usage</span>
              <span className="font-semibold">{budgetPercentage}%</span>
            </div>
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  budgetPercentage < 70
                    ? 'bg-green-500'
                    : budgetPercentage < 90
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Service Breakdown */}
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold mb-4">Cost Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-gray-800">
                <th className="pb-3">Service</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Monthly Cost</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {Object.entries(current).map(([key, value]: [string, any]) => (
                <tr key={key} className="border-b border-gray-800">
                  <td className="py-3">{value.service}</td>
                  <td className="py-3">
                    <StatusBadge status={value.status} />
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {value.monthlyCost === 0 ? (
                      <span className="text-green-500">Free</span>
                    ) : (
                      <span>${value.monthlyCost}</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-3">Total</td>
                <td className="py-3"></td>
                <td className="py-3 text-right text-lg">${total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Saving Tips */}
      {tips.length > 0 && (
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Cost Optimization Tips</h3>
          <div className="space-y-3">
            {tips.map((tip: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
