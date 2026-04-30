'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Shield, Ban, CheckCircle, Edit, Trash2, Wallet, Gift, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserById, deleteUser } from '@/lib/api/users';
import UserFormModal from '@/components/users/user-form-modal';
import type { Profile, Wallet as WalletType, ReferralCode } from '@/lib/types/database';
import Link from 'next/link';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchWallet();
    fetchReferralCode();
  }, [resolvedParams.id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserById(resolvedParams.id);
      setUser(response.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const response = await fetch(`/api/wallet/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setWallet(data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  };

  const fetchReferralCode = async () => {
    try {
      const response = await fetch(`/api/referrals/codes/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferralCode(data);
      }
    } catch (err) {
      console.error('Failed to fetch referral code:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteUser(resolvedParams.id);
      router.push('/dashboard/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    fetchUser();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'organizer':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
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
    if (user.is_banned) return 'banned';
    if (user.is_active) return 'active';
    return 'inactive';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">User Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6">
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
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground">
              View and manage user information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Profile Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold">
                {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{user.name || 'No name'}</CardTitle>
                {user.username && (
                  <CardDescription className="text-base">@{user.username}</CardDescription>
                )}
                <div className="flex gap-2 mt-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    <Shield className="mr-1 h-3 w-3" />
                    {user.role.replace('_', ' ')}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user)}`}>
                    {getStatusText(user)}
                  </span>
                  {user.is_verified && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bio */}
            {user.bio && (
              <div>
                <h3 className="font-semibold mb-2">Bio</h3>
                <p className="text-sm text-muted-foreground">{user.bio}</p>
              </div>
            )}

            {/* Contact Information */}
            <div>
              <h3 className="font-semibold mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user.email || 'Not provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{user.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            {user.preferences && typeof user.preferences === 'object' && Object.keys(user.preferences).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Preferences</h3>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                  {JSON.stringify(user.preferences, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">User ID</span>
                <span className="font-mono text-xs break-all">{user.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Created</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleTimeString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Last Updated</span>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{new Date(user.updated_at).toLocaleDateString()}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.updated_at).toLocaleTimeString()}
                </span>
              </div>
              {user.last_login && (
                <div>
                  <span className="text-muted-foreground block mb-1">Last Login</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium">{new Date(user.last_login).toLocaleDateString()}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(user.last_login).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ban Information */}
          {user.is_banned && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="text-lg text-red-800 dark:text-red-200 flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  Banned Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {user.ban_reason || 'No reason provided'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Active</span>
                <span className={`font-medium ${user.is_active ? 'text-green-600' : 'text-gray-600'}`}>
                  {user.is_active ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Banned</span>
                <span className={`font-medium ${user.is_banned ? 'text-red-600' : 'text-gray-600'}`}>
                  {user.is_banned ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verified</span>
                <span className={`font-medium ${user.is_verified ? 'text-blue-600' : 'text-gray-600'}`}>
                  {user.is_verified ? 'Yes' : 'No'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Information */}
          {wallet && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Balance</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {wallet.balance.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {wallet.currency}
                  </span>
                </div>
                <Link href={`/dashboard/wallet/${resolvedParams.id}`}>
                  <Button variant="outline" size="sm" className="w-full rounded-full">
                    View Transactions
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Referral Information */}
          {referralCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Referral Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">Code</span>
                  <span className="text-lg font-mono font-bold text-purple-600">
                    {referralCode.code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Referrals</span>
                  <span className="font-semibold">{referralCode.total_referrals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Rewards</span>
                  <span className="font-semibold text-green-600">
                    {referralCode.total_rewards} Coins
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      referralCode.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {referralCode.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
