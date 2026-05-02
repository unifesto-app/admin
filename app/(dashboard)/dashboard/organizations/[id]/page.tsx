'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { brandGradient } from '@/lib/styles';
import AddMemberModal from '@/components/organizations/add-member-modal';
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
  ChevronRight,
  UserPlus,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  parent_org_id: string | null;
  logo_url: string | null;
  banner_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  member_count: number;
  sub_org_count: number;
  parent_org?: {
    id: string;
    name: string;
    type: string;
    slug: string;
  } | null;
  org_path?: Array<{
    id: string;
    name: string;
    type: string;
    level: number;
  }>;
}

interface Member {
  id: string;
  role: string;
  joined_at: string;
  profile: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface SubOrg {
  id: string;
  name: string;
  type: string;
  slug: string;
  is_active: boolean;
  member_count: number;
  sub_org_count: number;
}

const ORG_TYPE_LABELS: Record<string, string> = {
  university: 'University',
  college: 'College',
  club: 'Club',
  community: 'Community',
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  organizer: 'Organizer',
  member: 'Member',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-blue-100 text-blue-800 border-blue-300',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  organizer: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  member: 'bg-gray-100 text-gray-800 border-gray-300',
};

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [subOrgs, setSubOrgs] = useState<SubOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'sub-orgs'>('overview');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  useEffect(() => {
    fetchOrganization();
    fetchMembers();
    fetchSubOrgs();
  }, [orgId]);

  const fetchOrganization = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`);
      const data = await response.json();

      if (response.ok) {
        setOrganization(data.organization);
        setError(null);
      } else {
        console.error('Error fetching organization:', data.error);
        setError(data.error || 'Failed to load organization');
        // If organization not found, redirect to listing page after a short delay
        if (response.status === 404) {
          setTimeout(() => {
            router.push('/dashboard/organizations');
          }, 2000);
        }
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
      const response = await fetch(`/api/organizations/${orgId}/members`);
      const data = await response.json();

      if (response.ok) {
        setMembers(data.members);
      } else {
        console.error('Error fetching members:', data.error);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchSubOrgs = async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}/sub-orgs`);
      const data = await response.json();

      if (response.ok) {
        setSubOrgs(data.sub_organizations);
      } else {
        console.error('Error fetching sub-organizations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching sub-organizations:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/organizations');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization');
    }
  };

  if (loading) {
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
            <h1 className="text-3xl font-bold">{organization.name}</h1>
            {organization.org_path && organization.org_path.length > 1 && (
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                {organization.org_path
                  .slice()
                  .reverse()
                  .map((org, index) => (
                    <div key={org.id} className="flex items-center gap-2">
                      {index > 0 && <ChevronRight className="w-4 h-4" />}
                      <Link
                        href={`/dashboard/organizations/${org.id}`}
                        className="hover:underline"
                      >
                        {org.name}
                      </Link>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/organizations/${orgId}/edit`}>
            <Button variant="outline" className="rounded-full">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="rounded-full text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

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
                        {member.profile?.username && (
                          <div className="text-sm text-gray-500">@{member.profile.username}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full border ${
                          ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                      >
                        {ROLE_LABELS[member.role] || member.role}
                      </span>
                      <div className="text-sm text-gray-500">
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
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
            <Link href={`/dashboard/organizations/new?parent_org_id=${orgId}`}>
              <Button className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Sub-Organization
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subOrgs.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                No sub-organizations found
              </div>
            ) : (
              subOrgs.map((subOrg) => (
                <Card key={subOrg.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold">{subOrg.name}</h3>
                      <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                        {ORG_TYPE_LABELS[subOrg.type] || subOrg.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{subOrg.member_count}</span>
                      </div>
                      {subOrg.sub_org_count > 0 && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{subOrg.sub_org_count}</span>
                        </div>
                      )}
                    </div>
                    <Link href={`/dashboard/organizations/${subOrg.id}`}>
                      <Button variant="outline" className="w-full rounded-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
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
    </div>
  );
}
