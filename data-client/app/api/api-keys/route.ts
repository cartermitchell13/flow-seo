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
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? (process.env.DESIGNER_EXTENSION_URI || '*')
    : 'http://localhost:1337',
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
    const userInfo = await auth.verifyAccessToken(request);
    if (!userInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: corsHeaders
      });
    }

    // Get request body
    const body = await request.json();
    const { provider, apiKey, siteId } = body;

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

    // Extract user ID from the user info
    const userId = userInfo.user.id;
    
    // Use provided siteId or default
    const targetSiteId = siteId || "default";

    console.log(`[API Keys] Saving API key for user ${userId}, site ${targetSiteId}, provider ${provider}`);

    // Save API key with user ID
    await apiKeysController.saveApiKey(
      userId,
      targetSiteId,
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
    const userInfo = await auth.verifyAccessToken(request);
    if (!userInfo) {
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
        userInfo.user.id,
        "default"
      );
      return NextResponse.json({ provider: selectedProvider }, { headers: corsHeaders });
    }

    // Get API key
    const apiKey = await apiKeysController.getApiKey(
      userInfo.user.id,
      "default",
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
    const userInfo = await auth.verifyAccessToken(request);
    if (!userInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { 
        status: 401,
        headers: corsHeaders
      });
    }

    // Get request body
    const body = await request.json();
    const { provider, siteId } = body;

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

    // Extract user ID from the user info
    const userId = userInfo.user.id;
    
    // Use provided siteId or default
    const targetSiteId = siteId || "default";

    console.log(`[API Keys] Deleting API key for user ${userId}, site ${targetSiteId}, provider ${provider}`);

    // Delete API key
    await apiKeysController.deleteApiKey(
      userId,
      targetSiteId,
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

/**
 * Handle OPTIONS request for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}
