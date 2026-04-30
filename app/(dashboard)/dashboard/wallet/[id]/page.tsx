'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wallet, WalletTransaction } from '@/lib/types/database';
import { ArrowLeft, Plus, Minus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface WalletWithProfile extends Wallet {
  profiles: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [wallet, setWallet] = useState<WalletWithProfile | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState('earned');

  const fetchWallet = async () => {
    try {
      const response = await fetch(`/api/wallet/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setWallet(data);
      } else {
        console.error('Error fetching wallet:', data.error);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/wallet/${userId}/transactions?limit=50`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
      } else {
        console.error('Error fetching transactions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [userId]);

  const handleAddCoins = async () => {
    if (!amount || !description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`/api/wallet/${userId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(amount),
          type: transactionType,
          description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Coins added successfully');
        setShowAddModal(false);
        setAmount('');
        setDescription('');
        fetchWallet();
        fetchTransactions();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding coins:', error);
      alert('Failed to add coins');
    }
  };

  const handleDeductCoins = async () => {
    if (!amount || !description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`/api/wallet/${userId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: -parseInt(amount),
          type: 'spent',
          description,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Coins deducted successfully');
        setShowDeductModal(false);
        setAmount('');
        setDescription('');
        fetchWallet();
        fetchTransactions();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error deducting coins:', error);
      alert('Failed to deduct coins');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
      case 'referral_bonus':
      case 'event_reward':
      case 'refund':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'spent':
      case 'purchase':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Wallet not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Wallet Details</h1>
            <p className="text-gray-600 mt-1">
              {wallet.profiles?.name || wallet.profiles?.username || 'Unknown User'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="rounded-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Coins
          </Button>
          <Button
            onClick={() => setShowDeductModal(true)}
            variant="outline"
            className="rounded-full"
          >
            <Minus className="w-4 h-4 mr-2" />
            Deduct Coins
          </Button>
        </div>
      </div>

      {/* Wallet Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Current Balance</div>
          <div className="text-3xl font-bold text-purple-600">
            {wallet.balance.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">{wallet.currency}</div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">User</div>
          <div className="flex items-center gap-3">
            {wallet.profiles?.avatar_url ? (
              <img
                src={wallet.profiles.avatar_url}
                alt=""
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-medium text-lg">
                  {wallet.profiles?.name?.[0] || wallet.profiles?.username?.[0] || 'U'}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium">
                {wallet.profiles?.name || wallet.profiles?.username || 'Unknown'}
              </div>
              <div className="text-sm text-gray-500">{wallet.profiles?.email || 'N/A'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600 mb-1">Wallet Created</div>
          <div className="text-lg font-medium">
            {new Date(wallet.created_at).toLocaleDateString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {new Date(wallet.created_at).toLocaleTimeString()}
          </div>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance After
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(tx.type)}
                        <span className="text-sm font-medium capitalize">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{tx.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-semibold ${getTransactionColor(tx.amount)}`}>
                        {tx.amount >= 0 ? '+' : ''}
                        {tx.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {tx.balance_after.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Coins Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Add Coins</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="earned">Earned</option>
                  <option value="referral_bonus">Referral Bonus</option>
                  <option value="event_reward">Event Reward</option>
                  <option value="refund">Refund</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCoins} className="rounded-full">
                  Add Coins
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Deduct Coins Modal */}
      {showDeductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Deduct Coins</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => setShowDeductModal(false)}
                  variant="outline"
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button onClick={handleDeductCoins} className="rounded-full">
                  Deduct Coins
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
