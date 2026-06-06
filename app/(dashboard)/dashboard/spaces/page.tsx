'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthHeader } from '@/lib/utils/auth';

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  city: string | null;
  state: string | null;
  country: string | null;
  coOrganiserLimit: number;
  createdAt: string;
  creator: {
    id: string;
    fullName: string | null;
    username: string | null;
  };
  _count: {
    userRoles: number;
    discussions: number;
  };
}

interface SpacesResponse {
  spaces: Space[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function SpacesPage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 10;

  useEffect(() => {
    fetchSpaces();
  }, [currentPage, statusFilter, visibilityFilter]);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(visibilityFilter && { visibility: visibilityFilter }),
      });

      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/spaces?${params}`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch spaces');
      }

      const data: SpacesResponse = await response.json();
      setSpaces(data.spaces);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spaces');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchSpaces();
  };

  const handleRowClick = (spaceId: string) => {
    router.push(`/dashboard/spaces/${spaceId}`);
  };

  const handleCreateSpace = () => {
    router.push('/dashboard/spaces/new');
  };

  const getStatusBadgeColor = (status: Space['status']) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      SUSPENDED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      ARCHIVED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    };
    return colors[status];
  };

  const getVisibilityBadgeColor = (visibility: Space['visibility']) => {
    return visibility === 'PUBLIC'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  };

  const statusCounts = {
    pending: spaces.filter((s) => s.status === 'PENDING').length,
    active: spaces.filter((s) => s.status === 'ACTIVE').length,
    suspended: spaces.filter((s) => s.status === 'SUSPENDED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spaces</h1>
          <p className="text-muted-foreground">
            Manage community spaces and organizations
          </p>
        </div>
        <Button onClick={handleCreateSpace}>
          <Plus className="mr-2 h-4 w-4" />
          Create Space
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Spaces</CardDescription>
            <CardTitle className="text-2xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Approval</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {statusCounts.pending}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {statusCounts.active}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Suspended</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {statusCounts.suspended}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search spaces by name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={visibilityFilter}
                onChange={(e) => {
                  setVisibilityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Visibility</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading spaces...</div>
            </div>
          ) : spaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No spaces found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or create a new space
              </p>
            </div>
          ) : (
            <>
              {/* Spaces Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Space</th>
                      <th className="text-left p-3 font-medium">Slug</th>
                      <th className="text-left p-3 font-medium">Location</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Visibility</th>
                      <th className="text-left p-3 font-medium">Members</th>
                      <th className="text-left p-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spaces.map((space) => (
                      <tr
                        key={space.id}
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleRowClick(space.id)}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                              {space.logoUrl ? (
                                <img
                                  src={space.logoUrl}
                                  alt={space.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Building2 className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{space.name}</div>
                              {space.description && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {space.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-muted-foreground font-mono">
                            @{space.slug}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {space.city && space.country
                            ? `${space.city}, ${space.country}`
                            : space.country || '-'}
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(space.status)}`}
                          >
                            {space.status.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVisibilityBadgeColor(space.visibility)}`}
                          >
                            {space.visibility.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {space._count.userRoles}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(space.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * limit + 1} to{' '}
                  {Math.min(currentPage * limit, total)} of {total} spaces
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
