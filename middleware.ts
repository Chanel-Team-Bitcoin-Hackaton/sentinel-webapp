import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/setup', '/subscription'];
const AUTH_ONLY = ['/login']; // redirect to /dashboard when already authenticated

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('sentinel_session');

  // Racine — redirige selon l'état de session
  if (pathname === '/') {
    const dest = sessionCookie ? '/dashboard' : '/login';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Protected routes — require session
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Auth-only pages — redirect to dashboard if already logged in
  if (AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    if (sessionCookie) {
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
