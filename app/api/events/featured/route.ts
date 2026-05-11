import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/events/featured
 * Get all featured events - Public access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // Query featured events
    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        organization:organizations(id, name, logo_url)
      `)
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('start_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Unexpected error in GET /api/events/featured:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/featured
 * Set multiple events as featured
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

    // Update events to be featured
    const { data: events, error } = await supabase
      .from('events')
      .update({ is_featured: true, updated_at: new Date().toISOString() })
      .in('id', event_ids)
      .select();

    if (error) {
      console.error('Error setting featured events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      message: `${events?.length || 0} events marked as featured`,
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/events/featured:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/featured
 * Remove featured status from multiple events
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

    // Update events to remove featured status
    const { data: events, error } = await supabase
      .from('events')
      .update({ is_featured: false, updated_at: new Date().toISOString() })
      .in('id', event_ids)
      .select();

    if (error) {
      console.error('Error removing featured status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      events: events || [],
      message: `${events?.length || 0} events removed from featured`,
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/events/featured:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
