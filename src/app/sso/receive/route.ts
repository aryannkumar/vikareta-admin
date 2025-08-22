import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
  if (!token) return NextResponse.redirect('/auth/login');

    const SSO_SECRET = process.env.SSO_SECRET || process.env.JWT_SECRET || 'sso-secret';

    let payload: any;
    try {
      payload = jwt.verify(token, SSO_SECRET) as any;
    } catch {
  return NextResponse.redirect('/auth/login');
    }

      // Optionally validate aud
      const expectedHost = process.env.NEXT_PUBLIC_ADMIN_HOST || 'admin.vikareta.com';
      if (payload.aud && !payload.aud.includes(expectedHost)) {
        return NextResponse.redirect('/auth/login');
      }

      // Validate SSO and get access/refresh tokens to set cookies here
      const backend = process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://api.vikareta.com');
      let accessToken = '';
      let refreshToken = '';
      try {
        const validateRes = await fetch(`${backend}/api/auth/validate-sso`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await validateRes.json();
        if (!validateRes.ok || !data?.success) {
          return NextResponse.redirect('/auth/login');
        }
        accessToken = data.accessToken || '';
        refreshToken = data.refreshToken || '';
      } catch (err) {
        console.error('SSO validation call failed', err);
        return NextResponse.redirect('/auth/login');
      }

      const html = `<!doctype html>
  <html><body>
  <script>
    window.parent.postMessage({ sso: 'ok', host: location.hostname }, '*');
    document.write('SSO complete');
  </script>
  </body></html>`;

      // Prepare cookies for admin domain
      const domainPart = process.env.NODE_ENV === 'production' ? '; Domain=.vikareta.com' : '';
      const securePart = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      const cookies: string[] = [];
      if (accessToken) {
        cookies.push(`vikareta_access_token=${accessToken}; Path=/; HttpOnly; SameSite=None; Max-Age=${60 * 60}${domainPart}${securePart}`);
        cookies.push(`access_token=${accessToken}; Path=/; HttpOnly; SameSite=None; Max-Age=${60 * 60}${domainPart}${securePart}`);
      }
      if (refreshToken) {
        cookies.push(`vikareta_refresh_token=${refreshToken}; Path=/; HttpOnly; SameSite=None; Max-Age=${7 * 24 * 60 * 60}${domainPart}${securePart}`);
        cookies.push(`refresh_token=${refreshToken}; Path=/; HttpOnly; SameSite=None; Max-Age=${7 * 24 * 60 * 60}${domainPart}${securePart}`);
      }

      const hdrs = new Headers();
      hdrs.set('Content-Type', 'text/html');
      for (const c of cookies) hdrs.append('Set-Cookie', c);

      return new Response(html, { status: 200, headers: hdrs });
  } catch {
  return NextResponse.redirect('/auth/login');
  }
}
