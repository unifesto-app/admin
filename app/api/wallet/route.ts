import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/wallet
 * Get all wallets with pagination and filters
 * TODO: Implement with backend API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Not implemented - Supabase removed, replace with backend API' },
    { status: 501 }
  );
}
