'use client';

import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userRole === 'ADMIN' || userRole === 'STAFF') {
        router.push('/admin');
      } else if (userRole === 'CONTRACTOR') {
        router.push('/contractor');
      } else {
        router.push('/login');
      }
    }
  }, [user, userRole, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-500 mx-auto mb-4" />
        <p className="text-graphite-300">Loading...</p>
      </div>
    </div>
  );
}
