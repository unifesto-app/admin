import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { spaceId } = await params;

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const pinned = searchParams.get('pinned');

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(pinned && { pinned }),
    });

    const response = await fetch(
      `${BACKEND_URL}/discussions/space/${spaceId}?${queryParams}`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
