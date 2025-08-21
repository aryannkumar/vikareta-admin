export async function GET(req: Request) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || (
      process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5001' 
        : 'https://api.vikareta.com'
    );

    // Call backend logout to clear HttpOnly cookies on this domain
    await fetch(`${apiBase}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('Cookie') || '',
        'X-XSRF-TOKEN': req.headers.get('X-XSRF-TOKEN') || req.headers.get('x-csrf-token') || '',
      },
      credentials: 'include',
    }).catch(() => {}); // Ignore errors

    // Return HTML page that signals completion and clears cookies
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Admin Logout Complete</title>
</head>
<body>
  <script>
    // Clear any client-side auth data
    try {
      ['vikareta_access_token', 'vikareta_refresh_token', 'vikareta_user', 
       'dashboard_token', 'dashboard_refresh_token', 'admin_token', 'admin_refresh_token',
       'auth_token', 'refresh_token'].forEach(key => {
        localStorage.removeItem(key);
      });
    } catch {}
    
    // Signal completion to parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'LOGOUT_COMPLETE', domain: location.hostname }, '*');
    }
    
    document.write('<div style="font-family: system-ui; padding: 20px; text-align: center;">Admin logout complete</div>');
  </script>
</body>
</html>`;

    const response = new Response(html, { 
      status: 200, 
      headers: { 
        'Content-Type': 'text/html',
      } 
    });
    
    // Clear all auth-related cookies on this domain
    const cookieOptions = process.env.NODE_ENV === 'production' 
      ? '; Domain=.vikareta.com; Secure; SameSite=None' 
      : '';
    
    response.headers.set('Set-Cookie', [
      `access_token=; Path=/; HttpOnly; Max-Age=0${cookieOptions}`,
      `refresh_token=; Path=/; HttpOnly; Max-Age=0${cookieOptions}`,
      `XSRF-TOKEN=; Path=/; Max-Age=0${cookieOptions}`,
      `session_id=; Path=/; HttpOnly; Max-Age=0${cookieOptions}`,
    ].join(', '));

    return response;
  } catch (error) {
    console.error('Admin logout-all error:', error);
    
    // Return success HTML even on error
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Admin Logout Complete</title>
</head>
<body>
  <script>
    // Clear any client-side auth data
    try {
      ['vikareta_access_token', 'vikareta_refresh_token', 'vikareta_user', 
       'dashboard_token', 'dashboard_refresh_token', 'admin_token', 'admin_refresh_token',
       'auth_token', 'refresh_token'].forEach(key => {
        localStorage.removeItem(key);
      });
    } catch {}
    
    // Signal completion to parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'LOGOUT_COMPLETE', domain: location.hostname }, '*');
    }
    
    document.write('<div style="font-family: system-ui; padding: 20px; text-align: center;">Admin logout complete</div>');
  </script>
</body>
</html>`;

    const response = new Response(html, { 
      status: 200, 
      headers: { 
        'Content-Type': 'text/html',
      } 
    });
    
    // Clear cookies even on error
    const cookieOptions = process.env.NODE_ENV === 'production' 
      ? '; Domain=.vikareta.com; Secure; SameSite=None' 
      : '';
    
    response.headers.set('Set-Cookie', [
      `access_token=; Path=/; HttpOnly; Max-Age=0${cookieOptions}`,
      `refresh_token=; Path=/; HttpOnly; Max-Age=0${cookieOptions}`,
      `XSRF-TOKEN=; Path=/; Max-Age=0${cookieOptions}`,
      `session_id=; Path=/; HttpOnly; Max-Age=0${cookieOptions}`,
    ].join(', '));

    return response;
  }
}

export async function POST(req: Request) {
  return GET(req); // Both GET and POST work the same way
}