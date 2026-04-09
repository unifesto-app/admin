'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type Props = {
  nextPath: string;
  configError?: string;
};

export default function LoginClient({ nextPath, configError }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== 'object') return;

      const payload = event.data as { type?: string; next?: string; error?: string };

      if (payload.type === 'oauth:success') {
        const destination = payload.next && payload.next.startsWith('/super-admin') ? payload.next : nextPath;
        router.replace(destination);
        router.refresh();
        return;
      }

      if (payload.type === 'oauth:error') {
        setError(payload.error ?? 'Google sign-in failed');
        setLoading(false);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [nextPath, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      // Keep redirectTo fixed so it reliably matches Supabase allow-list rules.
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: true,
        },
      });

      if (signInError) {
        throw signInError;
      }

      if (!data?.url) {
        throw new Error('Failed to generate Google login URL.');
      }

      const popup = window.open(
        data.url,
        'unifesto_google_auth',
        'width=500,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleEmailPasswordSignIn = async () => {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      window.location.assign(nextPath);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Email sign-in failed');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#f4f4f5_45%,_#e4e4e7_100%)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400 mb-2">UNIFESTO</p>
          <h1 className="text-2xl font-semibold text-black">Admin Login</h1>
          <p className="text-sm text-zinc-500 mt-2">Sign in with Google or email/password to access the console.</p>
        </div>

        {configError === 'supabase-config-missing' ? (
          <p className="text-xs text-red-600 mb-4">Supabase environment variables are missing.</p>
        ) : null}

        {error ? <p className="text-xs text-red-600 mb-4">{error}</p> : null}

        <div className="space-y-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={handleEmailPasswordSignIn}
            disabled={loading}
            className="w-full bg-zinc-900 text-white text-sm rounded-lg py-2.5 font-medium hover:bg-black disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in with Email'}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-px bg-zinc-200 flex-1" />
          <span className="text-[11px] text-zinc-400 uppercase tracking-wide">or</span>
          <div className="h-px bg-zinc-200 flex-1" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full border border-zinc-200 bg-white text-zinc-700 text-sm rounded-lg py-2.5 font-medium hover:bg-zinc-50 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors"
        >
          <GoogleLogo />
          {loading ? 'Opening Google...' : 'Continue with Google'}
        </button>

        <p className="text-xs text-zinc-400 mt-3">Only users with admin privileges can access the dashboard.</p>
      </div>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path fill="#EA4335" d="M12 10.2v3.96h5.62c-.24 1.34-1.52 3.92-5.62 3.92-3.38 0-6.14-2.8-6.14-6.24S8.62 5.64 12 5.64c1.92 0 3.21.82 3.95 1.52l2.69-2.59C16.91 2.98 14.73 2 12 2 6.92 2 2.8 6.12 2.8 11.2S6.92 20.4 12 20.4c6.7 0 8.84-4.7 8.84-7.16 0-.47-.05-.83-.11-1.16H12Z" />
      <path fill="#4285F4" d="M3.48 7.38l3.2 2.35C7.56 7.38 9.56 5.64 12 5.64c1.92 0 3.21.82 3.95 1.52l2.69-2.59C16.91 2.98 14.73 2 12 2 8.03 2 4.58 4.24 3.48 7.38Z" />
      <path fill="#FBBC05" d="M12 20.4c2.62 0 4.84-.86 6.45-2.35l-2.98-2.44c-.82.56-1.9 1.12-3.47 1.12-4.07 0-5.35-2.53-5.6-3.85l-3.24 2.5C4.23 18.08 7.69 20.4 12 20.4Z" />
      <path fill="#34A853" d="M21.84 12.04c0-.53-.05-.94-.13-1.35H12v3.96h5.62c-.28 1.57-1.6 2.88-3.15 3.14l2.98 2.44C19.95 18.35 21.84 15.86 21.84 12.04Z" />
    </svg>
  );
}
