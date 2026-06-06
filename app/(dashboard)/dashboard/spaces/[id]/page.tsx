'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Users,
  MessageSquare,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Ban,
  Archive,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthHeader } from '@/lib/utils/auth';

interface Space {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  tags: string[];
  visibility: 'PUBLIC' | 'PRIVATE';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  coOrganiserLimit: number;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    fullName: string | null;
    username: string | null;
  };
  userRoles: Array<{
    id: string;
    user: {
      id: string;
      fullName: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
    role: {
      id: string;
      code: string;
      name: string;
      scope: string;
    };
    createdAt: string;
  }>;
  _count: {
    discussions: number;
  };
}

interface Role {
  id: string;
  code: string;
  name: string;
  scope: 'PLATFORM' | 'SPACE';
}

interface Discussion {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  createdAt: string;
  author: {
    id: string;
    fullName: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [space, setSpace] = useState<Space | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigningRole, setAssigningRole] = useState(false);

  useEffect(() => {
    fetchSpace();
    fetchDiscussions();
    fetchAvailableRoles();
  }, [resolvedParams.id]);

  const fetchSpace = async () => {
    try {
      setLoading(true);
      setError('');

      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/spaces/${resolvedParams.id}`, {
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch space');
      }

      const data = await response.json();
      setSpace(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch space');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussions = async () => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        return; // Silently fail for discussions
      }

      const response = await fetch(
        `/api/discussions/space/${resolvedParams.id}?limit=5`,
        {
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiscussions(data.discussions || []);
      }
    } catch (err) {
      console.error('Failed to fetch discussions:', err);
    }
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const roles = await response.json();
        // Filter to show only space-scoped roles
        setAvailableRoles(roles.filter((r: Role) => r.scope === 'SPACE'));
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const handleUpdateStatus = async (
    status: Space['status'],
    rejectionReason?: string
  ) => {
    if (!space) return;

    const confirmMessage =
      status === 'APPROVED'
        ? 'Approve this space?'
        : status === 'REJECTED'
          ? 'Reject this space?'
          : status === 'SUSPENDED'
            ? 'Suspend this space?'
            : status === 'ACTIVE'
              ? 'Activate this space?'
              : `Change status to ${status}?`;

    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/spaces/${space.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ status, rejectionReason }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchSpace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!space) return;

    if (
      !confirm(
        'Are you sure you want to delete this space? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/spaces/${space.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: authHeader,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete space');
      }

      router.push('/dashboard/spaces');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete space');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole || !selectedUserId) return;

    setAssigningRole(true);
    setError('');

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          roleId: selectedRole,
          spaceId: resolvedParams.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign role');
      }

      await fetchSpace();
      setShowRoleModal(false);
      setSelectedRole('');
      setSelectedUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRemoveRole = async (userRoleId: string) => {
    if (!confirm('Remove this role assignment?')) return;

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/roles/remove', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({ userRoleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove role');
      }

      await fetchSpace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    }
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

  const getRoleBadgeColor = (roleCode: string) => {
    const colors: Record<string, string> = {
      SUPER_ORGANISER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ORGANISER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      CO_ORGANISER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[roleCode] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading space...</div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Space not found'}</p>
        <Button onClick={() => router.push('/dashboard/spaces')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Spaces
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/dashboard/spaces')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{space.name}</h1>
            <p className="text-muted-foreground">@{space.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/dashboard/spaces/${space.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Banner */}
      {space.bannerUrl && (
        <Card>
          <CardContent className="p-0">
            <img
              src={space.bannerUrl}
              alt={space.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 md:col-span-2">
          {/* Space Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                    {space.logoUrl ? (
                      <img
                        src={space.logoUrl}
                        alt={space.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <CardTitle>{space.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {space.description || 'No description provided'}
                    </CardDescription>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(space.status)}`}
                >
                  {space.status.toLowerCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {space.websiteUrl && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={space.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {space.websiteUrl}
                    </a>
                  </div>
                )}
                {(space.city || space.country) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {[space.city, space.state, space.country]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
                {space.tags && space.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {space.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Members Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Members</CardTitle>
                  <CardDescription>
                    {space.userRoles.length} member(s) • Co-Organiser limit:{' '}
                    {space.coOrganiserLimit}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowRoleModal(true)} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Assign Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {space.userRoles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members yet
                </p>
              ) : (
                <div className="space-y-3">
                  {space.userRoles.map((userRole) => (
                    <div
                      key={userRole.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {userRole.user.fullName?.[0]?.toUpperCase() ||
                              userRole.user.username?.[0]?.toUpperCase() ||
                              '?'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">
                            {userRole.user.fullName || userRole.user.username || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole.role.code)}`}
                            >
                              {userRole.role.name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRole(userRole.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discussions Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Discussions</CardTitle>
                  <CardDescription>
                    {space._count.discussions} discussion(s)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {discussions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No discussions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {discussions.map((discussion) => (
                    <div
                      key={discussion.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{discussion.title}</div>
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {discussion.content}
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {discussion.replyCount} replies
                            </span>
                            <span>{discussion.viewCount} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {space.status === 'PENDING' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleUpdateStatus('APPROVED')}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) handleUpdateStatus('REJECTED', reason);
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {space.status === 'APPROVED' && (
                <Button
                  className="w-full"
                  onClick={() => handleUpdateStatus('ACTIVE')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Activate
                </Button>
              )}
              {space.status === 'ACTIVE' && (
                <>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleUpdateStatus('INACTIVE')}
                  >
                    <Pause className="mr-2 h-4 w-4" />
                    Deactivate
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => handleUpdateStatus('SUSPENDED')}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                </>
              )}
              {(space.status === 'INACTIVE' || space.status === 'SUSPENDED') && (
                <Button
                  className="w-full"
                  onClick={() => handleUpdateStatus('ACTIVE')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Activate
                </Button>
              )}
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleUpdateStatus('ARCHIVED')}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Space ID</div>
                <div className="font-mono text-xs mt-1">{space.id}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Visibility</div>
                <div className="mt-1">{space.visibility}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Created By</div>
                <div className="mt-1">
                  {space.creator.fullName || space.creator.username || 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Created</div>
                <div className="mt-1">
                  {new Date(space.createdAt).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Updated</div>
                <div className="mt-1">
                  {new Date(space.updatedAt).toLocaleString()}
                </div>
              </div>
              {space.approvedAt && (
                <div>
                  <div className="text-muted-foreground">Approved</div>
                  <div className="mt-1">
                    {new Date(space.approvedAt).toLocaleString()}
                  </div>
                </div>
              )}
              {space.rejectedAt && space.rejectionReason && (
                <div>
                  <div className="text-muted-foreground">Rejection Reason</div>
                  <div className="mt-1 text-red-600">{space.rejectionReason}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Role Assignment Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Role</CardTitle>
              <CardDescription>
                Assign a space role to a user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">User ID</label>
                <input
                  type="text"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full px-3 py-2 border border-input rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md"
                >
                  <option value="">Select a role</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAssignRole}
                  disabled={assigningRole || !selectedRole || !selectedUserId}
                >
                  {assigningRole ? 'Assigning...' : 'Assign Role'}
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedRole('');
                    setSelectedUserId('');
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
