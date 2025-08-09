'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApiClient } from '@/lib/api/admin-client';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions?: string[]; // Make permissions optional
  isActive?: boolean;
  lastLogin?: string;
  // Additional fields from backend
  phone?: string;
  businessName?: string;
  userType?: string;
  verificationTier?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await adminApiClient.get('/auth/me');
      const backendUser = response.data.user;

      // Transform backend user data to match AdminUser interface
      const adminUser: AdminUser = {
        id: backendUser.id,
        email: backendUser.email,
        firstName: backendUser.firstName,
        lastName: backendUser.lastName,
        role: backendUser.userType === 'admin' ? 'admin' : 'support', // Map userType to role
        permissions: [], // Default empty permissions for now
        isActive: backendUser.isVerified || true,
        phone: backendUser.phone,
        businessName: backendUser.businessName,
        userType: backendUser.userType,
        verificationTier: backendUser.verificationTier,
        isVerified: backendUser.isVerified,
      };

      setUser(adminUser);
    } catch (error) {
      localStorage.removeItem('admin_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await adminApiClient.post('/auth/login', {
        email,
        password,
      });

      const { data } = response.data;
      const { user: backendUser, tokens } = data;
      localStorage.setItem('admin_token', tokens.accessToken);
      localStorage.setItem('admin_refresh_token', tokens.refreshToken);
      // Also set cookie for middleware
      document.cookie = `admin_token=${tokens.accessToken}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;

      // Transform backend user data to match AdminUser interface
      const adminUser: AdminUser = {
        id: backendUser.id,
        email: backendUser.email,
        firstName: backendUser.firstName,
        lastName: backendUser.lastName,
        role: backendUser.userType === 'admin' ? 'admin' : 'support', // Map userType to role
        permissions: [], // Default empty permissions for now
        isActive: backendUser.isVerified || true,
        phone: backendUser.phone,
        businessName: backendUser.businessName,
        userType: backendUser.userType,
        verificationTier: backendUser.verificationTier,
        isVerified: backendUser.isVerified,
      };

      setUser(adminUser);
      router.push('/dashboard');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    // Also remove cookie
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    router.push('/login');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // For now, admin users have all permissions
    // In the future, implement proper permission system
    return user.role === 'super_admin' || user.role === 'admin' ||
      (user.permissions?.includes(permission) ?? false);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}