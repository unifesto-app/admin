'use client';

import { LogOut, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient, UserProfile } from '@/lib/auth/auth-client';
import { Button } from '@/components/ui/button';
import { gradientText } from '@/lib/styles';

interface DashboardHeaderProps {
  user: UserProfile | null;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl -mt-1 font-logo" style={gradientText}>
            unifesto
          </h1>
          <span className="text-sm text-muted-foreground">Admin</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{user?.fullName || user?.username || user?.mobileNumber}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
