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
 * POST /api/custom-code/save-key
 * Securely saves an AI provider API key
 */
export async function POST(request: Request) {
  try {
    console.log('Received save key request');

    // 1. Get request body
    const body = await request.json();
    console.log('Request body:', { ...body, apiKey: '[REDACTED]' });

    const { provider, apiKey } = body;
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
    const userId = request.headers.get('x-webflow-user-id') || 'test-user';
    console.log('User ID:', userId);

    // 3. Save API key using controller
    const result = await apiKeysController.saveApiKey(userId, "default", provider, apiKey);
    console.log('Save result:', result);

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
        error: error instanceof Error ? error.message : 'Internal server error'
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
