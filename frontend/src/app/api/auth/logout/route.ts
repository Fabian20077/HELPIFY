import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ status: 'success' });
  
  // Clear the auth cookie to log out
  response.cookies.delete(AUTH_COOKIE_NAME);
  
  return response;
}
