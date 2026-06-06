import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route: /api/users/bulk
 * TODO: Implement with backend API
 * Previously used Supabase - now stubbed out
 */

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Not implemented - Supabase removed, replace with backend API' },
    { status: 501 }
  );
}

