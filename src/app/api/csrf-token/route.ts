export async function GET(req: Request) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://api.vikareta.com');
  const cookieHeader = req.headers.get('cookie') || '';

  const resp = await fetch(`${apiBase}/csrf-token`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    credentials: 'include' as RequestCredentials,
  });

  const text = await resp.text();
  const headers = new Headers();
  const ct = resp.headers.get('content-type');
  if (ct) headers.set('content-type', ct);

  const rawSetCookie = resp.headers.get('set-cookie');
  if (rawSetCookie) {
    rawSetCookie.split(/,(?=\s*[A-Za-z0-9_-]+=)/g).forEach(c => headers.append('set-cookie', c.trim()));
  }

  return new Response(text, { status: resp.status, headers });
}
