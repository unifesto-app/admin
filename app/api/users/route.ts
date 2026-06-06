import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * API Route: GET /api/users
 * Fetch all users with pagination (proxies to backend with ADMIN role check)
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('unifesto_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = request.nextUrl;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    // Build backend URL with query params
    const backendUrl = new URL(`${BACKEND_URL}/users`);
    backendUrl.searchParams.set('page', page);
    backendUrl.searchParams.set('limit', limit);
    if (search) {
      backendUrl.searchParams.set('search', search);
    }

    // Forward request to backend
    const response = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch users from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API Route: POST /api/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Not implemented - Supabase removed, replace with backend API' },
    { status: 501 }
  );
}

