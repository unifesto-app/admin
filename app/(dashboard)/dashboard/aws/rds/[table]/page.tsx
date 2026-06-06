'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Database,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Table2,
  Code,
  List,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const BASE_URL = 'https://api.unifesto.app';

type ViewMode = 'schema' | 'data';

export default function TableDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tableName = params.table as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('schema');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('unifesto_admin_token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const response = await axios.get(`${BASE_URL}/aws/database/table/${tableName}`, {
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
        setError(err.response?.data?.message || 'Failed to fetch table data');
      }
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading table data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/aws/rds">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to RDS
            </Link>
          </Button>
        </div>
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

  const schema = data?.schema || [];
  const rows = data?.rows || [];
  const stats = data?.stats || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/aws/rds">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to RDS
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8 text-blue-500" />
            {tableName}
          </h1>
          <p className="text-muted-foreground">Table schema and data</p>
        </div>
        <Button onClick={fetchData} disabled={loading} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Table Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Table2 className="h-6 w-6 text-blue-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.rowCount?.toLocaleString() || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <List className="h-6 w-6 text-green-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{schema.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Database className="h-6 w-6 text-purple-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.sizeMB?.toFixed(2) || '0.00'} MB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Eye className="h-6 w-6 text-orange-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Sample Size</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{rows.length}</p>
            <p className="text-xs text-muted-foreground mt-1">rows shown</p>
          </CardContent>
        </Card>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-2 border-b">
        <Button
          variant={viewMode === 'schema' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('schema')}
          className="rounded-b-none"
        >
          <Code className="h-4 w-4 mr-2" />
          Schema
        </Button>
        <Button
          variant={viewMode === 'data' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('data')}
          className="rounded-b-none"
        >
          <Table2 className="h-4 w-4 mr-2" />
          Data
        </Button>
      </div>

      {/* Schema View */}
      {viewMode === 'schema' && (
        <Card>
          <CardHeader>
            <CardTitle>Table Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 font-medium">Column Name</th>
                    <th className="pb-3 font-medium">Data Type</th>
                    <th className="pb-3 font-medium">Nullable</th>
                    <th className="pb-3 font-medium">Default</th>
                    <th className="pb-3 font-medium">Key</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {schema.map((column: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3">
                        <span className="font-mono font-medium">{column.columnName}</span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                          {column.dataType}
                        </span>
                      </td>
                      <td className="py-3">
                        {column.isNullable === 'YES' ? (
                          <span className="text-muted-foreground">YES</span>
                        ) : (
                          <span className="text-orange-500 font-medium">NOT NULL</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="font-mono text-xs text-muted-foreground">
                          {column.columnDefault || '-'}
                        </span>
                      </td>
                      <td className="py-3">
                        {column.columnKey === 'PRI' && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                            PRIMARY
                          </span>
                        )}
                        {column.columnKey === 'UNI' && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                            UNIQUE
                          </span>
                        )}
                        {column.columnKey === 'MUL' && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
                            INDEX
                          </span>
                        )}
                        {!column.columnKey && <span className="text-muted-foreground">-</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data View */}
      {viewMode === 'data' && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Data (First {rows.length} rows)</CardTitle>
          </CardHeader>
          <CardContent>
            {rows.length > 0 ? (
              <div className="space-y-2">
                {rows.map((row: any, rowIdx: number) => {
                  const isExpanded = expandedRows.has(rowIdx);
                  const columns = Object.keys(row);
                  const firstFewColumns = columns.slice(0, 4);
                  const remainingColumns = columns.slice(4);

                  return (
                    <div key={rowIdx} className="border rounded-lg overflow-hidden">
                      {/* Row Header */}
                      <div
                        className="flex items-center justify-between p-3 bg-secondary cursor-pointer hover:bg-secondary/80"
                        onClick={() => toggleRowExpansion(rowIdx)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs font-mono text-muted-foreground">
                            Row {rowIdx + 1}
                          </span>
                          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
                            {firstFewColumns.map((key) => (
                              <div key={key} className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">{key}:</span>
                                <span className="text-xs font-mono">
                                  {row[key] !== null
                                    ? String(row[key]).substring(0, 30)
                                    : 'null'}
                                  {String(row[key]).length > 30 && '...'}
                                </span>
                              </div>
                            ))}
                            {remainingColumns.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                +{remainingColumns.length} more
                              </span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <div className="p-4 bg-background space-y-2">
                          {columns.map((key) => (
                            <div
                              key={key}
                              className="flex items-start gap-3 pb-2 border-b last:border-0"
                            >
                              <span className="text-sm font-medium text-muted-foreground min-w-[150px]">
                                {key}
                              </span>
                              <span className="text-sm font-mono flex-1 break-all">
                                {row[key] !== null ? String(row[key]) : (
                                  <span className="text-muted-foreground italic">null</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold mb-1">No Data</p>
                <p className="text-sm text-muted-foreground">This table is empty</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
