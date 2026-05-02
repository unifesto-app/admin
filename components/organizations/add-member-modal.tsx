'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  avatar_url: string | null;
}

interface AddMemberModalProps {
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({
  organizationId,
  onClose,
  onSuccess,
}: AddMemberModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const searchUsers = async () => {
    if (!search || search.length < 2) {
      setUsers([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/users?search=${encodeURIComponent(search)}&limit=10`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUserId,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search User <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* User Results */}
            {searching && (
              <div className="mt-2 text-sm text-gray-500">Searching...</div>
            )}
            
            {users.length > 0 && (
              <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setSearch(user.name || user.email);
                      setUsers([]);
                    }}
                    className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 ${
                      selectedUserId === user.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium">{user.name || 'No name'}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
                    {user.username && (
                      <div className="text-xs text-gray-500">@{user.username}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
            
            {search.length >= 2 && !searching && users.length === 0 && (
              <div className="mt-2 text-sm text-gray-500">No users found</div>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="member">Member</option>
              <option value="organizer">Organizer</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {role === 'owner' && 'Full control over the organization'}
              {role === 'admin' && 'Can manage members and settings'}
              {role === 'organizer' && 'Can create and manage events'}
              {role === 'member' && 'Basic member access'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedUserId}
              className="rounded-full"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
