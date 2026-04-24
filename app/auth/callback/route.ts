import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/super-admin';
  const safeNext = next.startsWith('/super-admin') ? next : '/super-admin';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    const payload = JSON.stringify(
      error
        ? { type: 'oauth:error', error: error.message }
        : { type: 'oauth:success', next: safeNext }
    );

    return new NextResponse(
      `<!doctype html>
<html><head><title>Auth Complete</title></head>
<body>
<script>
  (function () {
    var payload = ${payload};
    var fallback = ${JSON.stringify(safeNext)};

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin);
      window.close();
      return;
    }

    window.location.replace(fallback);
  })();
</script>
Authentication complete. You can close this window.
</body></html>`,
      {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    );
  }

  return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
