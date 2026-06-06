'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AWSPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to AWS Overview as the default AWS page
    router.replace('/dashboard/aws/overview');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-96">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  );
}
