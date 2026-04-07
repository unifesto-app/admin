'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const onLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <button
      onClick={onLogout}
      className="text-xs border border-zinc-200 rounded-full px-3 py-1 text-zinc-600 hover:bg-zinc-100"
      type="button"
    >
      Logout
    </button>
  );
}
