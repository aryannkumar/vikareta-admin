/**
 * Vikareta Platform - Unified Authentication Types
 * Shared type definitions across all Vikareta modules
 * Security: Standardized data structures with validation
 */

export interface VikaretaUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  userType?: 'buyer' | 'seller' | 'both' | 'admin' | 'super_admin';
  verificationTier?: 'unverified' | 'basic' | 'verified' | 'premium';
  isVerified?: boolean;
  phone?: string;
  gstin?: string;
  createdAt: string;
}

export interface VikaretaAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  tokenType: 'Bearer';
}

export interface VikaretaAuthData {
  user: VikaretaUser;
  tokens: VikaretaAuthTokens;
  sessionId?: string;
  domain: VikaretaDomain;
}

export interface VikaretaSession {
  id: string;
  userId: string;
  domain: VikaretaDomain;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
}

export type VikaretaDomain = 'main' | 'dashboard' | 'admin';

export interface VikaretaDomainConfig {
  main: string;
  dashboard: string;
  admin: string;
  api: string;
}

export interface VikaretaCookieConfig {
  name: string;
  domain: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'none' | 'lax' | 'strict';
  maxAge: number;
}

export interface VikaretaSSoToken {
  token: string;
  targetDomain: VikaretaDomain;
  expiresAt: number;
  signature: string;
}

export interface VikaretaAuthState {
  user: VikaretaUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
}

export interface VikaretaAuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Security Constants
export const VIKARETA_AUTH_CONSTANTS = {
  COOKIE_NAMES: {
    ACCESS_TOKEN: 'vikareta_access_token',
    REFRESH_TOKEN: 'vikareta_refresh_token',
    SESSION_ID: 'vikareta_session_id',
    CSRF_TOKEN: 'XSRF-TOKEN'
  },
  STORAGE_KEYS: {
    AUTH_STATE: 'vikareta_auth_state',
    USER_PREFERENCES: 'vikareta_user_prefs',
    RETURN_URL: 'vikareta_return_url'
  },
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: 3600, // 1 hour
    REFRESH_TOKEN: 604800, // 7 days
    SSO_TOKEN: 300 // 5 minutes
  },
  DOMAINS: {
    MAIN: process.env.NEXT_PUBLIC_MAIN_HOST || 'vikareta.com',
    DASHBOARD: process.env.NEXT_PUBLIC_DASHBOARD_HOST || 'dashboard.vikareta.com',
    ADMIN: process.env.NEXT_PUBLIC_ADMIN_HOST || 'admin.vikareta.com',
    API: process.env.NEXT_PUBLIC_API_HOST || 'api.vikareta.com'
  }
} as const;

// Type guards for runtime validation
export function isVikaretaUser(user: any): user is VikaretaUser {
  return user && 
         typeof user.id === 'string' && 
         user.id.length > 0 &&
         (!user.email || typeof user.email === 'string');
}

export function isVikaretaAuthTokens(tokens: any): tokens is VikaretaAuthTokens {
  return tokens && 
         typeof tokens.accessToken === 'string' && 
         typeof tokens.refreshToken === 'string' &&
         tokens.accessToken.length > 0 &&
         tokens.refreshToken.length > 0;
}

export function isVikaretaAuthData(data: any): data is VikaretaAuthData {
  return data && 
         isVikaretaUser(data.user) && 
         isVikaretaAuthTokens(data.tokens) &&
         ['main', 'dashboard', 'admin'].includes(data.domain);
}