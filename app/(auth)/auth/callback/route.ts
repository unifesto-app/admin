import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';
  const safeNext = next.startsWith('/dashboard') ? next : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    const payload = JSON.stringify(
      error
        ? { type: 'oauth:error', error: error.message }
        : { type: 'oauth:success', next: safeNext }
    );

    const origin = requestUrl.origin;

    return new NextResponse(
      `<!doctype html>
<html><head><title>Auth Complete</title></head>
<body>
<script>
  (function () {
    var payload = ${payload};
    var fallback = ${JSON.stringify(safeNext)};
    var origin = ${JSON.stringify(origin)};

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, origin);
      window.close();
      return;
    }

    window.location.replace(origin + fallback);
  })();
</script>
<p>Authentication complete. Redirecting...</p>
<p>If you are not redirected, <a href="${safeNext}">click here</a>.</p>
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
