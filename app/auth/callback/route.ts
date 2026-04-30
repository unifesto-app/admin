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

    // Use the current request origin to ensure correct domain
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
      // Post message to opener window (main login window)
      window.opener.postMessage(payload, origin);
      window.close();
      return;
    }

    // If no opener (direct navigation), redirect to admin dashboard
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
