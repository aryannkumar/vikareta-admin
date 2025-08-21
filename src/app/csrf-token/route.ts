export async function GET(req: Request) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://api.vikareta.com');

  const resp = await fetch(`${apiBase}/csrf-token`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      ...(req.headers.get('cookie') ? { cookie: req.headers.get('cookie') as string } : {}),
    },
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
