import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get redeem code uses with user profiles
    const { data: uses, error } = await supabase
      .from('redeem_code_uses')
      .select(`
        *,
        profiles:user_id (
          name,
          username,
          email
        )
      `)
      .eq('redeem_code_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching redeem code uses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch uses' },
        { status: 500 }
      );
    }

    return NextResponse.json({ uses: uses || [] });
  } catch (error) {
    console.error('Error in GET /api/redeem-codes/[id]/uses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
