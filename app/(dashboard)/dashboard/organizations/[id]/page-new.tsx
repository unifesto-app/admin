/**
 * Organization Detail Page (Updated with RBAC)
 * 
 * This is the updated version using the new backend APIs
 * Rename this file to page.tsx to replace the old version
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { brandGradient } from '@/lib/styles';
import AddMemberModal from '@/components/organizations/add-member-modal';
import ContentRemovalDialog from '@/components/organizations/content-removal-dialog';
import SuperAdminIndicator from '@/components/organizations/super-admin-indicator';
import HierarchyTree, { HierarchyPath, DepthIndicator } from '@/components/organizations/hierarchy-tree';
import RoleBadge from '@/components/ui/role-badge';
import { usePermissions } from '@/components/permissions/permission-guard';
import {
  getOrganization,
  getOrganizationHierarchy,
  deleteOrganization,
} from '@/lib/api/organizations-api';
import {
  getOrganizationMembers,
  updateMemberRole,
  removeMember,
} from '@/lib/api/members-api';
import {
  OrganizationWithHierarchy,
  MemberWithProfile,
  HierarchyNode,
  Role,
  ROLE_LABELS,
  ROLE_COLORS,
  ORG_TYPE_LABELS,
} from '@/lib/types/rbac';
import {
  Building2,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Shield,
  Globe,
  Mail,
  Phone,
  MapPin,
  UserPlus,
  Plus,
  Network,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

type TabType = 'overview' | 'members' | 'sub-orgs' | 'hierarchy' | 'analytics';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<OrganizationWithHierarchy | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [hierarchyTree, setHierarchyTree] = useState<HierarchyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<MemberWithProfile | null>(null);

  const { isPlatformAdmin, loading: permissionsLoading } = usePermissions(orgId);

  useEffect(() => {
    fetchOrganization();
    fetchMembers();
  }, [orgId]);

  useEffect(() => {
    if (activeTab === 'hierarchy') {
      fetchHierarchy();
    }
  }, [activeTab, orgId]);

  const fetchOrganization = async () => {
    try {
      const { data, error: apiError } = await getOrganization(orgId);

      if (apiError || !data) {
        console.error('Error fetching organization:', apiError);
        setError(apiError?.message || 'Failed to load organization');
        if (apiError?.status === 404) {
          setTimeout(() => {
            router.push('/dashboard/organizations');
          }, 2000);
        }
      } else {
        setOrganization(data);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error: apiError } = await getOrganizationMembers(orgId);

      if (!apiError && data) {
        setMembers(data);
      } else {
        console.error('Error fetching members:', apiError);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchHierarchy = async () => {
    try {
      const { data, error: apiError } = await getOrganizationHierarchy(orgId);

      if (!apiError && data) {
        setHierarchyTree(data);
      } else {
        console.error('Error fetching hierarchy:', apiError);
      }
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const { error: apiError } = await deleteOrganization(orgId);

      if (!apiError) {
        router.push('/dashboard/organizations');
      } else {
        alert(`Error: ${apiError.message}`);
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization');
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: Role) => {
    try {
      const { error: apiError } = await updateMemberRole(orgId, memberId, { role: newRole });

      if (!apiError) {
        fetchMembers();
      } else {
        alert(`Error: ${apiError.message}`);
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role');
    }
  };

  const handleRemoveMember = async (
    action: 'transfer' | 'delete' | 'anonymize',
    transferToUserId?: string
  ) => {
    if (!memberToRemove) return;

    try {
      // In a real implementation, this would call a content removal API
      // For now, we'll just remove the member
      const { error: apiError } = await removeMember(orgId, memberToRemove.id);

      if (!apiError) {
        fetchMembers();
        fetchOrganization();
        setMemberToRemove(null);
      } else {
        throw new Error(apiError.message);
      }
    } catch (error: any) {
      throw error;
    }
  };

  if (loading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-500 text-lg font-semibold">{error}</div>
        <p className="text-gray-600">Redirecting to organizations list...</p>
        <Link href="/dashboard/organizations">
          <Button className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Organizations
          </Button>
        </Link>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-gray-500">Organization not found</div>
        <Link href="/dashboard/organizations">
          <Button className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Organizations
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/organizations">
            <Button variant="outline" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{organization.name}</h1>
              {organization.super_admin_id && (
                <Shield className="w-6 h-6 text-blue-600" title="Has Super Admin" />
              )}
            </div>
            {organization.hierarchy_path && organization.hierarchy_path.length > 1 && (
              <HierarchyPath path={organization.hierarchy_path} className="mt-2" />
            )}
            <DepthIndicator currentDepth={organization.depth_level} className="mt-2" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/organizations/${orgId}/edit`}>
            <Button variant="outline" className="rounded-full">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          {isPlatformAdmin && (
            <Button
              variant="outline"
              className="rounded-full text-red-600 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Super Admin Indicator */}
      {organization.super_admin && (
        <SuperAdminIndicator
          organizationId={orgId}
          organizationName={organization.name}
          superAdmin={organization.super_admin}
          canTransfer={isPlatformAdmin}
        />
      )}

      {/* Banner */}
      {organization.banner_url && (
        <div className="w-full h-48 rounded-lg overflow-hidden">
          <img
            src={organization.banner_url}
            alt={organization.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tabs */}
      <Card className="p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Members ({organization.member_count})
          </button>
          <button
            onClick={() => setActiveTab('sub-orgs')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sub-orgs'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Sub-Organizations ({organization.sub_org_count})
          </button>
          <button
            onClick={() => setActiveTab('hierarchy')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'hierarchy'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Network className="w-4 h-4 inline mr-2" />
            Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-100 text-blue-900'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Analytics
          </button>
        </div>
      </Card>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2 p-6 space-y-6">
            <div className="flex items-start gap-4">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg flex items-center justify-center" style={{ background: brandGradient }}>
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                    {ORG_TYPE_LABELS[organization.type] || organization.type}
                  </span>
                  {organization.is_verified && (
                    <span className="flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 border border-green-300">
                      <Shield className="w-4 h-4" />
                      Verified
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      organization.is_active
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-800 border border-gray-300'
                    }`}
                  >
                    {organization.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-gray-700">{organization.description || 'No description'}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 pt-6 border-t">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              {organization.website && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {organization.website}
                  </a>
                </div>
              )}
              {organization.email && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${organization.email}`} className="hover:underline">
                    {organization.email}
                  </a>
                </div>
              )}
              {organization.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${organization.phone}`} className="hover:underline">
                    {organization.phone}
                  </a>
                </div>
              )}
              {(organization.address || organization.city || organization.state) && (
                <div className="flex items-start gap-3 text-gray-700">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    {organization.address && <div>{organization.address}</div>}
                    <div>
                      {[organization.city, organization.state, organization.country]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Members</h3>
              </div>
              <p className="text-3xl font-bold">{organization.member_count}</p>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Sub-Organizations</h3>
              </div>
              <p className="text-3xl font-bold">{organization.sub_org_count}</p>
            </Card>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddMemberModal(true)} className="rounded-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              {members.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No members found</p>
                  <p className="text-sm mt-2">Add members to this organization to get started.</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      {member.profile?.avatar_url ? (
                        <img
                          src={member.profile.avatar_url}
                          alt={member.profile.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{member.profile?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">{member.profile?.email}</div>
                        {member.content_count && (
                          <div className="text-xs text-gray-500 mt-1">
                            {member.content_count.events} events
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.id, e.target.value as Role)}
                        className={`px-3 py-1 text-sm font-medium rounded-full border ${
                          ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                        disabled={!isPlatformAdmin && member.role === 'owner'}
                      >
                        <option value="owner">Org Super Admin</option>
                        <option value="admin">Org Admin</option>
                        <option value="organizer">Organizer</option>
                        <option value="member">Member</option>
                      </select>
                      <div className="text-sm text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full text-red-600 hover:bg-red-50"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Sub-Organizations Tab */}
      {activeTab === 'sub-orgs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            {organization.depth_level < 4 && (
              <Link href={`/dashboard/organizations/new?parent_org_id=${orgId}`}>
                <Button className="rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sub-Organization
                </Button>
              </Link>
            )}
          </div>
          <div className="text-center py-12 text-gray-500">
            Sub-organizations list will be loaded here
          </div>
        </div>
      )}

      {/* Hierarchy Tab */}
      {activeTab === 'hierarchy' && (
        <div>
          {hierarchyTree ? (
            <HierarchyTree node={hierarchyTree} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              Loading hierarchy...
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <Card className="p-6">
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Analytics dashboard coming soon</p>
          </div>
        </Card>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          organizationId={orgId}
          onClose={() => setShowAddMemberModal(false)}
          onSuccess={() => {
            fetchMembers();
            setShowAddMemberModal(false);
          }}
        />
      )}

      {/* Content Removal Dialog */}
      {memberToRemove && (
        <ContentRemovalDialog
          isOpen={true}
          onClose={() => setMemberToRemove(null)}
          member={memberToRemove}
          organizationId={orgId}
          organizationName={organization.name}
          onConfirm={handleRemoveMember}
        />
      )}
    </div>
  );
}
