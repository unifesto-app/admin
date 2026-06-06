import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const search = searchParams.get('search');

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(visibility && { visibility }),
      ...(search && { search }),
    });

    const response = await fetch(`${BACKEND_URL}/spaces?${queryParams}`, {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching spaces:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/spaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating space:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
