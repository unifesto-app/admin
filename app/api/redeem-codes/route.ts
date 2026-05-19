import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('redeem_codes')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.ilike('code', `%${search}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    } else if (status === 'expired') {
      query = query.lt('expires_at', new Date().toISOString());
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: codes, error, count } = await query;

    if (error) {
      console.error('Error fetching redeem codes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch redeem codes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      codes: codes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/redeem-codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, type, coinAmount, maxUses, expiresAt, metadata } = body;

    // Validate required fields
    if (!code || !type || !coinAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const { data: existing } = await supabase
      .from('redeem_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Code already exists' },
        { status: 409 }
      );
    }

    // Create redeem code
    const { data: newCode, error } = await supabase
      .from('redeem_codes')
      .insert({
        code: code.toUpperCase(),
        type,
        coin_amount: coinAmount,
        max_uses: maxUses || null,
        expires_at: expiresAt || null,
        created_by: user.id,
        metadata: metadata || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating redeem code:', error);
      return NextResponse.json(
        { error: 'Failed to create redeem code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ code: newCode }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/redeem-codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
