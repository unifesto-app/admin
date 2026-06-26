'use client';

import { useState, useEffect, useCallback } from 'react';
import { Inbox, Check, X, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthHeader } from '@/lib/utils/auth';

interface SpaceRequest {
  id: string;
  name: string;
  description: string | null;
  type: string;
  visibility: string;
  city: string | null;
  state: string | null;
  country: string | null;
  tags: string[];
  websiteUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string | null;
    username: string | null;
    mobileNumber: string | null;
    avatarUrl: string | null;
  };
}

export default function SpaceRequestsPage() {
  const [requests, setRequests] = useState<SpaceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const authHeader = getAuthHeader();
      if (!authHeader) throw new Error('Authentication required');

      const query = statusFilter ? `?status=${statusFilter}` : '';
      const response = await fetch(`/api/spaces/requests${query}`, {
        headers: { Authorization: authHeader },
      });

      if (!response.ok) throw new Error('Failed to fetch space requests');

      const data: SpaceRequest[] = await response.json();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch space requests');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this space request? This will create an active space and grant the requester the Organiser role.')) return;
    try {
      setActioningId(id);
      const authHeader = getAuthHeader();
      if (!authHeader) throw new Error('Authentication required');

      const response = await fetch(`/api/spaces/requests/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: authHeader },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to approve request');
      }
      await fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    const reviewNote = prompt('Reason for rejection (optional):') || undefined;
    try {
      setActioningId(id);
      const authHeader = getAuthHeader();
      if (!authHeader) throw new Error('Authentication required');

      const response = await fetch(`/api/spaces/requests/${id}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ reviewNote }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to reject request');
      }
      await fetchRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setActioningId(null);
    }
  };

  const statusBadge = (status: SpaceRequest['status']) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };
    return colors[status] || colors.PENDING;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Space Requests</h1>
          <p className="text-muted-foreground">
            Review and moderate community space creation requests
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No space requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {req.name}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(req.status)}`}>
                        {req.status.toLowerCase()}
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Requested by {req.user.fullName || req.user.username || 'Unknown'}
                      {req.user.mobileNumber ? ` · ${req.user.mobileNumber}` : ''} ·{' '}
                      {new Date(req.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req.id)}
                        disabled={actioningId === req.id}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req.id)}
                        disabled={actioningId === req.id}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {req.description && (
                  <p className="text-sm text-muted-foreground">{req.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {[req.city, req.state, req.country].filter(Boolean).join(', ') || '—'}
                  </span>
                  {req.websiteUrl && (
                    <a
                      href={req.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  )}
                  <span className="inline-flex items-center gap-1">
                    Type: {req.type} · {req.visibility}
                  </span>
                </div>
                {req.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {req.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {req.reviewNote && (
                  <p className="text-sm text-red-600">Review note: {req.reviewNote}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
