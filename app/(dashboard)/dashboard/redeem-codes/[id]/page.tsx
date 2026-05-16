'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Tag, Calendar, Users, Coins, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface RedeemCode {
  id: string;
  code: string;
  type: 'promotional' | 'gift' | 'event' | 'partner';
  coin_amount: number;
  max_uses: number | null;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface RedeemCodeUse {
  id: string;
  user_id: string;
  coin_amount: number;
  created_at: string;
  profiles: {
    name: string | null;
    username: string | null;
    email: string | null;
  } | null;
}

export default function RedeemCodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [code, setCode] = useState<RedeemCode | null>(null);
  const [uses, setUses] = useState<RedeemCodeUse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCodeDetails();
  }, [id]);

  const fetchCodeDetails = async () => {
    try {
      setLoading(true);
      const [codeResponse, usesResponse] = await Promise.all([
        fetch(`/api/redeem-codes/${id}`),
        fetch(`/api/redeem-codes/${id}/uses`),
      ]);

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        setCode(codeData.code);
      }

      if (usesResponse.ok) {
        const usesData = await usesResponse.json();
        setUses(usesData.uses);
      }
    } catch (error) {
      console.error('Error fetching code details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!code) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/redeem-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !code.is_active }),
      });

      if (response.ok) {
        fetchCodeDetails();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this redeem code? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/redeem-codes/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Redeem code deleted successfully');
        router.push('/dashboard/redeem-codes');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete code');
      }
    } catch (error) {
      console.error('Error deleting code:', error);
      alert('Failed to delete code');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      promotional: 'bg-purple-100 text-purple-800',
      gift: 'bg-pink-100 text-pink-800',
      event: 'bg-blue-100 text-blue-800',
      partner: 'bg-green-100 text-green-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading redeem code...</p>
        </div>
      </div>
    );
  }

  if (!code) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Redeem code not found</p>
          <Link href="/dashboard/redeem-codes">
            <Button className="mt-4 rounded-full">Back to Codes</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
  const isMaxedOut = code.max_uses && code.current_uses >= code.max_uses;
  const usagePercentage = code.max_uses
    ? (code.current_uses / code.max_uses) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/redeem-codes">
            <Button variant="outline" size="sm" className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-mono">{code.code}</h1>
            <p className="text-gray-600 mt-1">Redeem code details</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isExpired && !isMaxedOut && (
            <Button
              onClick={handleToggleStatus}
              disabled={updating}
              variant="outline"
              className="rounded-full"
            >
              {updating
                ? 'Updating...'
                : code.is_active
                ? 'Deactivate'
                : 'Activate'}
            </Button>
          )}
          <Button
            onClick={handleDelete}
            variant="outline"
            className="rounded-full text-red-600 hover:bg-red-50"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {isExpired && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center text-red-800">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="font-semibold">This code has expired</span>
          </div>
        </Card>
      )}

      {isMaxedOut && !isExpired && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center text-orange-800">
            <XCircle className="w-5 h-5 mr-2" />
            <span className="font-semibold">This code has reached maximum uses</span>
          </div>
        </Card>
      )}

      {/* Code Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Code Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Type</label>
              <div className="mt-1">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(
                    code.type
                  )}`}
                >
                  {code.type}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Coin Amount</label>
              <div className="flex items-center mt-1">
                <Coins className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold">{code.coin_amount}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Status</label>
              <div className="mt-1">
                {isExpired ? (
                  <span className="flex items-center text-red-600">
                    <XCircle className="w-4 h-4 mr-1" />
                    Expired
                  </span>
                ) : isMaxedOut ? (
                  <span className="flex items-center text-orange-600">
                    <XCircle className="w-4 h-4 mr-1" />
                    Maxed Out
                  </span>
                ) : code.is_active ? (
                  <span className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center text-gray-600">
                    <XCircle className="w-4 h-4 mr-1" />
                    Inactive
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Created</label>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span>{formatDate(code.created_at)}</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Expires</label>
              <div className="flex items-center mt-1">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className={isExpired ? 'text-red-600' : ''}>
                  {formatDate(code.expires_at)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold mb-4">Usage Statistics</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-600">Total Uses</label>
                <span className="text-2xl font-bold">
                  {code.current_uses}
                  {code.max_uses ? ` / ${code.max_uses}` : ''}
                </span>
              </div>
              {code.max_uses && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600">Max Uses</label>
              <div className="flex items-center mt-1">
                <Users className="w-5 h-5 text-gray-400 mr-2" />
                <span className="text-xl font-bold">
                  {code.max_uses || 'Unlimited'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Remaining Uses</label>
              <div className="mt-1">
                <span className="text-xl font-bold">
                  {code.max_uses
                    ? Math.max(0, code.max_uses - code.current_uses)
                    : '∞'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-600">Total Coins Distributed</label>
              <div className="flex items-center mt-1">
                <Coins className="w-5 h-5 text-yellow-500 mr-2" />
                <span className="text-xl font-bold">
                  {code.current_uses * code.coin_amount}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Usage History */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold">Usage History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Users who have redeemed this code
          </p>
        </div>

        {uses.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No one has used this code yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Coins Received
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uses.map((use) => (
                  <tr key={use.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {use.profiles?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {use.profiles?.email || use.user_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Coins className="w-4 h-4 text-yellow-500 mr-2" />
                        <span className="font-semibold">{use.coin_amount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(use.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
