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
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      checkAuth();
    }
  }, [isHydrated]);

  const checkAuth = async () => {
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined') {
        console.log('Auth check: Not in browser, skipping');
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('admin_token');
      console.log('Auth check: Token exists:', !!token);

      if (!token) {
        console.log('Auth check: No token found');
        setIsLoading(false);
        return;
      }

      console.log('Auth check: Validating token with backend...');

      // Validate token with backend
      const response = await adminApiClient.get('/auth/me');

      console.log('Auth check: Backend response:', response.data);

      if (response.data?.success && response.data?.data) {
        const backendUser = response.data.data;

        console.log('Auth check: User data received:', {
          id: backendUser.id,
          email: backendUser.email,
          userType: backendUser.userType,
          isVerified: backendUser.isVerified
        });

        // Check if user has admin privileges
        if (backendUser.userType !== 'admin' && backendUser.userType !== 'seller') {
          throw new Error('Access denied: Admin privileges required');
        }

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

        console.log('Auth check: Setting user as authenticated');
        setUser(adminUser);

        // Update cookie to ensure middleware has access
        document.cookie = `admin_token=${token}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      console.log('Auth check: Clearing tokens and redirecting to login');

      // Clear invalid tokens
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('csrf_token');

      // Clear cookie
      document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Use the special login method that handles CSRF token properly
      const response = await adminApiClient.loginWithCSRF(email, password);

      console.log('Auth provider received response:', response.data);

      // The response structure is: {success: true, data: {user, token, refreshToken}, message}
      const responseData = response.data.data;
      const backendUser = responseData.user;
      const tokens = {
        accessToken: responseData.token,
        refreshToken: responseData.refreshToken
      };

      console.log('Extracted user:', backendUser);
      console.log('Extracted tokens:', tokens);
      console.log('Storing tokens in localStorage...');
      localStorage.setItem('admin_token', tokens.accessToken);
      localStorage.setItem('admin_refresh_token', tokens.refreshToken);
      console.log('Tokens stored. Admin token length:', tokens.accessToken.length);
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

      console.log('Setting admin user:', adminUser);
      setUser(adminUser);
      console.log('Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error in auth provider:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
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