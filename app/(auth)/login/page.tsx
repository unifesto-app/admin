'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authClient } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gradientText } from '@/lib/styles';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [needsMobileVerification, setNeedsMobileVerification] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  
  const nextPath = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      if (authClient.isAuthenticated()) {
        const session = await authClient.getSession();
        if (session) {
          router.push(nextPath);
        }
      }
    };
    checkAuth();
  }, [nextPath, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authClient.sendEmailOtp(email);
      setOtpSent(true);
      setError('');
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to send OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      setError('OTP is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authClient.verifyEmailOtp(email, otp);
      
      if (response.requiresMobileVerification) {
        setNeedsMobileVerification(true);
        setTempToken(response.tempToken || '');
      } else {
        router.push(nextPath);
        router.refresh();
      }
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Invalid OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileNumber) {
      setError('Mobile number is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authClient.sendMobileOtp(mobileNumber, tempToken);
      setMobileOtpSent(true);
      setError('');
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to send OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileOtp) {
      setError('OTP is required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authClient.verifyMobile(mobileNumber, mobileOtp, tempToken);
      router.push(nextPath);
      router.refresh();
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Mobile verification failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (needsMobileVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3 pb-6">
            <div className="text-left space-y-1">
              <CardTitle className="text-3xl font-logo font-normal leading-relaxed" style={{...gradientText, display: 'inline-block'}}>
                unifesto
              </CardTitle>
              <CardDescription className="text-left">
                Verify Mobile Number
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {!mobileOtpSent ? (
              <form onSubmit={handleSendMobileOtp} className="space-y-3">
                <div>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="Mobile Number (e.g., +919876543210)"
                    className="w-full px-3 py-2 border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyMobile} className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full px-3 py-2 border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full rounded-full text-sm" 
                  onClick={() => setMobileOtpSent(false)}
                >
                  Change Mobile Number
                </Button>
              </form>
            )}

            <p className="text-xs text-center text-muted-foreground">
              OTP will be sent to your WhatsApp number
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
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
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full px-3 py-2 border border-input rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full rounded-full text-sm" 
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                Change Email
              </Button>
            </form>
          )}

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
