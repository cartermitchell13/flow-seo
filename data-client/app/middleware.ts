import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS Middleware
 * --------------
 * Handles CORS headers for API requests from our frontend
 * Allows requests from our designer extension running on localhost:1337
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:1337');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// Configure middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
};
