'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { authClient, UserProfile } from '@/lib/auth/auth-client';
import DashboardNav from '@/components/dashboard/dashboard-nav';
import DashboardHeader from '@/components/dashboard/dashboard-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authClient.isAuthenticated()) {
        redirect('/login');
        return;
      }

      const session = await authClient.getSession();
      if (!session) {
        redirect('/login');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <div className="flex h-[calc(100vh-4rem)]">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
