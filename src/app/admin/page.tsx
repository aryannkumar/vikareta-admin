'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect /admin to /dashboard
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full w-8 h-8 border-3 border-orange-200 border-t-orange-500 mb-3" aria-label="Loading" role="status"></div>
                <p className="text-gray-600">Redirecting to dashboard...</p>
            </div>
        </div>
    );
}