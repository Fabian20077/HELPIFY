import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware — Server-side route protection
 * Runs on the Edge runtime before any page is rendered.
 * Protects /dashboard/* routes from unauthenticated access.
 * Redirects authenticated users away from /login and /register.
 */

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if user has an access token (from httpOnly cookie or regular cookie)
  const hasToken =
    request.cookies.has('helpify-token') ||
    request.cookies.has('helpify-refresh-token');

  // Protect dashboard routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!hasToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth pages
  if (AUTH_ROUTES.some(route => pathname === route)) {
    if (hasToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Only run middleware on specific routes
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/.*)
     * - static files (_next/static/, _next/image/, favicon.ico, public files)
     * - images (.webp, .png, .jpg, .svg, .ico)
     */
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:webp|png|jpg|svg|ico)$).*)',
  ],
};
