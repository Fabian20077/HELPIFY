import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeTokenPayload, AUTH_COOKIE_NAME } from '@/lib/auth';
import { UserRole } from '@/lib/types';

const PUBLIC_ROUTES = ['/login', '/register'];
const ADMIN_ROUTES = ['/dashboard/admin'];
const BACKEND_URL = 'http://localhost:3001';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Proxy API calls to backend ────────────────────────────────────────────
  if (pathname.startsWith('/api')) {
    const backendUrl = `${BACKEND_URL}${pathname}${request.nextUrl.search}`;
    
    // Extract body
    const body = request.body ? await request.arrayBuffer() : undefined;
    
    // Extract token from cookie and add as Authorization header
    const cookieHeader = request.headers.get('cookie');
    let authToken: string | undefined;
    
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').map(c => c.trim());
      for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        if (name === AUTH_COOKIE_NAME) {
          authToken = value;
          break;
        }
      }
    }

    // Build headers, forwarding relevant request headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (['content-type', 'authorization', 'accept', 'cookie'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    // Add Authorization header from cookie if present
    if (authToken && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
      const response = await fetch(backendUrl, {
        method: request.method,
        headers,
        body,
        credentials: 'include',
      });

      // Clone response headers
      const responseHeaders = new Headers();
      response.headers.forEach((value, key) => {
        // Forward Set-Cookie headers
        if (key.toLowerCase() === 'set-cookie') {
          responseHeaders.append(key, value);
        }
      });

      const data = await response.text();

      return new NextResponse(data, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return NextResponse.json(
        { status: 'error', message: 'Backend unreachable' },
        { status: 502 }
      );
    }
  }

  // ── Auth check from cookies ───────────────────────────────────────────────
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  // Public routes: redirect to dashboard if already logged in
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Protected routes: redirect to login if not authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes: check role
    if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
      const payload = decodeTokenPayload(token);
      if (!payload || payload.role !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}