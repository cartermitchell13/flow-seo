import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { handleDesignerMessage } from './lib/message-handler';

// Get allowed origin from environment variable, fallback to localhost in development
const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production' 
  ? (process.env.DESIGNER_EXTENSION_URI || 'https://67a52dfc4cdf429141cdc2b8.webflow-ext.com')
  : 'http://localhost:1337';

/**
 * Middleware to handle CORS and authentication
 */
export async function middleware(request: NextRequest) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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
      
      // Create a proper response object with the JSON data
      const corsResponse = new NextResponse(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Credentials': 'true',
        },
      });
      
      return corsResponse;
    } catch (error) {
      console.error('Error in middleware:', error);
      const errorResponse = new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Credentials': 'true',
        },
      });
      
      return errorResponse;
    }
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  
  return response;
}

/**
 * Configure which paths should trigger this middleware
 */
export const config = {
  matcher: '/api/:path*',
};
