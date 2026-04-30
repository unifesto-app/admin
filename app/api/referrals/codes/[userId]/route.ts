import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/referrals/codes/[userId]
 * Get referral code for a specific user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();

    // Fetch referral code
    const { data: code, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (codeError) {
      console.error('Error fetching referral code:', codeError);
      return NextResponse.json(
        { error: 'Referral code not found', details: codeError.message },
        { status: 404 }
      );
    }

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, username, email, avatar_url')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      // Return code without profile
      return NextResponse.json(code);
    }

    // Merge profile with code
    return NextResponse.json({
      ...code,
      profiles: profile,
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
 * PATCH /api/referrals/codes/[userId]
 * Update referral code (toggle active status or regenerate)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { is_active, regenerate } = body;

    // If regenerate is requested, call the database function
    if (regenerate) {
      const { data, error } = await supabase.rpc('regenerate_referral_code', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error regenerating referral code:', error);
        return NextResponse.json(
          { error: 'Failed to regenerate referral code', details: error.message },
          { status: 500 }
        );
      }

      // Fetch the updated code
      const { data: updatedCode, error: fetchError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching updated code:', fetchError);
      }

      return NextResponse.json({
        message: 'Referral code regenerated successfully',
        code: updatedCode,
      });
    }

    // Otherwise, update the is_active status
    const { data, error } = await supabase
      .from('referral_codes')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating referral code:', error);
      return NextResponse.json(
        { error: 'Failed to update referral code', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Referral code updated successfully',
      code: data,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
