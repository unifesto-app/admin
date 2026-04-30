import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/wallet
 * Get all wallets with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filters
    const minBalance = searchParams.get('minBalance');
    const maxBalance = searchParams.get('maxBalance');
    const search = searchParams.get('search');

    // Build query - fetch wallets first
    let walletQuery = supabase
      .from('wallets')
      .select('*', { count: 'exact' });

    // Apply filters
    if (minBalance) {
      walletQuery = walletQuery.gte('balance', parseInt(minBalance));
    }
    if (maxBalance) {
      walletQuery = walletQuery.lte('balance', parseInt(maxBalance));
    }

    // Apply pagination and sorting
    walletQuery = walletQuery
      .order('balance', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: wallets, error: walletError, count } = await walletQuery;

    if (walletError) {
      console.error('Error fetching wallets:', walletError);
      return NextResponse.json(
        { error: 'Failed to fetch wallets', details: walletError.message },
        { status: 500 }
      );
    }

    if (!wallets || wallets.length === 0) {
      return NextResponse.json({
        wallets: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch profiles for all user_ids
    const userIds = wallets.map(w => w.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, username, email, avatar_url')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Continue without profiles rather than failing
    }

    // Merge profiles with wallets
    const walletsWithProfiles = wallets.map(wallet => ({
      ...wallet,
      profiles: profiles?.find(p => p.id === wallet.user_id) || null,
    }));

    // Apply search filter if needed (post-fetch filtering)
    let filteredWallets = walletsWithProfiles;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredWallets = walletsWithProfiles.filter(w => {
        const profile = w.profiles;
        if (!profile) return false;
        return (
          profile.name?.toLowerCase().includes(searchLower) ||
          profile.username?.toLowerCase().includes(searchLower) ||
          profile.email?.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({
      wallets: filteredWallets,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
