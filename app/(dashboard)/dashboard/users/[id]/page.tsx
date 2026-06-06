'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Shield, CheckCircle, Edit, Globe, Linkedin, Instagram, Github, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserById } from '@/lib/api/users';
import UserFormModal from '@/components/users/user-form-modal';
import type { Profile } from '@/lib/types/database';

interface Role {
  id: string;
  code: string;
  name: string;
  scope: 'PLATFORM' | 'SPACE';
}

interface UserRoleAssignment {
  id: string;
  roleId: string;
  roleCode: string;
  roleName: string;
  roleScope: 'PLATFORM' | 'SPACE';
  spaceId: string | null;
  assignedAt: string;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleAssignment[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [assigningRole, setAssigningRole] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchAvailableRoles();
    fetchUserRoles();
  }, [resolvedParams.id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserById(resolvedParams.id);
      
      // Transform backend response to match Profile interface
      const backendUser = response.user as any;
      const transformedUser: Profile = {
        id: backendUser.id,
        name: backendUser.fullName || backendUser.name,
        username: backendUser.username,
        avatar_url: backendUser.avatarUrl || backendUser.avatar_url,
        bio: backendUser.bio,
        email: backendUser.email,
        phone: backendUser.mobileNumber || backendUser.phone,
        role: backendUser.roles && backendUser.roles.length > 0 
          ? (typeof backendUser.roles[0] === 'string' ? backendUser.roles[0] : backendUser.roles[0].code) 
          : 'USER',
        roles: backendUser.roles?.map((r: any) => typeof r === 'string' ? r : r.code) || [],
        role_names: backendUser.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [],
        role_count: backendUser.roles?.length || 0,
        is_verified: backendUser.emailVerified || backendUser.mobileVerified || backendUser.is_verified || false,
        preferences: {},
        is_active: backendUser.is_active !== undefined ? backendUser.is_active : true,
        is_banned: backendUser.is_banned || false,
        ban_reason: backendUser.ban_reason || null,
        last_login: backendUser.last_login || null,
        created_at: backendUser.createdAt || backendUser.created_at,
        updated_at: backendUser.updatedAt || backendUser.updated_at,
        wallet_passcode: null,
      };
      
      setUser(transformedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    fetchUser();
  };

  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const roles = await response.json();
        setAvailableRoles(roles);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const response = await fetch(`/api/roles/users/${resolvedParams.id}`);
      if (response.ok) {
        const roles = await response.json();
        setUserRoles(roles);
      }
    } catch (err) {
      console.error('Failed to fetch user roles:', err);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole) return;

    setAssigningRole(true);
    setError('');

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: resolvedParams.id,
          roleId: selectedRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign role');
      }

      await fetchUserRoles();
      await fetchUser();
      setShowRoleModal(false);
      setSelectedRole('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleRemoveRole = async (userRoleId: string) => {
    if (!confirm('Are you sure you want to remove this role?')) return;

    try {
      const response = await fetch(`/api/roles/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userRoleId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove role');
      }

      await fetchUserRoles();
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role');
    }
  };

  const getRoleLabel = (role: any) => {
    if (!role || typeof role !== 'string') return 'No Role';
    
    const roleCodeMap: Record<string, string> = {
      'ADMIN': 'Admin',
      'SUPER_ORGANISER': 'Super Organiser',
      'ORGANISER': 'Organiser',
      'CO_ORGANISER': 'Co-Organiser',
      'MEMBER': 'Member',
      'super_admin': 'Super Admin',
      'admin': 'Admin',
      'organizer': 'Organizer',
      'attendee': 'Attendee',
      'USER': 'User',
    };
    
    return roleCodeMap[role] || String(role).replace(/_/g, ' ');
  };

  const getRoleBadgeColor = (role: any) => {
    if (typeof role !== 'string') return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    
    const roleStr = role.toLowerCase();
    
    if (roleStr === 'admin' || roleStr === 'super_admin') {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
    if (roleStr === 'super_organiser' || roleStr === 'organizer') {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    }
    if (roleStr === 'organiser' || roleStr === 'co_organiser') {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (roleStr === 'member' || roleStr === 'user' || roleStr === 'attendee') {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
    
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getStatusBadgeColor = (user: Profile) => {
    if (user.is_banned) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    if (user.is_active) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getStatusText = (user: Profile) => {
    if (user.is_banned) return 'Banned';
    if (user.is_active) return 'Active';
    return 'Inactive';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading user details...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Card className="border-red-200">
          <CardContent className="p-8">
            <p className="text-red-600">{error || 'User not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
        </div>
        <Button onClick={() => setShowEditModal(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* User Profile Card */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold">
                {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </div>
              {user.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 border-2 border-background">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{user.name || 'No Name'}</h2>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="mr-1 h-3 w-3" />
                  {getRoleLabel(user.role)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user)}`}>
                  {getStatusText(user)}
                </span>
              </div>
              {user.username && (
                <p className="text-muted-foreground mb-3">@{user.username}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {user.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Bio Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Biography</h3>
              {user.bio ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No biography provided</p>
              )}
            </div>

            {/* Social Links Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not provided</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <Instagram className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not provided</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not provided</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not provided</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Account Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account Status</CardTitle>
            <CardDescription>Current account state and verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active</span>
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {user.is_active ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Verified</span>
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                {user.is_verified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Banned</span>
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${user.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {user.is_banned ? 'Yes' : 'No'}
              </span>
            </div>
            {user.is_banned && user.ban_reason && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs font-medium text-red-800">{user.ban_reason}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Information</CardTitle>
            <CardDescription>Account timestamps and metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-xs text-muted-foreground block mb-1">User ID</span>
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{user.id}</code>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Created At</span>
              <span className="text-sm">
                {new Date(user.created_at).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block mb-1">Last Updated</span>
              <span className="text-sm">
                {new Date(user.updated_at).toLocaleString()}
              </span>
            </div>
            {user.last_login && (
              <div>
                <span className="text-xs text-muted-foreground block mb-1">Last Login</span>
                <span className="text-sm">
                  {new Date(user.last_login).toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles Management */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">User Roles</CardTitle>
                <CardDescription>Manage user's platform and space-level role assignments</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowRoleModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Role
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {userRoles.length > 0 ? (
              <div className="space-y-2">
                {userRoles.map((userRole) => (
                  <div key={userRole.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole.roleCode)}`}>
                        <Shield className="mr-1 h-3 w-3" />
                        {userRole.roleName}
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {userRole.roleScope === 'PLATFORM' ? '🌐 Platform Role' : '📍 Space Role'}
                          {userRole.spaceId && (
                            <span className="ml-1 font-mono">• Space ID: {userRole.spaceId.substring(0, 8)}...</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Assigned on {new Date(userRole.assignedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(userRole.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Remove role"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No roles assigned yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click "Assign Role" to add a role</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRoleModal(false)}>
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Assign Role to User</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Grant a platform-wide role to this user
                </p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={assigningRole}
                >
                  <option value="">Choose a role...</option>
                  {availableRoles
                    .filter(role => !userRoles.some(ur => ur.roleId === role.id))
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.scope === 'PLATFORM' ? '🌐' : '📍'} {role.name} • {role.scope}
                      </option>
                    ))}
                </select>
                {availableRoles.length === 0 ? (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <span>⚠️</span> All available roles have been assigned to this user
                  </p>
                ) : (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      • <strong>Platform roles</strong> apply system-wide
                    </p>
                    <p className="text-xs text-muted-foreground">
                      • <strong>Space roles</strong> are assigned in the Space detail page
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedRole('');
                    setError('');
                  }}
                  disabled={assigningRole}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handleAssignRole}
                  disabled={!selectedRole || assigningRole}
                >
                  {assigningRole ? 'Assigning...' : 'Assign Role'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      <UserFormModal
        user={user}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
