import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/wallet/:id
 * TODO: Implement with backend API
 * Previously used Supabase - now stubbed out
 */

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Not implemented - Supabase removed, replace with backend API' },
    { status: 501 }
  );
}

