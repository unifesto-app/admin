'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gradientText } from '@/lib/styles';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const nextPath = searchParams.get('next') || '/dashboard';
  const configError = searchParams.get('error');

  const supabase = createClient();

  useEffect(() => {
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!event.data || typeof event.data !== 'object') return;

      const payload = event.data as { type?: string; next?: string; error?: string };

      if (payload.type === 'oauth:success') {
        const destination = payload.next?.startsWith('/dashboard') ? payload.next : nextPath;
        router.push(destination);
        router.refresh();
      }

      if (payload.type === 'oauth:error') {
        setError(payload.error ?? 'Google sign-in failed');
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [nextPath, router]);

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) throw new Error('Authentication failed');

      // Check admin privileges
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_active, is_banned')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
      const isActive = profile?.is_active !== false;
      const isBanned = profile?.is_banned === true;
      const privilegedEmails = ['unifestoapp@gmail.com'];
      const isPrivileged = email && privilegedEmails.includes(email.toLowerCase());

      if (isBanned) {
        await supabase.auth.signOut();
        throw new Error('Your account has been banned. Please contact support.');
      }

      if (!isPrivileged && !isAdmin) {
        await supabase.auth.signOut();
        throw new Error('You do not have admin privileges. Please contact support.');
      }

      if (!isActive) {
        await supabase.auth.signOut();
        throw new Error('Your account is inactive. Please contact support.');
      }

      router.push(nextPath);
      router.refresh();
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Email sign-in failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      // Store the origin for the auth callback to redirect back to
      const currentOrigin = window.location.origin;
      sessionStorage.setItem('auth_redirect_origin', currentOrigin);
      
      // Redirect to auth.unifesto.app with redirect_origin parameter
      const authDomain = 'https://auth.unifesto.app';
      const redirectTo = `${authDomain}/auth/callback?redirect_origin=${encodeURIComponent(currentOrigin)}`;
      
      // Debug logging
      console.log('🔍 OAuth Debug Info:');
      console.log('  - Current origin:', currentOrigin);
      console.log('  - Auth domain:', authDomain);
      console.log('  - Redirect URL:', redirectTo);
      
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

      if (signInError) throw signInError;
      if (!data?.url) throw new Error('Failed to generate Google login URL.');

      // Debug: Log the OAuth URL to check redirect_uri parameter
      console.log('  - OAuth URL:', data.url);
      console.log('  - Check redirect_uri parameter in URL above');

      const popup = window.open(
        data.url,
        'unifesto_google_auth',
        'width=500,height=700,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Google sign-in failed';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 pb-6">
          <div className="text-left space-y-1">
            <CardTitle className="text-3xl font-logo font-normal leading-relaxed" style={{...gradientText, display: 'inline-block'}}>
              unifesto
            </CardTitle>
            <CardDescription className="text-left">
              Admin Dashboard
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {configError === 'supabase-config-missing' && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              Supabase environment variables are missing.
            </div>
          )}

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailPasswordSignIn} className="space-y-3">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full px-3 py-2 border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full px-3 py-2 border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Opening Google...' : 'Continue with Google'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Only users with admin privileges can access the dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 pb-6">
            <div className="text-left space-y-1">
              <CardTitle className="text-2xl font-logo font-normal leading-relaxed" style={{...gradientText, display: 'inline-block'}}>
                unifesto
              </CardTitle>
              <CardDescription className="text-left">
                Loading...
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
