import { NextRequest, NextResponse } from "next/server";
import { generateAltText } from "../../services/ai";
import auth from "../../lib/utils/auth";
import { apiKeysController } from "../../lib/controllers/api-keys";

/**
 * API Route for generating alt text using AI providers
 * -------------------------------------------------
 * Handles the generation of alt text for images using configured AI providers
 * 
 * Security:
 * - Requires Designer Extension authentication
 * - Retrieves encrypted API keys from storage
 * - Validates image URLs and provider configuration
 */

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:1337',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * Generate Alt Text
 * POST /api/generate-alt-text
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
    const { imageUrl, provider } = body;

    // Validate request
    if (!imageUrl || !provider) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Get API key for the provider
    const apiKey = await apiKeysController.getApiKey(
      user.id,
      user.workspaces[0]?.id || "default",
      provider
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: `No API key found for provider: ${provider}` },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Generate alt text
    const result = await generateAltText({
      imageUrl,
      provider,
      apiKey
    });

    return NextResponse.json(result, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Error generating alt text:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate alt text" },
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
