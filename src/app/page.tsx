'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while determining auth status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full w-8 h-8 border-3 border-orange-200 border-t-orange-500 mb-3" aria-label="Loading" role="status"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
