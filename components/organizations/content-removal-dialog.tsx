/**
 * Content Removal Dialog Component
 * 
 * Handles member removal with content ownership workflow
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, Trash2, UserX, Users } from 'lucide-react';

interface ContentRemovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    id: string;
    user_id: string;
    profile: {
      name: string;
      email: string;
    };
    content_count?: {
      events: number;
      posts: number;
      comments: number;
    };
  };
  organizationId: string;
  organizationName: string;
  onConfirm: (action: 'transfer' | 'delete' | 'anonymize', transferToUserId?: string) => Promise<void>;
}

export default function ContentRemovalDialog({
  isOpen,
  onClose,
  member,
  organizationId,
  organizationName,
  onConfirm,
}: ContentRemovalDialogProps) {
  const [action, setAction] = useState<'transfer' | 'delete' | 'anonymize'>('transfer');
  const [transferToUserId, setTransferToUserId] = useState<string>('');
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentCount = member.content_count || { events: 0, posts: 0, comments: 0 };
  const totalContent = contentCount.events + contentCount.posts + contentCount.comments;
  const hasContent = totalContent > 0;

  useEffect(() => {
    if (isOpen && action === 'transfer') {
      fetchAvailableUsers();
    }
  }, [isOpen, action]);

  const fetchAvailableUsers = async () => {
    try {
      // Fetch organization members who can receive transferred content
      const response = await fetch(`/api/organizations/${organizationId}/members?role=admin,organizer`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter out the member being removed
        const users = data.members
          .filter((m: any) => m.user_id !== member.user_id)
          .map((m: any) => ({
            id: m.user_id,
            name: m.profile?.name || 'Unknown',
            email: m.profile?.email || '',
          }));
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
    }
  };

  const handleConfirm = async () => {
    if (action === 'transfer' && !transferToUserId) {
      setError('Please select a user to transfer content to');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(action, transferToUserId || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <UserX className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">Remove Member</h2>
              <p className="text-gray-600 mt-1">
                You are about to remove <strong>{member.profile.name}</strong> from{' '}
                <strong>{organizationName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Content Summary */}
          {hasContent ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    This member has created content
                  </h3>
                  <div className="space-y-1 text-sm text-yellow-800">
                    {contentCount.events > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{contentCount.events} event(s)</span>
                      </div>
                    )}
                    {contentCount.posts > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{contentCount.posts} post(s)</span>
                      </div>
                    )}
                    {contentCount.comments > 0 && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>{contentCount.comments} comment(s)</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-yellow-700 mt-3">
                    Please choose what should happen to this content:
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700">
                This member has not created any content. They can be removed without any additional
                actions.
              </p>
            </div>
          )}

          {/* Action Selection */}
          {hasContent && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What should happen to their content?
              </label>

              {/* Transfer Option */}
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="action"
                  value="transfer"
                  checked={action === 'transfer'}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Transfer to another member</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Transfer ownership of all content to another admin or organizer in this
                    organization. The content will remain visible and active.
                  </p>
                  {action === 'transfer' && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Transfer to:
                      </label>
                      <select
                        value={transferToUserId}
                        onChange={(e) => setTransferToUserId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a member...</option>
                        {availableUsers.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </label>

              {/* Anonymize Option */}
              <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="action"
                  value="anonymize"
                  checked={action === 'anonymize'}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Keep content, remove attribution</div>
                  <p className="text-sm text-gray-600 mt-1">
                    Keep all content in the organization but remove the member's name and
                    attribution. Content will be marked as "Anonymous".
                  </p>
                </div>
              </label>

              {/* Delete Option */}
              <label className="flex items-start gap-3 p-4 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                <input
                  type="radio"
                  name="action"
                  value="delete"
                  checked={action === 'delete'}
                  onChange={(e) => setAction(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-red-900">Delete all content</div>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete all content created by this member. This action cannot be
                    undone. Events, posts, and comments will be removed.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> The member will be notified about their removal and the action
              taken with their content. They can request a copy of their data before it's deleted.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (action === 'transfer' && !transferToUserId)}
            className="rounded-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              'Removing...'
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Member
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
