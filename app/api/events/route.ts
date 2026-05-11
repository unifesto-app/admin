import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/events
 * Get all events with filters (Public - no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const is_trending = searchParams.get('is_trending');
    const is_featured = searchParams.get('is_featured');
    const organization_id = searchParams.get('organization_id');

    // Build query - use anon client for public access
    let query = supabase
      .from('events')
      .select(`
        *,
        organization:organizations(id, name, logo_url)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,short_description.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (is_trending !== null && is_trending !== undefined) {
      query = query.eq('is_trending', is_trending === 'true');
    }
    if (is_featured !== null && is_featured !== undefined) {
      query = query.eq('is_featured', is_featured === 'true');
    }
    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Order by start date
    query = query.order('start_date', { ascending: false });

    const { data: events, error, count } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
