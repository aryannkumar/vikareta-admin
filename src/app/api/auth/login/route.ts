export async function POST(req: Request) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://api.vikareta.com');

  // Read request body safely as JSON
  let payload: any = {};
  try {
    const text = await req.text();
    payload = text ? JSON.parse(text) : {};
  } catch {
    // If client sent invalid JSON, forward as-is for backend validation
    payload = {};
  }

  // Build initial cookies and try to acquire CSRF token first
  const cookieHeader = req.headers.get('cookie') || '';
  let csrfToken: string | undefined = req.headers.get('x-xsrf-token') || req.headers.get('x-csrf-token') || undefined;

  if (!csrfToken) {
    try {
      const csrfResp = await fetch(`${apiBase}/csrf-token`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        credentials: 'include' as RequestCredentials,
      });
      const setCookie = csrfResp.headers.get('set-cookie');
      if (setCookie) {
        const match = setCookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) csrfToken = decodeURIComponent(match[1]);
      }
    } catch {}
  }

  // Remove any existing XSRF-TOKEN before appending fresh one
  let sanitizedCookie = cookieHeader || '';
  if (sanitizedCookie) {
    sanitizedCookie = sanitizedCookie
      .split(';')
      .map(p => p.trim())
      .filter(p => !/^XSRF-TOKEN=/.test(p))
      .join('; ');
  }
  const backendCookie = csrfToken ? `${sanitizedCookie}${sanitizedCookie ? '; ' : ''}XSRF-TOKEN=${csrfToken}` : sanitizedCookie;

  const resp = await fetch(`${apiBase}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(backendCookie ? { cookie: backendCookie } : {}),
      ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
    },
    body: JSON.stringify(payload),
  });

  const text = await resp.text();
  const headers = new Headers();
  const ct = resp.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const rawSetCookie = resp.headers.get('set-cookie');
  if (rawSetCookie) {
    // Split multiple cookies safely
    rawSetCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/g).forEach(c => headers.append('set-cookie', c.trim()));
  }

  return new Response(text, { status: resp.status, headers });
}
