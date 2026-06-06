import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';

/**
 * API Route: DELETE /api/roles/remove
 * Remove a role from a user (pass userRoleId in body)
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('unifesto_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No authentication token' },
        { status: 401 }
      );
    }

    const { userRoleId } = await request.json();

    if (!userRoleId) {
      return NextResponse.json(
        { error: 'userRoleId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/roles/${userRoleId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Failed to remove role' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error removing role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
