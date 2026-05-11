'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Crown, 
  Users as UsersIcon, 
  User,
  Search,
  Edit
} from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  name: string | null;
  role: 'attendee' | 'organizer' | 'org_admin' | 'org_super_admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
}

export default function RolesPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users?limit=1000');
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-5 h-5" />;
      case 'org_super_admin':
        return <Crown className="w-5 h-5" />;
      case 'org_admin':
        return <Shield className="w-5 h-5" />;
      case 'organizer':
        return <UsersIcon className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'org_super_admin':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'org_admin':
        return 'bg-muted text-foreground border-border';
      case 'organizer':
        return 'bg-muted text-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'org_super_admin':
        return 'Org Super Admin';
      case 'org_admin':
        return 'Org Admin';
      case 'organizer':
        return 'Organizer';
      case 'attendee':
        return 'Attendee';
      default:
        return role;
    }
  };

  const filteredUsers = users.filter(user => {
    // Exclude attendees from the list
    if (user.role === 'attendee') return false;
    
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-1">
          Manage user roles and their permissions across the platform
        </p>
      </div>

      {/* Users with Roles */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Users with Roles</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="org_super_admin">Org Super Admin</option>
              <option value="org_admin">Org Admin</option>
              <option value="organizer">Organizer</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No users found with the selected criteria</p>
            <p className="text-sm mt-2">Attendees are not shown in this view</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{user.name || 'No name'}</h3>
                      {!user.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                  className="ml-4"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-muted/50">
        <div className="flex gap-3">
          <div className="p-2 bg-primary/10 rounded-lg h-fit">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Managing Roles & Permissions</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><strong>1. View Role Details</strong> - Click on any role card to expand and see its permissions</li>
              <li><strong>2. Edit User Roles</strong> - Click "Edit" next to any user to change their role</li>
              <li><strong>3. Search & Filter</strong> - Use the search bar and role filter to find specific users</li>
              <li><strong>4. Attendees</strong> - Regular users (attendees) are managed in the <a href="/dashboard/users" className="underline font-medium text-primary">Users</a> section</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-3">
              <strong>Note:</strong> Only users with elevated roles (Organizer and above) are shown here. Platform Super Admins have full access to all features.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
