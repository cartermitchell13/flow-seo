import { NextResponse } from 'next/server';
import { apiKeysController } from '../../../lib/controllers/api-keys';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:1337',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
 * POST /api/config/save-key
 * Securely saves an AI provider API key using Webflow's secret storage
 */
export async function POST(request: Request) {
  try {
    // 1. Get request body and validate
    const { provider, apiKey } = await request.json();
    if (!provider || !apiKey) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // 2. Get user ID from request header
    const userId = request.headers.get('x-webflow-user-id');
    if (!userId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID is required' }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        }
      );
    }

    // 3. Save API key using controller
    await apiKeysController.saveApiKey(userId, provider, apiKey);

    return new NextResponse(
      JSON.stringify({ success: true }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        }
      }
    );
  } catch (error) {
    console.error('Error saving API key:', error);
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
        }
      }
    );
  }
}
