// Force dynamic rendering for this route since it uses request headers
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { apiKeysController } from '../../../lib/controllers/api-keys';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:1337',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webflow-user-id, x-webflow-site-id',
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

    // 2. Get user ID and site ID from request headers
    const userId = request.headers.get('x-webflow-user-id');
    const siteId = request.headers.get('x-webflow-site-id');
    
    if (!userId || !siteId) {
      return new NextResponse(
        JSON.stringify({ error: 'User ID and Site ID are required' }), 
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
    await apiKeysController.saveApiKey(userId, siteId, provider, apiKey);

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
      JSON.stringify({ error: 'Failed to save API key' }), 
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
