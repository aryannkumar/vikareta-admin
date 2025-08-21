/**
 * Admin Auth Provider - Using Unified Vikareta Auth System
 * Simplified provider that uses the unified authentication
 */

'use client';

import React, { createContext, useContext } from 'react';
import { useVikaretaAuth, VikaretaAuthProvider, VikaretaUser } from '@/lib/auth/vikareta';

// Admin User type for backward compatibility
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'moderator' | 'support';
  permissions?: string[];
  isActive?: boolean;
  lastLogin?: string;
  phone?: string;
  businessName?: string;
  userType?: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Convert VikaretaUser to AdminUser format for backward compatibility
function convertUser(vikaretaUser: VikaretaUser | null): AdminUser | null {
  if (!vikaretaUser) return null;
  
  // Map userType to admin role
  const mapUserTypeToRole = (userType?: string): 'super_admin' | 'admin' | 'moderator' | 'support' => {
    switch (userType) {
      case 'super_admin': return 'super_admin';
      case 'admin': return 'admin';
      case 'moderator': return 'moderator';
      case 'support': return 'support';
      default: return 'admin';
    }
  };
    
  return {
    id: vikaretaUser.id,
    email: vikaretaUser.email || '',
    firstName: vikaretaUser.firstName || '',
    lastName: vikaretaUser.lastName || '',
    role: mapUserTypeToRole(vikaretaUser.userType),
    permissions: [], // Default empty permissions
    isActive: true, // Default active
    lastLogin: vikaretaUser.createdAt,
    phone: vikaretaUser.phone,
    businessName: vikaretaUser.businessName,
    userType: vikaretaUser.userType,
  };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  // Use the unified Vikareta auth system underneath
  return (
    <VikaretaAuthProvider>
      <AdminAuthBridge>
        {children}
      </AdminAuthBridge>
    </VikaretaAuthProvider>
  );
}

function AdminAuthBridge({ children }: { children: React.ReactNode }) {
  const vikaretaAuth = useVikaretaAuth();
  
  // Convert to admin format
  const mappedUser = convertUser(vikaretaAuth.user);
  
  // Bridge the login function
  const login = async (credentials: { email: string; password: string }) => {
    return await vikaretaAuth.login(credentials);
  };

  // Bridge the logout function
  const logout = async () => {
    await vikaretaAuth.logout();
  };
  
  const authContextValue: AdminAuthContextType = {
    user: mappedUser,
    isAuthenticated: vikaretaAuth.isAuthenticated,
    isLoading: vikaretaAuth.isLoading,
    login,
    logout,
    hasPermission: (_permission: string) => {
      // Admin users typically have all permissions or check against role/permissions
      return true; // Implement actual permission checking as needed
    }
  };

  return (
    <AdminAuthContext.Provider value={authContextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Backward compatibility exports
export const useAuth = useAdminAuth;
export const AuthProvider = AdminAuthProvider;