import { NextResponse } from 'next/server';
import { handleDesignerMessage } from '../../../lib/message-handler';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:1337',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webflow-user-id',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Handle POST requests from the designer extension
 */
export async function POST(request: Request) {
  try {
    console.log('Received designer message request');
    
    const body = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const userId = request.headers.get('x-webflow-user-id') || 'test-user';
    console.log('User ID:', userId);

    const response = await handleDesignerMessage(body, userId);
    console.log('Handler response:', JSON.stringify(response, null, 2));

    if (response.error) {
      console.error('Error from message handler:', response.error);
      return new NextResponse(
        JSON.stringify({ error: response.error }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error('Error handling designer message:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
