export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlatformRole = 'attendee' | 'organizer' | 'org_admin' | 'org_super_admin' | 'super_admin';

export interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
  role: PlatformRole;
  is_verified: boolean;
  preferences: Json;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  wallet_passcode: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  slug: string | null;
  organization_id: string;
  created_by: string;
  start_date: string;
  end_date: string;
  registration_start: string | null;
  registration_end: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  event_type: 'online' | 'offline' | 'hybrid';
  category: string | null;
  tags: string[] | null;
  image_url: string | null;
  max_attendees: number | null;
  is_free: boolean;
  price: number | null;
  currency: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'cancelled';
  is_trending: boolean;
  is_featured: boolean;
  submitted_for_approval_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  ownership_status: 'active' | 'transferred' | 'anonymized' | 'deleted';
  created_at: string;
  updated_at: string;
}

// Wallet & Referral Types
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  type: 'earned' | 'spent' | 'refund' | 'referral_bonus' | 'event_reward' | 'purchase';
  amount: number;
  balance_after: number;
  description: string;
  metadata: Json;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'rewarded';
  reward_amount: number;
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  total_referrals: number;
  total_rewards: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  type: 'credit' | 'debit';
  status: 'pending' | 'completed' | 'failed';
  description: string | null;
  created_at: string;
}

// Legacy type aliases for backward compatibility
export type UserRole = PlatformRole;
export type UserStatus = 'active' | 'inactive' | 'suspended';
