/**
 * Cross-Domain Logout Utility for Admin
 * Ensures user is logged out from all domains simultaneously
 */

/**
 * Perform logout across all Vikareta domains from admin
 */
export async function logoutFromAllDomains(): Promise<void> {
  if (typeof window === 'undefined') return;

  const targets = [
    process.env.NEXT_PUBLIC_MAIN_HOST || 'vikareta.com',
    process.env.NEXT_PUBLIC_DASHBOARD_HOST || 'dashboard.vikareta.com', 
    process.env.NEXT_PUBLIC_ADMIN_HOST || 'admin.vikareta.com'
  ];

  const logoutPromises: Promise<void>[] = [];

  for (const host of targets) {
    const promise = (async () => {
      try {
        // Use invisible iframe to call logout on each domain
        await new Promise<void>((resolve) => {
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          
          // Use logout-all endpoint for comprehensive cleanup
          const isDev = process.env.NODE_ENV === 'development';
          const protocol = isDev ? 'http' : 'https';
          const port = isDev ? (host.includes('dashboard') ? ':3001' : host.includes('admin') ? ':3002' : ':3000') : '';
          iframe.src = `${protocol}://${host}${port}/api/auth/logout-all`;

          const cleanup = () => {
            try { window.removeEventListener('message', onMessage); } catch {}
            try { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch {}
            resolve();
          };

          const onMessage = (e: MessageEvent) => {
            // Accept LOGOUT_COMPLETE message from the target domain
            const expectedOrigin = `${protocol}://${host}${port}`;
            if ((e.origin === expectedOrigin || e.origin.includes(host)) && 
                e.data?.type === 'LOGOUT_COMPLETE') {
              cleanup();
            }
          };

          // Set up message listener for iframe response
          window.addEventListener('message', onMessage);
          
          // Also resolve after timeout to prevent hanging
          setTimeout(() => cleanup(), 3000);

          // Append iframe to trigger logout request
          document.body.appendChild(iframe);
        });
      } catch (error) {
        console.warn(`Cross-domain logout failed for ${host}:`, error);
      }
    })();

    logoutPromises.push(promise);
  }

  // Wait for all logout requests to complete
  await Promise.all(logoutPromises);
  
  console.log('Cross-domain logout completed for all domains from admin');
}

/**
 * Enhanced logout function that clears local state AND calls cross-domain logout
 */
export async function performSecureLogout(): Promise<void> {
  try {
    // 1. Clear local auth state first
    if (typeof window !== 'undefined') {
      // Clear localStorage
      ['vikareta_access_token', 'vikareta_refresh_token', 'vikareta_user', 
       'dashboard_token', 'dashboard_refresh_token', 'admin_token', 'admin_refresh_token',
       'auth_token', 'refresh_token'].forEach(key => {
        try { localStorage.removeItem(key); } catch {}
      });

      // Clear auth cookies on current domain
      const cookiesToClear = ['access_token', 'refresh_token', 'XSRF-TOKEN', 'session_id'];
      cookiesToClear.forEach(name => {
        document.cookie = `${name}=; Path=/; Max-Age=0`;
        if (process.env.NODE_ENV === 'production') {
          document.cookie = `${name}=; Path=/; Domain=.vikareta.com; Max-Age=0`;
        }
      });
    }

    // 2. Perform cross-domain logout to clear sessions on all domains
    await logoutFromAllDomains();

    // 3. Small delay to ensure all logout requests complete
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('Admin secure logout error:', error);
    // Continue with redirect even if logout fails
  }
}