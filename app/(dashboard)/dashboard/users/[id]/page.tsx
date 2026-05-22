'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Shield, Ban, CheckCircle, Edit, Trash2, Wallet, Gift, ExternalLink, Activity, UserCircle, CreditCard, Settings } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'preferences'>('overview');

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

  const getRoleLabel = (role: any) => {
    if (!role || typeof role !== 'string') return 'No Role';
    
    switch (role) {
      case 'super_admin':
        return 'Platform Super Admin';
      case 'admin':
        return 'Platform Admin';
      case 'organizer':
        return 'Organizer';
      case 'attendee':
        return 'Attendee';
      default:
        return String(role).replace(/_/g, ' ');
    }
  };

  const getRoleBadgeColor = (role: any) => {
    if (typeof role !== 'string') return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-blue-200';
      case 'organizer':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200';
    }
  };

  const getStatusBadgeColor = (user: Profile) => {
    if (user.is_banned) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-200';
    }
    if (user.is_active) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border border-green-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200';
  };

  const getStatusText = (user: Profile) => {
    if (user.is_banned) return 'Banned';
    if (user.is_active) return 'Active';
    return 'Inactive';
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center space-x-2">
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
        <div className="h-4 w-4 animate-bounce rounded-full bg-primary"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6 max-w-xl mx-auto mt-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight text-red-500">User Not Found</h1>
        </div>
        <Card className="border-red-200 shadow-md">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <Ban className="h-12 w-12 text-red-500 mb-4 opacity-80" />
            <p className="text-red-600 font-medium">{error || 'User not found in the database.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-background to-muted border shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full shadow-sm hover:scale-105 transition-transform">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              User Profile
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{user.id}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowEditModal(true)} className="shadow-sm hover:shadow-md transition-all">
            <Edit className="mr-2 h-4 w-4" /> Edit Profile
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="shadow-sm hover:shadow-md transition-all">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50/50 backdrop-blur-sm border border-red-200 rounded-xl shadow-sm flex items-center gap-2">
          <Ban className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Main Profile Summary */}
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-all">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 via-primary/5 to-background z-0"></div>
        
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="relative group">
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-4 border-background shadow-xl flex items-center justify-center text-4xl font-bold text-primary group-hover:scale-105 transition-transform duration-300">
              {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </div>
            {user.is_verified && (
              <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1 shadow-lg border-2 border-background" title="Verified User">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h2 className="text-3xl font-bold">{user.name || 'No Name Provided'}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="mr-1 h-3 w-3" /> {getRoleLabel(user.role)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-sm ${getStatusBadgeColor(user)}`}>
                  {getStatusText(user)}
                </span>
              </div>
            </div>
            
            {user.username && (
              <p className="text-lg text-muted-foreground font-medium">@{user.username}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                <Mail className="h-4 w-4" /> {user.email || 'No email'}
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                <Phone className="h-4 w-4" /> {user.phone || 'No phone'}
              </div>
              <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                <Calendar className="h-4 w-4" /> Joined {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Tabs Navigation */}
      <div className="flex space-x-1 p-1 bg-muted/50 backdrop-blur-sm rounded-xl overflow-x-auto shadow-inner border max-w-2xl">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'overview' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
        >
          <UserCircle className="h-4 w-4" /> Overview
        </button>
        <button 
          onClick={() => setActiveTab('financials')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'financials' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
        >
          <CreditCard className="h-4 w-4" /> Financials & Referrals
        </button>
        <button 
          onClick={() => setActiveTab('preferences')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === 'preferences' ? 'bg-background shadow-md text-primary' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'}`}
        >
          <Settings className="h-4 w-4" /> Preferences & System
        </button>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            <Card className="md:col-span-2 shadow-sm hover:shadow-md transition-shadow border-muted/60">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" /> About User
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Biography</h3>
                  {user.bio ? (
                    <p className="text-foreground leading-relaxed p-4 bg-muted/30 rounded-xl border border-muted/50">{user.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">No biography provided.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {user.is_banned && (
                <Card className="border-red-200 shadow-md bg-red-50/30 overflow-hidden">
                  <div className="h-1 w-full bg-red-500"></div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-red-700 flex items-center gap-2">
                      <Ban className="h-5 w-5" /> Ban Notice
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-red-800 font-medium p-3 bg-red-100/50 rounded-lg border border-red-100">
                      {user.ban_reason || 'No specific reason provided for the ban.'}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Card className="shadow-sm border-muted/60">
                <CardHeader className="border-b bg-muted/20 pb-3">
                  <CardTitle className="text-lg">Status Checklist</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Account Active</span>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.is_active ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Verification</span>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.is_verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {user.is_verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Ban Status</span>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {user.is_banned ? 'BANNED' : 'CLEAR'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Financials Tab */}
        {activeTab === 'financials' && (
          <>
            <Card className="md:col-span-2 shadow-sm border-muted/60 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -z-10"></div>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-purple-600" /> Wallet Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {wallet ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-100 dark:border-purple-900/30 rounded-2xl flex-1 w-full flex items-center justify-center flex-col shadow-inner">
                      <span className="text-sm font-medium text-purple-600/80 mb-2 uppercase tracking-wider">Current Balance</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-purple-600 tracking-tight">{wallet.balance.toLocaleString()}</span>
                        <span className="text-xl font-semibold text-purple-400">{wallet.currency}</span>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <Link href={`/dashboard/wallet/${resolvedParams.id}`} className="block">
                        <Button className="w-full sm:w-auto px-8 rounded-xl shadow-md hover:shadow-lg transition-all group bg-purple-600 hover:bg-purple-700 text-white">
                          <Activity className="mr-2 h-4 w-4 group-hover:animate-pulse" />
                          View All Transactions
                          <ExternalLink className="ml-2 h-4 w-4 opacity-70" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No wallet information available for this user.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-muted/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-full -z-10"></div>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" /> Referral Program
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {referralCode ? (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50/50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30 text-center">
                      <span className="block text-xs uppercase tracking-wider text-green-600/80 font-semibold mb-1">Referral Code</span>
                      <span className="text-2xl font-mono font-bold text-green-700 tracking-widest">{referralCode.code}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                        <span className="text-3xl font-bold text-foreground mb-1">{referralCode.total_referrals}</span>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Invites</span>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-xl border flex flex-col items-center text-center">
                        <span className="text-3xl font-bold text-green-600 mb-1">{referralCode.total_rewards}</span>
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Coins Earned</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    <Gift className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Not participating in the referral program.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <>
            <Card className="md:col-span-2 shadow-sm border-muted/60">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" /> Application Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {user.preferences && typeof user.preferences === 'object' && Object.keys(user.preferences).length > 0 ? (
                  <div className="bg-slate-900 rounded-xl p-5 shadow-inner border border-slate-800 overflow-hidden">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">JSON Configuration</span>
                    </div>
                    <pre className="text-sm text-green-400 font-mono overflow-x-auto custom-scrollbar">
                      {JSON.stringify(user.preferences, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center p-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>User hasn't configured any custom preferences yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-muted/60">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" /> System Timestamps
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="bg-muted/30 p-3 rounded-lg border flex items-start gap-3">
                  <div className="p-2 bg-background rounded shadow-sm border mt-0.5">
                    <UserCircle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Account Created</span>
                    <span className="text-sm font-medium text-foreground block">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div className="bg-muted/30 p-3 rounded-lg border flex items-start gap-3">
                  <div className="p-2 bg-background rounded shadow-sm border mt-0.5">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Last Updated</span>
                    <span className="text-sm font-medium text-foreground block">{new Date(user.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span className="text-xs text-muted-foreground">{new Date(user.updated_at).toLocaleTimeString()}</span>
                  </div>
                </div>

                {user.last_login && (
                  <div className="bg-muted/30 p-3 rounded-lg border flex items-start gap-3">
                    <div className="p-2 bg-background rounded shadow-sm border mt-0.5">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary/80 block mb-1">Last Login</span>
                      <span className="text-sm font-medium text-foreground block">{new Date(user.last_login).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      <span className="text-xs text-muted-foreground">{new Date(user.last_login).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
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
