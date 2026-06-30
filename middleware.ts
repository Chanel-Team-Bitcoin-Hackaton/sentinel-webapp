import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the session cookie
  const sessionCookie = request.cookies.get('sentinel_session');

  // If the user is trying to access a protected route
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!sessionCookie) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If the user is trying to access login page while authenticated
  if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname === '/') {
    if (sessionCookie) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
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
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
