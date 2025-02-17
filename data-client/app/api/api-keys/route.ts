import { NextRequest, NextResponse } from "next/server";
import { apiKeysController } from "../../lib/controllers/api-keys";
import auth from "../../lib/utils/auth";

/**
 * API Routes for managing API keys
 * -------------------------------
 * Following Webflow's hybrid-app-starter template pattern.
 * Handles secure storage and retrieval of API keys.
 * 
 * Security:
 * - All routes require Designer Extension authentication
 * - API keys are encrypted before storage
 * - Responses are sanitized to prevent sensitive data leaks
 */

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:1337',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Save API Key
 * POST /api/api-keys
 */
export async function POST(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: corsHeaders });
  }

  try {
    // Verify access token and get user
    const user = await auth.verifyAccessToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: corsHeaders
      });
    }

    // Get request body
    const body = await request.json();
    const { provider, apiKey } = body;

    // Validate request
    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Save API key with user ID
    await apiKeysController.saveApiKey(
      user.id,
      user.workspaces[0]?.id || "default",
      provider,
      apiKey
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error saving API key:", error);
    return NextResponse.json(
      { error: "Failed to save API key" },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * Get API Key
 * GET /api/api-keys?provider=<provider>
 */
export async function GET(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: corsHeaders });
  }

  try {
    // Verify access token and get user
    const user = await auth.verifyAccessToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: corsHeaders
      });
    }

    // Get provider from query params
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      // If no provider specified, return the selected provider
      const selectedProvider = await apiKeysController.getSelectedProvider(
        user.id,
        user.workspaces[0]?.id || "default"
      );
      return NextResponse.json({ provider: selectedProvider }, { headers: corsHeaders });
    }

    // Get API key
    const apiKey = await apiKeysController.getApiKey(
      user.id,
      user.workspaces[0]?.id || "default",
      provider
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not found" },
        { 
          status: 404,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json({ apiKey }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error retrieving API key:", error);
    return NextResponse.json(
      { error: "Failed to retrieve API key" },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * Delete API Key
 * DELETE /api/api-keys
 */
export async function DELETE(request: NextRequest) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: corsHeaders });
  }

  try {
    // Verify access token and get user
    const user = await auth.verifyAccessToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: corsHeaders
      });
    }

    // Get request body
    const body = await request.json();
    const { provider } = body;

    // Validate request
    if (!provider) {
      return NextResponse.json(
        { error: "Missing provider" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Delete API key
    await apiKeysController.deleteApiKey(
      user.id,
      user.workspaces[0]?.id || "default",
      provider
    );

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}
