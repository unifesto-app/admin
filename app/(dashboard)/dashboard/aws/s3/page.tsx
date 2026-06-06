'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Cloud,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  FolderOpen,
  HardDrive,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

export default function S3Page() {
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

      const response = await axios.get(`${BASE_URL}/aws/storage`, {
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
        setError(err.response?.data?.message || 'Failed to fetch S3 data');
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading S3 data...</p>
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

  const bucket = data?.bucket;
  const stats = data?.stats || { totalObjects: 0, totalSizeMB: 0 };
  const folders = data?.folders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">S3 Storage</h1>
          <p className="text-muted-foreground mt-1">Object storage buckets and statistics</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* S3 Bucket Details */}
      {bucket && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-green-500" />
              S3 Bucket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bucket Name</p>
                <p className="font-mono text-sm mt-1">{bucket.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Region</p>
                <p className="mt-1 font-medium">{bucket.region || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Versioning</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      bucket.versioning
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {bucket.versioning ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {bucket.versioning ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Public Access</p>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      bucket.publicAccess
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {bucket.publicAccess ? <AlertCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                    {bucket.publicAccess ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <FileText className="h-8 w-8 text-green-500" />
            <CardTitle className="text-lg">Total Objects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalObjects.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground mt-1">files stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <HardDrive className="h-8 w-8 text-blue-500" />
            <CardTitle className="text-lg">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalSizeMB} MB</p>
            <p className="text-sm text-muted-foreground mt-1">storage used</p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Folders */}
      {folders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Storage Folders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {folders.map((folder: any) => (
                <div key={folder.prefix} className="bg-secondary rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                      {folder.prefix}
                    </h4>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">{folder.objectCount} objects</span>
                      <span className="text-muted-foreground">{folder.sizeMB} MB</span>
                    </div>
                  </div>

                  {folder.recentFiles?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground mb-2">Recent Files:</p>
                      {folder.recentFiles.map((file: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 bg-background rounded"
                        >
                          <span className="font-mono truncate flex-1">{file.key}</span>
                          <div className="flex gap-3 ml-2 text-muted-foreground">
                            <span>{file.sizeMB} MB</span>
                            <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
