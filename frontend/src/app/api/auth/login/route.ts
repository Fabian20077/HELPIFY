import { NextResponse } from 'next/server';
import { api } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Proxy the credentials to the backend
    const data = await api.post<AuthResponse>('/auth/login', body);

    // Create the response, returning the user data to the client (but NOT the token)
    const response = NextResponse.json({
      status: 'success',
      data: { user: data.user },
    });

    // Set the JWT as an httpOnly, secure cookie
    response.cookies.set(AUTH_COOKIE_NAME, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches backend expiration)
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message || 'Error en inicio de sesión' },
      { status: error.statusCode || 401 }
    );
  }
}
