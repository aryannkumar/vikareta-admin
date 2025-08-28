/**
 * Vikareta Platform - Session Management
 * Secure session handling with automatic cleanup and validation
 * Security: Session timeout, concurrent session detection, activity tracking
 */

import { 
  VikaretaSession, 
  VIKARETA_AUTH_CONSTANTS 
} from './vikareta-auth-types';
import { vikaretaCrossDomainAuth } from './vikareta-cross-domain';

export class VikaretaSessionManager {
  private activityTimer: NodeJS.Timeout | null = null;
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Start session management
   */
  startSession(sessionId: string): void {
    if (typeof window === 'undefined') return;

    // Track user activity
    this.setupActivityTracking();
    
    // Start heartbeat to maintain session
    this.startHeartbeat(sessionId);
    
    // Set session timeout
    this.resetActivityTimer();
  }

  /**
   * Stop session management
   */
  stopSession(): void {
    if (typeof window === 'undefined') return;

    this.clearActivityTracking();
    this.clearActivityTimer();
  }

  /**
   * Validate session state
   */
  async validateSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });

      return response.ok;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Get session info
   */
  getSessionInfo(): VikaretaSession | null {
    if (typeof window === 'undefined') return null;

    try {
      // Use cross-domain auth state (in-memory / server-backed) instead of localStorage
      const state = vikaretaCrossDomainAuth.getStoredAuthData();
      if (!state || !state.sessionId || !state.user) return null;
      return {
        id: state.sessionId,
        userId: state.user.id,
        domain: vikaretaCrossDomainAuth.getCurrentDomain(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + VIKARETA_AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN * 1000).toISOString(),
        lastActivityAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to get session info:', error);
      return null;
    }
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    if (typeof window === 'undefined') return;

    try {
      // Update in-memory cross-domain auth state activity timestamp
      const state = vikaretaCrossDomainAuth.getStoredAuthData();
      if (state && state.sessionId) {
        // There's no persistent storage for activity; rely on server heartbeat
        // Optionally we could POST /api/auth/activity to update last activity server-side
      }
    } catch (error) {
      console.error('Failed to update activity:', error);
    }

    this.resetActivityTimer();
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(): boolean {
    if (typeof window === 'undefined') return true;

    try {
      const state = vikaretaCrossDomainAuth.getStoredAuthData();
      if (!state || !state.sessionId) return true;
      // We don't have a client-side lastActivity; rely on server session timeout
      return false;
    } catch (error) {
      console.error('Failed to check session expiry:', error);
      return true;
    }
  }

  /**
   * Setup activity tracking
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const throttledUpdate = this.throttle(() => this.updateActivity(), 30000); // Max once per 30 seconds

    events.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Store cleanup function
    (window as any).__vikaretaSessionCleanup = () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
    };
  }

  /**
   * Clear activity tracking
   */
  private clearActivityTracking(): void {
    if (typeof window === 'undefined') return;

    if ((window as any).__vikaretaSessionCleanup) {
      (window as any).__vikaretaSessionCleanup();
      delete (window as any).__vikaretaSessionCleanup;
    }
  }

  /**
   * Reset activity timer
   */
  private resetActivityTimer(): void {
    this.clearActivityTimer();

    this.activityTimer = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.ACTIVITY_TIMEOUT);
  }

  /**
   * Clear activity timer
   */
  private clearActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    console.warn('Session timeout due to inactivity');
    
    // Clear auth data
    if (typeof window !== 'undefined') {
      // Clear cross-domain in-memory auth state
      vikaretaCrossDomainAuth.clearAuthData();

      // Redirect to login
      window.location.href = '/login?reason=timeout';
    }
  }

  /**
   * Start heartbeat to maintain session
   */
  private startHeartbeat(sessionId: string): void {
    const heartbeat = setInterval(async () => {
      if (this.isSessionExpired()) {
        clearInterval(heartbeat);
        return;
      }

      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, this.HEARTBEAT_INTERVAL);

    // Store cleanup function
    if (typeof window !== 'undefined') {
      (window as any).__vikaretaHeartbeatCleanup = () => clearInterval(heartbeat);
    }
  }

  /**
   * Throttle function calls
   */
  private throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
}

// Export singleton instance
export const vikaretaSessionManager = new VikaretaSessionManager();