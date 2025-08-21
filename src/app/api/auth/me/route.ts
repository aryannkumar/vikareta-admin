export async function GET(req: Request) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://api.vikareta.com');

  const forwardHeaders: Record<string, string> = {};
  const cookie = req.headers.get('cookie');
  if (cookie) forwardHeaders['cookie'] = cookie;

  const resp = await fetch(`${apiBase}/api/auth/me`, {
    method: 'GET',
    headers: forwardHeaders,
    credentials: 'include' as RequestCredentials,
  });

  const text = await resp.text();
  const headers = new Headers();
  const ct = resp.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const setCookie = resp.headers.get('set-cookie');
  if (setCookie) headers.append('set-cookie', setCookie);

  return new Response(text, { status: resp.status, headers });
}
