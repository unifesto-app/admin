import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  createSessionToken,
  getAuthCookieName,
  getCookieMaxAge,
  isAuthConfigured,
  verifyAdminCredentials,
} from '@/lib/admin-auth';

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(req: NextRequest) {
  if (!isAuthConfigured()) {
    return Response.json(
      { success: false, error: 'Admin auth is not configured on the server.' },
      { status: 500 }
    );
  }

  const body = (await req.json()) as LoginBody;
  const username = body.username?.trim() ?? '';
  const password = body.password ?? '';

  if (!verifyAdminCredentials(username, password)) {
    return Response.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
  }

  const token = await createSessionToken(username);
  const response = NextResponse.json({ success: true });
  response.cookies.set(getAuthCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: getCookieMaxAge(),
  });

  return response;
}
