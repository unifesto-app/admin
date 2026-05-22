'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Plus,
  Edit,
  Trash2,
  Globe,
  Building2,
  Calendar,
  Users as UsersIcon,
  Search,
  AlertCircle,
  UserCog,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AccessRole {
  id: string;
  name: string;
  code: string;
  scope: 'global' | 'platform' | 'organization' | 'event';
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface UserAccess {
  id: string;
  user_id: string;
  role_id: string;
  role_scope: string;
  organization_id: string | null;
  event_id: string | null;
  status: string;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
  };
  role: {
    id: string;
    name: string;
    code: string;
    scope: string;
  };
  organization?: {
    id: string;
    name: string;
  } | null;
  event?: {
    id: string;
    name: string;
  } | null;
}

export default function RolesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'roles' | 'assignments'>('roles');
  const [roles, setRoles] = useState<AccessRole[]>([]);
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AccessRole | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<UserAccess | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    scope: 'platform' as AccessRole['scope'],
    description: '',
  });
  const [assignFormData, setAssignFormData] = useState({
    user_email: '',
    role_id: '',
    organization_id: '',
    event_id: '',
  });

  useEffect(() => {
    fetchRoles();
    if (activeTab === 'assignments') {
      fetchUserAccess();
    }
  }, [activeTab]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/roles');
      const data = await response.json();
      if (data.roles) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user-access');
      const data = await response.json();
      if (data.access) {
        setUserAccess(data.access);
      }
    } catch (error) {
      console.error('Error fetching user access:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch user access',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create role');
      }

      toast({
        title: 'Success',
        description: 'Role created successfully',
      });

      setIsCreateDialogOpen(false);
      setFormData({ name: '', code: '', scope: 'platform', description: '' });
      fetchRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update role');
      }

      toast({
        title: 'Success',
        description: 'Role updated successfully',
      });

      setIsEditDialogOpen(false);
      setSelectedRole(null);
      setFormData({ name: '', code: '', scope: 'platform', description: '' });
      fetchRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete role');
      }

      toast({
        title: 'Success',
        description: 'Role deleted successfully',
      });

      setIsDeleteDialogOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (role: AccessRole) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      code: role.code,
      scope: role.scope,
      description: role.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (role: AccessRole) => {
    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global':
        return <Globe className="w-4 h-4" />;
      case 'platform':
        return <Shield className="w-4 h-4" />;
      case 'organization':
        return <Building2 className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'global':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'platform':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'organization':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'event':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = !searchTerm || 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesScope = selectedScope === 'all' || role.scope === selectedScope;
    
    return matchesSearch && matchesScope;
  });

  const groupedRoles = filteredRoles.reduce((acc, role) => {
    if (!acc[role.scope]) {
      acc[role.scope] = [];
    }
    acc[role.scope].push(role);
    return acc;
  }, {} as Record<string, AccessRole[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Access Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage access roles and assign them to users
          </p>
        </div>
        {activeTab === 'roles' ? (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Role
          </Button>
        ) : (
          <Button onClick={() => setIsAssignRoleDialogOpen(true)}>
            <UserCog className="w-4 h-4 mr-2" />
            Assign Role
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Card className="p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'roles'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <Shield className="w-4 h-4" />
            Manage Roles
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'assignments'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Manage Role Assignments
          </button>
        </div>
      </Card>

      {/* Roles Tab Content */}
      {activeTab === 'roles' && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedScope} onValueChange={setSelectedScope}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Scopes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scopes</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

      {/* Roles List */}
      {loading ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            Loading roles...
          </div>
        </Card>
      ) : filteredRoles.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No roles found</p>
            <p className="text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRoles).map(([scope, scopeRoles]) => (
            <Card key={scope} className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {getScopeIcon(scope)}
                <h2 className="text-lg font-semibold capitalize">{scope} Roles</h2>
                <span className="text-sm text-muted-foreground">
                  ({scopeRoles.length})
                </span>
              </div>
              <div className="space-y-2">
                {scopeRoles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg border ${getScopeColor(role.scope)}`}>
                        {getScopeIcon(role.scope)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{role.name}</h3>
                          <code className="text-xs px-2 py-0.5 bg-muted rounded">
                            {role.code}
                          </code>
                          {role.is_system && (
                            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                              System
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {!role.is_system && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(role)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-6 bg-muted/50">
        <div className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-lg h-fit">
            <AlertCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">About Access Roles</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><strong>Global:</strong> System-wide roles with highest privileges</li>
              <li><strong>Platform:</strong> Platform-level roles for general access control</li>
              <li><strong>Organization:</strong> Organization-specific roles for managing org resources</li>
              <li><strong>Event:</strong> Event-specific roles for managing individual events</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Note:</strong> System roles cannot be edited or deleted. Role codes must be uppercase with underscores only.
            </p>
          </div>
        </div>
      </Card>
        </>
      )}

      {/* User Access Tab Content */}
      {activeTab === 'assignments' && (
        <>
          <Card className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by user name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>

          {loading ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                Loading user access...
              </div>
            </Card>
          ) : userAccess.length === 0 ? (
            <Card className="p-8">
              <div className="text-center text-muted-foreground">
                <UserCog className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No role assignments found</p>
                <p className="text-sm mt-2">Assign roles to users to get started</p>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="space-y-3">
                {userAccess
                  .filter(access => 
                    !searchTerm ||
                    access.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    access.user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((access) => (
                    <div
                      key={access.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <UsersIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{access.user.name}</div>
                          <div className="text-sm text-muted-foreground">{access.user.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getScopeColor(access.role.scope)}`}>
                            {access.role.name}
                          </div>
                          {access.organization && (
                            <div className="text-sm text-muted-foreground">
                              @ {access.organization.name}
                            </div>
                          )}
                          {access.event && (
                            <div className="text-sm text-muted-foreground">
                              @ {access.event.name}
                            </div>
                          )}
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            access.status === 'active' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {access.status}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccess(access);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Create a new access role with specific scope and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Event Manager"
              />
            </div>
            <div>
              <Label htmlFor="code">Role Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., EVENT_MANAGER"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Uppercase letters and underscores only
              </p>
            </div>
            <div>
              <Label htmlFor="scope">Scope</Label>
              <Select
                value={formData.scope}
                onValueChange={(value: any) => setFormData({ ...formData, scope: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this role can do..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Role Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-code">Role Code</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <Label htmlFor="edit-scope">Scope</Label>
              <Select
                value={formData.scope}
                onValueChange={(value: any) => setFormData({ ...formData, scope: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this role? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedRole.name}</p>
              <code className="text-sm text-muted-foreground">{selectedRole.code}</code>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
