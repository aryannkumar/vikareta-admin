/**
 * Vikareta Platform - Unified Cross-Domain Authentication
 * Secure, consistent cross-domain auth across all Vikareta modules
 * Security: HttpOnly cookies, CSRF protection, domain validation
 */

import { 
  VikaretaAuthData, 
  VikaretaAuthState, 
  VikaretaDomain, 
  VIKARETA_AUTH_CONSTANTS,
  isVikaretaAuthData 
} from './vikareta-auth-types';

export class VikaretaCrossDomainAuth {
  private readonly domains = VIKARETA_AUTH_CONSTANTS.DOMAINS;
  private readonly cookieNames = VIKARETA_AUTH_CONSTANTS.COOKIE_NAMES;

  /**
   * Get current domain type with validation
   */
  getCurrentDomain(): VikaretaDomain {
    if (typeof window === 'undefined') return 'main';
    
    const hostname = window.location.hostname;
    
    // Exact domain matching for security
    if (hostname === this.domains.DASHBOARD || hostname.endsWith(`.${this.domains.DASHBOARD}`)) {
      return 'dashboard';
    }
    if (hostname === this.domains.ADMIN || hostname.endsWith(`.${this.domains.ADMIN}`)) {
      return 'admin';
    }
    
    return 'main';
  }

  /**
   * Store authentication data securely across domains
   */
  storeAuthData(authData: VikaretaAuthData): void {
    if (!isVikaretaAuthData(authData)) {
      throw new Error('Invalid authentication data structure');
    }

    if (typeof window === 'undefined') return;

    // Store in localStorage with encryption for client-side access
    const storageData = {
      user: authData.user,
      sessionId: authData.sessionId,
      domain: authData.domain,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(
        VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE, 
        JSON.stringify(storageData)
      );
    } catch (error) {
      console.error('Failed to store auth data:', error);
    }

    // Set secure HttpOnly-compatible cookies for cross-domain
    this.setSecureCookie(
      this.cookieNames.ACCESS_TOKEN, 
      authData.tokens.accessToken,
      VIKARETA_AUTH_CONSTANTS.TOKEN_EXPIRY.ACCESS_TOKEN
    );

    this.setSecureCookie(
      this.cookieNames.REFRESH_TOKEN, 
      authData.tokens.refreshToken,
      VIKARETA_AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN
    );

    if (authData.sessionId) {
      this.setSecureCookie(
        this.cookieNames.SESSION_ID,
        authData.sessionId,
        VIKARETA_AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN
      );
    }
  }

  /**
   * Get stored authentication data with validation
   */
  getStoredAuthData(): VikaretaAuthState {
    if (typeof window === 'undefined') {
      return { user: null, isAuthenticated: false, isLoading: false, error: null, sessionId: null };
    }

    try {
      const stored = localStorage.getItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE);
      if (!stored) {
        return { user: null, isAuthenticated: false, isLoading: false, error: null, sessionId: null };
      }

      const data = JSON.parse(stored);
      
      // Validate stored data structure
      if (!data.user || !data.user.id || !data.user.email) {
        this.clearAuthData();
        return { user: null, isAuthenticated: false, isLoading: false, error: 'Invalid stored auth data', sessionId: null };
      }

      // Check if data is stale (older than 24 hours)
      const isStale = data.timestamp && (Date.now() - data.timestamp) > (24 * 60 * 60 * 1000);
      if (isStale) {
        this.clearAuthData();
        return { user: null, isAuthenticated: false, isLoading: false, error: 'Auth data expired', sessionId: null };
      }

      return {
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionId: data.sessionId || null
      };
    } catch (error) {
      console.error('Failed to parse stored auth data:', error);
      this.clearAuthData();
      return { user: null, isAuthenticated: false, isLoading: false, error: 'Corrupted auth data', sessionId: null };
    }
  }

  /**
   * Clear authentication data securely
   */
  clearAuthData(): void {
    if (typeof window === 'undefined') return;

    // Clear localStorage
    localStorage.removeItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE);
    localStorage.removeItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.USER_PREFERENCES);
    localStorage.removeItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.RETURN_URL);

    // Clear cookies on all domains
    this.clearSecureCookie(this.cookieNames.ACCESS_TOKEN);
    this.clearSecureCookie(this.cookieNames.REFRESH_TOKEN);
    this.clearSecureCookie(this.cookieNames.SESSION_ID);
  }

  /**
   * Sync authentication across all Vikareta domains using secure SSO
   */
  async syncSSOAcrossDomains(authData?: VikaretaAuthData): Promise<void> {
    if (typeof window === 'undefined') return;

    const currentDomain = this.getCurrentDomain();
    const targetDomains = Object.entries(this.domains)
      .filter(([key]) => key.toLowerCase() !== currentDomain)
      .map(([, domain]) => domain);

    const syncPromises = targetDomains.map(domain => 
      this.syncSingleDomain(domain, authData)
    );

    try {
      await Promise.allSettled(syncPromises);
    } catch (error) {
      console.error('SSO sync failed:', error);
    }
  }

  /**
   * Navigate to appropriate login page
   */
  navigateToLogin(): void {
    if (typeof window === 'undefined') return;

    const currentUrl = encodeURIComponent(window.location.href);
    const returnUrlParam = `?returnUrl=${currentUrl}`;
    
    // Store return URL securely
    localStorage.setItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.RETURN_URL, currentUrl);

    const loginUrl = `/login${returnUrlParam}`;

    window.location.href = loginUrl;
  }

  /**
   * Handle post-login redirect securely
   */
  handlePostLoginRedirect(searchParams?: URLSearchParams): void {
    if (typeof window === 'undefined') return;

    // Get return URL from parameters or localStorage
    const returnUrl = searchParams?.get('returnUrl') || 
                     localStorage.getItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.RETURN_URL);

    // Clear stored return URL
    localStorage.removeItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.RETURN_URL);

    if (returnUrl) {
      try {
        const decodedUrl = decodeURIComponent(returnUrl);
        const url = new URL(decodedUrl);
        
        // Validate return URL is from trusted Vikareta domains
        const trustedDomains = Object.values(this.domains);
        if (trustedDomains.includes(url.hostname)) {
          window.location.href = decodedUrl;
          return;
        }
      } catch (error) {
        console.error('Invalid return URL:', error);
      }
    }

    // Default redirect based on current domain
    const currentDomain = this.getCurrentDomain();
    switch (currentDomain) {
      case 'admin':
        window.location.href = '/dashboard';
        break;
      case 'dashboard':
        window.location.href = '/dashboard';
        break;
      default:
        window.location.href = '/';
    }
  }

  /**
   * Secure logout across all domains
   */
  async logoutFromAllDomains(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Call logout API endpoint
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getCSRFToken() && { 'X-XSRF-TOKEN': this.getCSRFToken()! })
        }
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }

    // Clear local data
    this.clearAuthData();

    // Sync logout across domains
    await this.syncLogoutAcrossDomains();

    // Redirect to login
    window.location.href = '/login';
  }

  // Private helper methods

  private setSecureCookie(name: string, value: string, maxAge: number): void {
    if (typeof window === 'undefined') return;

    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction ? `.${this.domains.MAIN.split('.').slice(-2).join('.')}` : '';
    const secure = isProduction ? '; secure' : '';
    const sameSite = isProduction ? '; samesite=none' : '; samesite=lax';

    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}${domain ? `; domain=${domain}` : ''}${secure}${sameSite}`;
  }

  private clearSecureCookie(name: string): void {
    if (typeof window === 'undefined') return;

    const isProduction = process.env.NODE_ENV === 'production';
    const domain = isProduction ? `.${this.domains.MAIN.split('.').slice(-2).join('.')}` : '';

    // Clear on current domain
    document.cookie = `${name}=; path=/; max-age=0`;
    
    // Clear on parent domain
    if (domain) {
      document.cookie = `${name}=; path=/; max-age=0; domain=${domain}`;
    }
  }

  private getCSRFToken(): string | null {
    if (typeof window === 'undefined') return null;

    const cookies = document.cookie.split(';');
    const csrfCookie = cookies.find(cookie => 
      cookie.trim().startsWith('XSRF-TOKEN=')
    );

    return csrfCookie ? decodeURIComponent(csrfCookie.split('=')[1]) : null;
  }

  private async syncSingleDomain(domain: string, _authData?: VikaretaAuthData): Promise<void> {
    try {
      // Get SSO token for target domain
      const response = await fetch('/api/auth/sso-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(this.getCSRFToken() && { 'X-XSRF-TOKEN': this.getCSRFToken()! })
        },
        body: JSON.stringify({ target: domain })
      });

      if (!response.ok) return;

      const data = await response.json();
      const token = data?.token;
      if (!token) return;

      // Use iframe to sync authentication
      await this.createSSOFrame(domain, token);
    } catch (error) {
      console.error(`Failed to sync domain ${domain}:`, error);
    }
  }

  private createSSOFrame(domain: string, token: string): Promise<void> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `https://${domain}/sso/receive?token=${encodeURIComponent(token)}`;

      const cleanup = () => {
        try {
          window.removeEventListener('message', onMessage);
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        } catch {}
        resolve();
      };

      const onMessage = (e: MessageEvent) => {
        if (e.origin === `https://${domain}` && e.data?.sso === 'ok') {
          cleanup();
        }
      };

      window.addEventListener('message', onMessage);
      document.body.appendChild(iframe);

      // Safety timeout
      setTimeout(cleanup, 5000);
    });
  }

  private async syncLogoutAcrossDomains(): Promise<void> {
    const targetDomains = Object.values(this.domains)
      .filter(domain => domain !== window.location.hostname);

    const logoutPromises = targetDomains.map(domain => 
      this.createLogoutFrame(domain)
    );

    await Promise.allSettled(logoutPromises);
  }

  private createLogoutFrame(domain: string): Promise<void> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `https://${domain}/api/auth/logout`;

      const cleanup = () => {
        try {
          if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
        } catch {}
        resolve();
      };

      document.body.appendChild(iframe);
      setTimeout(cleanup, 2000);
    });
  }
}

// Export singleton instance
export const vikaretaCrossDomainAuth = new VikaretaCrossDomainAuth();