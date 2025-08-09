'use client';

/**
 * Cross-domain authentication utility for Vikareta platform
 * Enables login/logout across vikareta.com, dashboard.vikareta.com, and admin.vikareta.com
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  userType?: string;
  verificationTier?: string;
  isVerified?: boolean;
  phone?: string;
  gstin?: string;
  createdAt: string;
}

export interface AuthData {
  user: User;
  tokens: AuthTokens;
}

const DOMAINS = {
  main: 'vikareta.com',
  dashboard: 'dashboard.vikareta.com',
  admin: 'admin.vikareta.com',
};

const STORAGE_KEYS = {
  main: 'auth_token',
  dashboard: 'dashboard_token',
  admin: 'admin_token',
};

const REFRESH_KEYS = {
  main: 'refresh_token',
  dashboard: 'dashboard_refresh_token',
  admin: 'admin_refresh_token',
};

/**
 * Get current domain type
 */
export function getCurrentDomain(): keyof typeof DOMAINS {
  if (typeof window === 'undefined') return 'main';
  
  const hostname = window.location.hostname;
  if (hostname.includes('dashboard')) return 'dashboard';
  if (hostname.includes('admin')) return 'admin';
  return 'main';
}

/**
 * Store authentication data in localStorage for current domain
 */
export function storeAuthData(authData: AuthData): void {
  if (typeof window === 'undefined') return;
  
  const domain = getCurrentDomain();
  const tokenKey = STORAGE_KEYS[domain];
  const refreshKey = REFRESH_KEYS[domain];
  
  localStorage.setItem(tokenKey, authData.tokens.accessToken);
  localStorage.setItem(refreshKey, authData.tokens.refreshToken);
  localStorage.setItem(`${tokenKey}_user`, JSON.stringify(authData.user));
}

/**
 * Get stored authentication data for current domain
 */
export function getStoredAuthData(): AuthData | null {
  if (typeof window === 'undefined') return null;
  
  const domain = getCurrentDomain();
  const tokenKey = STORAGE_KEYS[domain];
  const refreshKey = REFRESH_KEYS[domain];
  
  const accessToken = localStorage.getItem(tokenKey);
  const refreshToken = localStorage.getItem(refreshKey);
  const userStr = localStorage.getItem(`${tokenKey}_user`);
  
  if (!accessToken || !refreshToken || !userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    return {
      user,
      tokens: { accessToken, refreshToken }
    };
  } catch {
    return null;
  }
}

/**
 * Clear authentication data for current domain
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  const domain = getCurrentDomain();
  const tokenKey = STORAGE_KEYS[domain];
  const refreshKey = REFRESH_KEYS[domain];
  
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(refreshKey);
  localStorage.removeItem(`${tokenKey}_user`);
}

/**
 * Sync authentication across all domains using postMessage
 */
export function syncAuthAcrossDomains(authData: AuthData | null): void {
  if (typeof window === 'undefined') return;
  
  const message = {
    type: 'AUTH_SYNC',
    data: authData,
    timestamp: Date.now(),
  };
  
  // Post message to all domain windows if they exist
  Object.values(DOMAINS).forEach(domain => {
    try {
      // Try to communicate with other domain windows
      window.postMessage(message, `https://${domain}`);
    } catch (error) {
      // Ignore cross-origin errors
    }
  });
}

/**
 * Listen for authentication sync messages from other domains
 */
export function setupAuthSyncListener(onAuthSync: (authData: AuthData | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  
  const handleMessage = (event: MessageEvent) => {
    // Only accept messages from trusted domains
    const trustedOrigins = Object.values(DOMAINS).map(domain => `https://${domain}`);
    if (!trustedOrigins.includes(event.origin)) return;
    
    if (event.data?.type === 'AUTH_SYNC') {
      onAuthSync(event.data.data);
    }
  };
  
  window.addEventListener('message', handleMessage);
  
  return () => {
    window.removeEventListener('message', handleMessage);
  };
}

/**
 * Navigate to login page on appropriate domain
 */
export function navigateToLogin(): void {
  if (typeof window === 'undefined') return;
  
  const currentDomain = getCurrentDomain();
  const currentUrl = window.location.href;
  
  // Store return URL for redirect after login
  localStorage.setItem('auth_return_url', currentUrl);
  
  // Navigate to login on current domain
  if (currentDomain === 'admin') {
    window.location.href = '/login';
  } else if (currentDomain === 'dashboard') {
    window.location.href = '/login';
  } else {
    window.location.href = '/login';
  }
}

/**
 * Handle post-login redirect
 */
export function handlePostLoginRedirect(): void {
  if (typeof window === 'undefined') return;
  
  const returnUrl = localStorage.getItem('auth_return_url');
  localStorage.removeItem('auth_return_url');
  
  if (returnUrl && returnUrl !== window.location.href) {
    window.location.href = returnUrl;
  } else {
    // Default redirects based on domain
    const currentDomain = getCurrentDomain();
    if (currentDomain === 'admin') {
      window.location.href = '/dashboard';
    } else if (currentDomain === 'dashboard') {
      window.location.href = '/dashboard';
    } else {
      window.location.href = '/';
    }
  }
}

/**
 * Check if user has access to admin panel
 */
export function hasAdminAccess(user: User): boolean {
  return user.userType === 'admin' || user.userType === 'super_admin';
}

/**
 * Check if user has access to dashboard
 */
export function hasDashboardAccess(user: User): boolean {
  return user.userType === 'seller' || user.userType === 'both' || hasAdminAccess(user);
}

/**
 * Get appropriate redirect URL after login based on user type
 */
export function getPostLoginRedirectUrl(user: User): string {
  if (hasAdminAccess(user)) {
    return 'https://admin.vikareta.com/dashboard';
  } else if (hasDashboardAccess(user)) {
    return 'https://dashboard.vikareta.com/dashboard';
  } else {
    return 'https://vikareta.com/';
  }
}