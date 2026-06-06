'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateUser } from '@/lib/api/users';
import type { Profile } from '@/lib/types/database';

interface UserFormModalProps {
  user?: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserFormModal({ user, isOpen, onClose, onSuccess }: UserFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    linkedinUrl: '',
    instagramUrl: '',
    githubUrl: '',
    websiteUrl: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '',
        username: user.username || '',
        bio: user.bio || '',
        linkedinUrl: '',
        instagramUrl: '',
        githubUrl: '',
        websiteUrl: '',
      });
    } else {
      setFormData({
        fullName: '',
        username: '',
        bio: '',
        linkedinUrl: '',
        instagramUrl: '',
        githubUrl: '',
        websiteUrl: '',
      });
    }
    setError('');
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('No user selected for editing');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Update existing user
      await updateUser(user.id, {
        fullName: formData.fullName || undefined,
        username: formData.username || undefined,
        bio: formData.bio || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user';
      console.error('User update error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit User</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              <div className="font-semibold">❌ {error}</div>
            </div>
          )}

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Bio - Full Width */}
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Social Links Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Social Links</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-medium mb-2">LinkedIn URL</label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium mb-2">Instagram URL</label>
                <input
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* GitHub */}
              <div>
                <label className="block text-sm font-medium mb-2">GitHub URL</label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium mb-2">Website URL</label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          <div className="p-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
            <div className="font-semibold mb-2">📝 Note</div>
            <ul className="list-disc ml-4 space-y-1 text-xs">
              <li>Email and phone number are managed via user identities</li>
              <li>Role assignments are managed via the roles management system</li>
              <li>Avatar can be uploaded by the user in their profile</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Update User'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
