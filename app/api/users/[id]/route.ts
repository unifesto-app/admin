import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * API Route: GET /api/users/:id
 * Fetch a single user by ID (proxies to backend with ADMIN role check)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('unifesto_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/users/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch user from backend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API Route: PATCH /api/users/:id
 * Update a user
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('unifesto_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward request to backend
    const response = await fetch(`${BACKEND_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to update user' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * API Route: DELETE /api/users/:id
 * Delete a user
 */
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Not implemented - Supabase removed, replace with backend API' },
    { status: 501 }
  );
}

