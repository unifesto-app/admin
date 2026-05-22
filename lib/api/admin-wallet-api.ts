/**
 * Admin Wallet API Client
 * Calls backend /admin/wallet endpoints
 */

import backendClient, { apiCall } from './backend-client';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    username?: string;
    avatar_url?: string;
  };
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'earned' | 'spent' | 'refund' | 'referral_bonus' | 'event_reward' | 'purchase' | 'admin_adjustment';
  amount: number;
  balance_after: number;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface WalletListParams {
  page?: number;
  limit?: number;
  minBalance?: number;
  maxBalance?: number;
  search?: string;
}

export interface WalletListResponse {
  wallets: Wallet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateTransactionRequest {
  amount: number;
  type: 'earned' | 'spent' | 'refund' | 'referral_bonus' | 'event_reward' | 'purchase' | 'admin_adjustment';
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Get list of all wallets with pagination
 */
export async function getAllWallets(params?: WalletListParams) {
  return apiCall<WalletListResponse>(
    backendClient.get('/admin/wallet', { params })
  );
}

/**
 * Get wallet for specific user
 */
export async function getUserWallet(userId: string) {
  return apiCall<Wallet>(
    backendClient.get(`/admin/wallet/${userId}`)
  );
}

/**
 * Get transaction history for user
 */
export async function getUserTransactions(userId: string, limit: number = 50, offset: number = 0) {
  return apiCall<Transaction[]>(
    backendClient.get(`/admin/wallet/${userId}/transactions`, {
      params: { limit, offset }
    })
  );
}

/**
 * Create transaction for user (admin adjustment)
 */
export async function createTransaction(userId: string, data: CreateTransactionRequest) {
  return apiCall<{ balance: number; transaction: Transaction }>(
    backendClient.post(`/admin/wallet/${userId}/transactions`, data)
  );
}
