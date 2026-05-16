'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, WalletTransaction } from '@/lib/types/database';
import { Search, Filter, Plus, Minus, Eye, Settings, Coins, Save, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface WalletWithProfile extends Wallet {
  profiles: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export default function WalletManagementPage() {
  const [activeTab, setActiveTab] = useState<'wallets' | 'settings'>('wallets');
  const [wallets, setWallets] = useState<WalletWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });

      if (search) params.append('search', search);
      if (minBalance) params.append('minBalance', minBalance);
      if (maxBalance) params.append('maxBalance', maxBalance);

      const response = await fetch(`/api/wallet?${params}`);
      const data = await response.json();

      if (response.ok) {
        setWallets(data.wallets);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Error fetching wallets:', data.error);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wallets') {
      fetchWallets();
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

  const handleSearch = () => {
    setPage(1);
    fetchWallets();
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} Uni Coins`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-gray-600 mt-1">Manage user wallets and coin settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => {
            setActiveTab('wallets');
            setPage(1);
          }}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'wallets'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Wallets
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

      {/* Content */}
      {activeTab === 'settings' ? (
        <div className="space-y-6 max-w-4xl">
          {/* Header Actions */}
          <div className="flex items-center justify-end gap-2">
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

          {/* Wallet Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Wallet Configuration</h2>
                <p className="text-sm text-gray-600">Configure wallet-related settings and coin management</p>
              </div>
            </div>

            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No wallet settings configured yet</p>
              <p className="text-sm text-gray-400">
                Wallet configuration options will be added here
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, username, or email..."
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
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Balance
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minBalance}
                  onChange={(e) => setMinBalance(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Balance
                </label>
                <input
                  type="number"
                  placeholder="10000"
                  value={maxBalance}
                  onChange={(e) => setMaxBalance(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Wallets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : wallets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No wallets found
                  </td>
                </tr>
              ) : (
                wallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {wallet.profiles?.avatar_url ? (
                            <img
                              className="h-10 w-10 rounded-full"
                              src={wallet.profiles.avatar_url}
                              alt=""
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-medium">
                                {wallet.profiles?.name?.[0] || wallet.profiles?.username?.[0] || 'U'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {wallet.profiles?.name || wallet.profiles?.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {wallet.profiles?.email || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(wallet.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{wallet.currency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(wallet.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/wallet/${wallet.user_id}`}
                        className="text-purple-600 hover:text-purple-900 mr-4"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </Link>
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
        </>
      )}
    </div>
  );
}
