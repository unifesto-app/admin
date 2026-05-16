'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Referral, ReferralCode } from '@/lib/types/database';
import { Search, Filter, Users, Award, TrendingUp, Gift, Coins, Save, RefreshCw, Settings } from 'lucide-react';
import Link from 'next/link';

interface ReferralWithProfiles extends Referral {
  referrer: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  referred: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReferralCodeWithProfile extends ReferralCode {
  profiles: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export default function ReferralManagementPage() {
  const [activeTab, setActiveTab] = useState<'referrals' | 'codes' | 'settings'>('referrals');
  const [referrals, setReferrals] = useState<ReferralWithProfiles[]>([]);
  const [codes, setCodes] = useState<ReferralCodeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<Record<string, any>>({
    referral_reward_amount: 25,
    welcome_bonus_amount: 25,
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/referrals?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReferrals(data.referrals);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Error fetching referrals:', data.error);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (activeFilter) params.append('isActive', activeFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/referrals/codes?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCodes(data.codes);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Error fetching codes:', data.error);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'referrals') {
      fetchReferrals();
    } else if (activeTab === 'codes') {
      fetchCodes();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [page, activeTab]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      
      if (response.ok) {
        const data = await response.json();
        const settingsMap: Record<string, any> = {};
        
        data.settings.forEach((setting: any) => {
          settingsMap[setting.key] = setting.value;
        });
        
        setSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const promises = Object.entries(settings).map(([key, value]) =>
        fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccessful = results.every((r) => r.ok);

      if (allSuccessful) {
        alert('Settings saved successfully!');
        setHasChanges(false);
        fetchSettings();
      } else {
        alert('Some settings failed to save. Please try again.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset to default values?')) {
      setSettings({
        referral_reward_amount: 25,
        welcome_bonus_amount: 25,
      });
      setHasChanges(true);
    }
  };

  const handleSearch = () => {
    setPage(1);
    if (activeTab === 'referrals') {
      fetchReferrals();
    } else {
      fetchCodes();
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      rewarded: 'bg-green-100 text-green-800',
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referral Management</h1>
          <p className="text-gray-600 mt-1">Manage referral codes and track referrals</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => {
            setActiveTab('referrals');
            setPage(1);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'referrals'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Referrals
        </button>
        <button
          onClick={() => {
            setActiveTab('codes');
            setPage(1);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'codes'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Award className="w-4 h-4 inline mr-2" />
          Referral Codes
        </button>
        <button
          onClick={() => {
            setActiveTab('settings');
            setPage(1);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Settings
        </button>
      </div>

      {/* Search and Filters */}
      {activeTab === 'codes' && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by code, name, or username..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <Button onClick={handleSearch} className="rounded-full">
                Search
              </Button>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="rounded-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'referrals' && (
        <Card className="p-4">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="rewarded">Rewarded</option>
            </select>
            <Button onClick={handleSearch} className="rounded-full">
              Apply
            </Button>
          </div>
        </Card>
      )}

      {/* Content */}
      {activeTab === 'settings' ? (
        <div className="space-y-6 max-w-4xl">
          {/* Header Actions */}
          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={handleResetSettings}
              variant="outline"
              className="rounded-full"
              disabled={saving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={!hasChanges || saving}
              className="rounded-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          {hasChanges && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center text-yellow-800">
                <Settings className="w-5 h-5 mr-2" />
                <span className="font-semibold">You have unsaved changes</span>
              </div>
            </Card>
          )}

          {/* Referral Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Referral Rewards Configuration</h2>
                <p className="text-sm text-gray-600">Configure referral rewards and bonuses</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Referral Reward Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Reward Amount
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Number of coins awarded to the referrer when someone uses their referral code
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-xs">
                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={settings.referral_reward_amount || 25}
                      onChange={(e) =>
                        handleSettingChange('referral_reward_amount', parseInt(e.target.value) || 0)
                      }
                      min="0"
                      step="5"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                    />
                  </div>
                  <span className="text-gray-600">coins per referral</span>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Example:</strong> If set to {settings.referral_reward_amount || 25}, when
                    Alice refers Bob, Alice receives {settings.referral_reward_amount || 25} coins
                    after Bob signs up.
                  </p>
                </div>
              </div>

              {/* Welcome Bonus Amount */}
              <div className="pt-6 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Bonus Amount
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Number of coins awarded to new users who sign up using a referral code
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-xs">
                    <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={settings.welcome_bonus_amount || 25}
                      onChange={(e) =>
                        handleSettingChange('welcome_bonus_amount', parseInt(e.target.value) || 0)
                      }
                      min="0"
                      step="5"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg font-semibold"
                    />
                  </div>
                  <span className="text-gray-600">coins for new users</span>
                </div>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Example:</strong> If set to {settings.welcome_bonus_amount || 25}, when Bob
                    signs up using Alice's referral code, Bob receives{' '}
                    {settings.welcome_bonus_amount || 25} coins as a welcome bonus.
                  </p>
                </div>
              </div>

              {/* Total Reward Summary */}
              <div className="pt-6 border-t">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-2">Total Reward Per Referral</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="w-6 h-6 text-yellow-500" />
                    <span className="text-3xl font-bold text-purple-900">
                      {(settings.referral_reward_amount || 25) +
                        (settings.welcome_bonus_amount || 25)}
                    </span>
                    <span className="text-purple-700">coins distributed per successful referral</span>
                  </div>
                  <div className="mt-3 text-sm text-purple-800">
                    <div className="flex justify-between">
                      <span>Referrer receives:</span>
                      <span className="font-semibold">
                        {settings.referral_reward_amount || 25} coins
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>New user receives:</span>
                      <span className="font-semibold">
                        {settings.welcome_bonus_amount || 25} coins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : activeTab === 'referrals' ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referred User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reward
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No referrals found
                    </td>
                  </tr>
                ) : (
                  referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {referral.referrer?.avatar_url ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={referral.referrer.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-purple-600 text-sm font-medium">
                                  {referral.referrer?.name?.[0] || referral.referrer?.username?.[0] || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referrer?.name || referral.referrer?.username || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {referral.referrer?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {referral.referred?.avatar_url ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={referral.referred.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-blue-600 text-sm font-medium">
                                  {referral.referred?.name?.[0] || referral.referred?.username?.[0] || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referred?.name || referral.referred?.username || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {referral.referred?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-gray-900">
                          {referral.referral_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(referral.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          +{referral.reward_amount} Coins
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  className="rounded-full"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  variant="outline"
                  className="rounded-full"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Referrals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Rewards
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : codes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No referral codes found
                    </td>
                  </tr>
                ) : (
                  codes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {code.profiles?.avatar_url ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={code.profiles.avatar_url}
                                alt=""
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-purple-600 text-sm font-medium">
                                  {code.profiles?.name?.[0] || code.profiles?.username?.[0] || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {code.profiles?.name || code.profiles?.username || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {code.profiles?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-purple-600">
                          {code.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {code.total_referrals}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {code.total_rewards} Coins
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            code.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {code.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(code.created_at).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  className="rounded-full"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  variant="outline"
                  className="rounded-full"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
