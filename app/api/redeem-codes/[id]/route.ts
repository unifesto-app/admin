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

    const { data: code, error } = await supabase
      .from('redeem_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !code) {
      return NextResponse.json(
        { error: 'Redeem code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Error in GET /api/redeem-codes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update allowed fields
    if (body.is_active !== undefined) {
      updates.is_active = body.is_active;
    }
    if (body.aliases !== undefined) {
      if (Array.isArray(body.aliases) && body.aliases.length <= 10) {
        updates.aliases = body.aliases.map((a: string) => a.toUpperCase());
      } else {
        return NextResponse.json({ error: 'Aliases must be an array of up to 10 strings' }, { status: 400 });
      }
    }
    if (body.max_uses !== undefined) {
      updates.max_uses = body.max_uses;
    }
    if (body.expires_at !== undefined) {
      updates.expires_at = body.expires_at;
    }

    const { data: code, error } = await supabase
      .from('redeem_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating redeem code:', error);
      return NextResponse.json(
        { error: 'Failed to update redeem code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Error in PATCH /api/redeem-codes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('redeem_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting redeem code:', error);
      return NextResponse.json(
        { error: 'Failed to delete redeem code' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Redeem code deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/redeem-codes/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
