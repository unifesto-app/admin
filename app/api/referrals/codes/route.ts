import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/referrals/codes
 * Get all referral codes with pagination and filters
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
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    // Build query - fetch referral codes first
    let codesQuery = supabase
      .from('referral_codes')
      .select('*', { count: 'exact' });

    // Apply filters
    if (isActive !== null && isActive !== undefined) {
      codesQuery = codesQuery.eq('is_active', isActive === 'true');
    }

    // Apply pagination and sorting
    codesQuery = codesQuery
      .order('total_referrals', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: codes, error: codesError, count } = await codesQuery;

    if (codesError) {
      console.error('Error fetching referral codes:', codesError);
      return NextResponse.json(
        { error: 'Failed to fetch referral codes', details: codesError.message },
        { status: 500 }
      );
    }

    if (!codes || codes.length === 0) {
      return NextResponse.json({
        codes: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Fetch profiles for all user_ids
    const userIds = codes.map(c => c.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, username, email, avatar_url')
      .in('id', userIds);

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Continue without profiles rather than failing
    }

    // Merge profiles with codes
    const codesWithProfiles = codes.map(code => ({
      ...code,
      profiles: profiles?.find(p => p.id === code.user_id) || null,
    }));

    // Apply search filter if needed (post-fetch filtering)
    let filteredCodes = codesWithProfiles;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCodes = codesWithProfiles.filter(c => {
        const profile = c.profiles;
        return (
          c.code?.toLowerCase().includes(searchLower) ||
          profile?.name?.toLowerCase().includes(searchLower) ||
          profile?.username?.toLowerCase().includes(searchLower)
        );
      });
    }

    return NextResponse.json({
      codes: filteredCodes,
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
