import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login'];
  
  // Guest-allowed routes (limited access for guest users)
  const guestRoutes = ['/dashboard/guest', '/profile/guest'];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // Check if the current route allows guest access
  const isGuestRoute = guestRoutes.some(route => pathname.startsWith(route));
  
  // Use unified Vikareta SSO access token cookie or Authorization header
  const token = request.cookies.get('accessToken')?.value || 
                (request.headers.get('authorization')?.replace('Bearer ', '') || null);
  
  // If accessing a protected route without a token, redirect to login
  if (!isPublicRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing login with a valid token, redirect to dashboard
  if (pathname === '/login' && token) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Redirect root to dashboard if authenticated, otherwise to login
  if (pathname === '/') {
    const redirectUrl = new URL(token ? '/dashboard' : '/login', request.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};