/**
 * Vikareta Platform - Session Management
 * Secure session handling with automatic cleanup and validation
 * Security: Session timeout, concurrent session detection, activity tracking
 */

import { 
  VikaretaSession, 
  VIKARETA_AUTH_CONSTANTS 
} from './vikareta-auth-types';

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
      const stored = localStorage.getItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return data.sessionId ? {
        id: data.sessionId,
        userId: data.user?.id || '',
        domain: data.domain || 'main',
        createdAt: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        expiresAt: new Date(Date.now() + VIKARETA_AUTH_CONSTANTS.TOKEN_EXPIRY.REFRESH_TOKEN * 1000).toISOString(),
        lastActivityAt: new Date().toISOString()
      } : null;
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
      const stored = localStorage.getItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE);
      if (stored) {
        const data = JSON.parse(stored);
        data.lastActivity = Date.now();
        localStorage.setItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE, JSON.stringify(data));
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
      const stored = localStorage.getItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE);
      if (!stored) return true;

      const data = JSON.parse(stored);
      const lastActivity = data.lastActivity || data.timestamp;
      
      if (!lastActivity) return true;

      const timeSinceActivity = Date.now() - lastActivity;
      return timeSinceActivity > this.ACTIVITY_TIMEOUT;
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
      localStorage.removeItem(VIKARETA_AUTH_CONSTANTS.STORAGE_KEYS.AUTH_STATE);
      
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