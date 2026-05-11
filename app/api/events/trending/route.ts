import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/events/trending
 * Get all trending events (ongoing only) - Public access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get current date
    const now = new Date().toISOString();

    // Query trending events that are ongoing (started but not ended)
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        organization:organizations(id, name, logo_url)
      `)
      .eq('is_trending', true)
      .eq('status', 'published')
      .lte('start_date', now) // Event has started
      .gte('end_date', now)   // Event hasn't ended
      .order('start_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/events/trending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/trending
 * Set multiple events as trending
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event_ids } = body;

    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return NextResponse.json(
        { error: 'event_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Update events to be trending
    const { data: events, error } = await supabase
      .from('events')
      .update({ is_trending: true, updated_at: new Date().toISOString() })
      .in('id', event_ids)
      .select();

    if (error) {
      console.error('Error setting trending events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      message: `${events?.length || 0} events marked as trending`,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/events/trending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/trending
 * Remove trending status from multiple events
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { event_ids } = body;

    if (!Array.isArray(event_ids) || event_ids.length === 0) {
      return NextResponse.json(
        { error: 'event_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    // Update events to remove trending status
    const { data: events, error } = await supabase
      .from('events')
      .update({ is_trending: false, updated_at: new Date().toISOString() })
      .in('id', event_ids)
      .select();

    if (error) {
      console.error('Error removing trending status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      message: `${events?.length || 0} events removed from trending`,
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/events/trending:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
