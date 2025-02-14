import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleDesignerMessage } from './lib/message-handler';

/**
 * Middleware to handle CORS and authentication
 */
export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:1337',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webflow-user-id',
        'Access-Control-Allow-Credentials': 'true',
      },
    });
  }

  // Only handle POST requests to /api/designer-message
  if (request.method === 'POST' && request.nextUrl.pathname === '/api/designer-message') {
    try {
      const body = await request.json();
      const userId = request.headers.get('x-webflow-user-id') || 'test-user';

      const response = await handleDesignerMessage(body, userId);
      
      const corsResponse = new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
      });
      corsResponse.headers.set('Access-Control-Allow-Origin', 'http://localhost:1337');
      corsResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return corsResponse;
    } catch (error) {
      console.error('Error in middleware:', error);
      const errorResponse = new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
      });
      errorResponse.headers.set('Access-Control-Allow-Origin', 'http://localhost:1337');
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      
      return errorResponse;
    }
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:1337');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

/**
 * Configure which paths should trigger this middleware
 */
export const config = {
  matcher: '/api/:path*',
};
