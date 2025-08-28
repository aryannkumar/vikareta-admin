import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      console.error('SSO: No code provided');
      return NextResponse.redirect('/login?error=missing_code');
    }

    const backend = process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://api.vikareta.com');
    let user: any = null;
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    try {
      console.log('SSO: Exchanging code with backend...', { backend });
      const tokenRes = await fetch(`${backend}/api/auth/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `https://${process.env.NEXT_PUBLIC_ADMIN_HOST || 'admin.vikareta.com'}/sso/receive`,
          client_id: 'admin'
        })
      });

      const text = await tokenRes.text();
      let data: any = null;
      try { data = text ? JSON.parse(text) : null; } catch (_err) { console.warn('SSO: Token exchange returned non-JSON response'); }

      console.log('SSO: Backend token exchange response:', { ok: tokenRes.ok, status: tokenRes.status, body: data ?? text?.slice?.(0, 200) });

      if (!tokenRes.ok) {
        console.error('SSO: Token exchange failed (non-OK status):', { status: tokenRes.status, body: data ?? text });
        return NextResponse.redirect('/login?error=exchange_failed');
      }

      if (data) {
        user = data.user ?? null;
        accessToken = data.accessToken ?? data.access_token ?? data.token ?? accessToken;
        refreshToken = data.refreshToken ?? data.refresh_token ?? data.refresh ?? refreshToken;
      }

      const forwardedSetCookies: string[] = [];
      try {
        tokenRes.headers?.forEach?.((value, key) => {
          if (key.toLowerCase() === 'set-cookie') {
            forwardedSetCookies.push(value);
          }
        });
      } catch (_err) { }

      (globalThis as any).__lastForwardedSetCookies = forwardedSetCookies;

    } catch (err) {
      console.error('SSO: Token exchange call failed:', err);
      return NextResponse.redirect('/login?error=backend_error');
    }

    let safeUserJson: string;
    try { safeUserJson = JSON.stringify(user ?? null); } catch (_err) { console.error('SSO: Failed to stringify user for client message', _err); safeUserJson = 'null'; }
    let safeStateJson: string;
    try { safeStateJson = JSON.stringify(state ?? null); } catch { safeStateJson = 'null'; }

    const html = `<!doctype html>
<html><body>
<script>
  try {
    const msg = { type: 'SSO_USER', host: location.hostname, user: ${safeUserJson}, state: ${safeStateJson} };
    try { if (window.opener && !window.opener.closed) window.opener.postMessage(msg, '*'); } catch(e){}
    try { window.parent.postMessage(msg, '*'); } catch(e){}
    document.write('<p>SSO authentication successful. You may close this window.</p>');
  } catch (e) {
    console.error('SSO completion error:', e);
    try { if (window.opener && !window.opener.closed) window.opener.postMessage({ type: 'SSO_ERROR', error: e?.message ?? String(e) }, '*'); } catch(e){}
    try { window.parent.postMessage({ type: 'SSO_ERROR', error: e?.message ?? String(e) }, '*'); } catch(e){}
  }
</script>
</body></html>`;

    const isProduction = process.env.NODE_ENV === 'production';
    const domainPart = isProduction ? '; Domain=.vikareta.com' : '';
    const securePart = isProduction ? '; Secure' : '';
    const sameSitePart = isProduction ? '; SameSite=None' : '; SameSite=Lax';

    const cookies: string[] = [];

    if (accessToken) {
      cookies.push(`vikareta_access_token=${accessToken}; Path=/; HttpOnly${sameSitePart}; Max-Age=${60 * 60}${domainPart}${securePart}`);
      cookies.push(`access_token=${accessToken}; Path=/; HttpOnly${sameSitePart}; Max-Age=${60 * 60}${domainPart}${securePart}`);
    }

    if (refreshToken) {
      cookies.push(`vikareta_refresh_token=${refreshToken}; Path=/; HttpOnly${sameSitePart}; Max-Age=${7 * 24 * 60 * 60}${domainPart}${securePart}`);
      cookies.push(`refresh_token=${refreshToken}; Path=/; HttpOnly${sameSitePart}; Max-Age=${7 * 24 * 60 * 60}${domainPart}${securePart}`);
    }

    const hdrs = new Headers();
    hdrs.set('Content-Type', 'text/html');
    for (const c of cookies) {
      hdrs.append('Set-Cookie', c);
    }

    const forwarded: string[] = (globalThis as any).__lastForwardedSetCookies || [];
    for (const fc of forwarded) {
      try { hdrs.append('Set-Cookie', fc); } catch { }
    }

    console.log('SSO: Successfully set cookies and returning success page');
    return new Response(html, { status: 200, headers: hdrs });

  } catch (error) {
    console.error('SSO: Unexpected error:', error);
    return NextResponse.redirect('/login?error=unexpected');
  }
}
