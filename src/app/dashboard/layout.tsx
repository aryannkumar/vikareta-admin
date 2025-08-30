'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const user = localStorage.getItem('adminUser');
    
    if (token && user) {
      try {
        setAdminUser(JSON.parse(user));
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        router.push('/');
      }
    } else {
      router.push('/');
    }
    
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="admin-main">
        <Header adminUser={adminUser} onLogout={handleLogout} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}