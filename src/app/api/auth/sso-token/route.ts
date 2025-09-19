import { NextRequest, NextResponse } from 'next/server';

// Proxy endpoint to obtain SSO token using the caller's cookies (same-origin)
export async function POST(req: NextRequest) {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || (process.env.NODE_ENV === 'development' ? 'http://localhost:5001' : 'https://api.vikareta.com');

    // Read incoming JSON body (expects { target: string })
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // Forward cookies and CSRF header to backend
    const cookieHeader = req.headers.get('cookie') || '';
    const csrfHeader = req.headers.get('x-xsrf-token');

    const resp = await fetch(`${apiBase}/api/v1/auth/sso-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
        ...(csrfHeader ? { 'X-XSRF-TOKEN': csrfHeader } : {}),
      },
      // credentials is ignored in node fetch, cookies are sent via header above
      body: JSON.stringify(body || {}),
    });

    const text = await resp.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!resp.ok) {
      return NextResponse.json(data || { message: 'Failed to get SSO token' }, { status: resp.status });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Internal error' }, { status: 500 });
  }
}