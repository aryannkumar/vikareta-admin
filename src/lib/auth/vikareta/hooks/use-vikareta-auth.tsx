/**
 * Vikareta Platform - Unified Auth Hook
 * Secure React hook for authentication across all Vikareta modules
 * Security: Type-safe, validated state management
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  VikaretaAuthState, 
  VikaretaUser,
  VIKARETA_AUTH_CONSTANTS 
} from '../vikareta-auth-types';
import { vikaretaSSOClient } from '../vikareta-sso-client';
import { vikaretaCrossDomainAuth } from '../vikareta-cross-domain';

export interface UseVikaretaAuthReturn {
  // State
  user: VikaretaUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  
  // Utilities
  hasRole: (role: string | string[]) => boolean;
  canAccess: (domain: 'main' | 'dashboard' | 'admin') => boolean;
}

/**
 * Unified authentication hook for all Vikareta modules
 */
export function useVikaretaAuth(): UseVikaretaAuthReturn {
  const [authState, setAuthState] = useState<VikaretaAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    sessionId: null
  });

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const initialState = await vikaretaSSOClient.initialize();
      setAuthState(initialState);
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        sessionId: null
      });
    }
  }, []);

  /**
   * Secure login function
   */
  const login = useCallback(async (credentials: { email: string; password: string }): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await vikaretaSSOClient.login(credentials);
      setAuthState(result);
      
      return result.isAuthenticated;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
      return false;
    }
  }, []);

  /**
   * Secure logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await vikaretaSSOClient.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionId: null
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout state even if API fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        sessionId: null
      });
    }
  }, []);

  /**
   * Refresh authentication token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const success = await vikaretaSSOClient.refreshToken();
      
      if (success) {
        // Update state with refreshed data
        const updatedState = vikaretaCrossDomainAuth.getStoredAuthData();
        setAuthState(updatedState);
      } else {
        // Token refresh failed, clear auth state
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Session expired',
          sessionId: null
        });
      }
      
      return success;
    } catch (error) {
      console.error('Token refresh failed:', error);
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      }));
      return false;
    }
  }, []);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Check if user has specific role(s)
   */
  const hasRole = useCallback((role: string | string[]): boolean => {
    if (!authState.user?.userType) return false;
    
    const userRole = authState.user.userType;
    const allowedRoles = Array.isArray(role) ? role : [role];
    
    return allowedRoles.includes(userRole);
  }, [authState.user]);

  /**
   * Check if user can access specific domain
   */
  const canAccess = useCallback((domain: 'main' | 'dashboard' | 'admin'): boolean => {
    if (!authState.user) return false;
    
    const userType = authState.user.userType;
    
    switch (domain) {
      case 'main':
        return true; // All authenticated users can access main
      case 'dashboard':
        return ['seller', 'both', 'admin', 'super_admin'].includes(userType || '');
      case 'admin':
        return ['admin', 'super_admin'].includes(userType || '');
      default:
        return false;
    }
  }, [authState.user]);

  /**
   * Set up periodic token refresh
   */
  useEffect(() => {
    if (!authState.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const success = await refreshToken();
      if (!success) {
        console.warn('Automatic token refresh failed');
      }
    }, VIKARETA_AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS_TOKEN * 1000 * 0.8); // Refresh at 80% of expiry

    return () => clearInterval(refreshInterval);
  }, [authState.isAuthenticated, refreshToken]);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  /**
   * Listen for storage changes (cross-tab sync)
   */
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE) {
        // Auth state changed in another tab, update current state
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth]);

  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    
    // Actions
    login,
    logout,
    refreshToken,
    clearError,
    
    // Utilities
    hasRole,
    canAccess
  };
}

// Auth Context for Provider Pattern
const VikaretaAuthContext = createContext<UseVikaretaAuthReturn | null>(null);

/**
 * Provider component for Vikareta authentication
 */
export function VikaretaAuthProvider({ children }: { children: ReactNode }) {
  const auth = useVikaretaAuth();
  
  return (
    <VikaretaAuthContext.Provider value={auth}>
      {children}
    </VikaretaAuthContext.Provider>
  );
}

/**
 * Hook to use Vikareta auth context
 */
export function useVikaretaAuthContext(): UseVikaretaAuthReturn {
  const context = useContext(VikaretaAuthContext);
  if (!context) {
    throw new Error('useVikaretaAuthContext must be used within VikaretaAuthProvider');
  }
  return context;
}