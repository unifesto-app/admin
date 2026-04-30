import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/referrals
 * Get all referrals with pagination and filters
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
    const status = searchParams.get('status');
    const referrerId = searchParams.get('referrerId');
    const referredId = searchParams.get('referredId');

    // Build query - fetch referrals first
    let referralsQuery = supabase
      .from('referrals')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      referralsQuery = referralsQuery.eq('status', status);
    }
    if (referrerId) {
      referralsQuery = referralsQuery.eq('referrer_id', referrerId);
    }
    if (referredId) {
      referralsQuery = referralsQuery.eq('referred_id', referredId);
    }

    // Apply pagination and sorting
    referralsQuery = referralsQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: referrals, error: referralsError, count } = await referralsQuery;

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError);
      return NextResponse.json(
        { error: 'Failed to fetch referrals', details: referralsError.message },
        { status: 500 }
      );
    }

    if (!referrals || referrals.length === 0) {
      return NextResponse.json({
        referrals: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Collect all unique user IDs
    const userIds = new Set<string>();
    referrals.forEach(r => {
      userIds.add(r.referrer_id);
      userIds.add(r.referred_id);
    });

    // Fetch all profiles at once
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, username, email, avatar_url')
      .in('id', Array.from(userIds));

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Continue without profiles rather than failing
    }

    // Create a map for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Merge profiles with referrals
    const referralsWithProfiles = referrals.map(referral => ({
      ...referral,
      referrer: profileMap.get(referral.referrer_id) || null,
      referred: profileMap.get(referral.referred_id) || null,
    }));

    return NextResponse.json({
      referrals: referralsWithProfiles,
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
