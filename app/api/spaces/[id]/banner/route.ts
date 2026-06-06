import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Create new FormData with correct field name expected by backend
    const backendFormData = new FormData();
    backendFormData.append('banner', file);

    const response = await fetch(`${BACKEND_URL}/spaces/${id}/banner`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
      },
      body: backendFormData,
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading banner:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
