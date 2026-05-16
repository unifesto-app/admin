import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * GET /api/wallet/[id]/transactions
 * Get transaction history for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceRoleClient();
    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Filters
    const type = searchParams.get('type');

    // Build query
    let query = supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', id);

    // Apply filters
    if (type) {
      query = query.eq('type', type);
    }

    // Apply pagination and sorting
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: data || [],
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

/**
 * POST /api/wallet/[id]/transactions
 * Create a new transaction (add or deduct coins)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceRoleClient();
    const body = await request.json();

    const { amount, type, description, metadata = {} } = body;

    // Validate input
    if (!amount || !type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, type, description' },
        { status: 400 }
      );
    }

    // Call the database function to update wallet balance
    const { data, error } = await supabaseAdmin.rpc('update_wallet_balance', {
      p_user_id: id,
      p_amount: amount,
      p_type: type,
      p_description: description,
      p_metadata: metadata,
    });

    if (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json(
        { error: 'Failed to create transaction', details: error.message },
        { status: 500 }
      );
    }

    // Fetch the created transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', data.transaction_id)
      .single();

    if (txError) {
      console.error('Error fetching transaction:', txError);
    }

    return NextResponse.json({
      message: 'Transaction created successfully',
      transaction,
      new_balance: data.new_balance,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
