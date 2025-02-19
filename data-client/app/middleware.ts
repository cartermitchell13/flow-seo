import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * CORS Middleware
 * --------------
 * Handles CORS headers for API requests
 * Supports both development (localhost:1337) and production (webflow.com) environments
 */
export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' 
          ? 'http://localhost:1337' 
          : 'https://webflow.com',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webflow-site-id, x-webflow-user-id',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers
  response.headers.set(
    'Access-Control-Allow-Origin',
    process.env.NODE_ENV === 'development' ? 'http://localhost:1337' : 'https://webflow.com'
  );
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-webflow-site-id, x-webflow-user-id');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  return response;
}

// Configure middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
};
