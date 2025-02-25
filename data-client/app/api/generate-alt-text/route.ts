import { NextRequest, NextResponse } from "next/server";
import { generateAltText } from "../../services/ai";
import auth from "../../lib/utils/auth";
import { apiKeysController } from "../../lib/controllers/api-keys";
import { getSiteContext } from "../../services/webflow/assets";
import db from "../../lib/utils/database";

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

// Get allowed origin from environment variable, fallback to localhost in development
const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production' 
  ? (process.env.DESIGNER_EXTENSION_URI || 'https://67a52dfc4cdf429141cdc2b8.webflow-ext.com')
  : 'http://localhost:1337';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
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
    const { imageUrl, provider, siteId } = body;

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

    // Fetch site context for SEO if siteId is provided
    let siteContext = undefined;
    if (siteId) {
      try {
        // Get access token for the site
        const accessToken = await db.getAccessTokenFromSiteId(siteId);
        if (accessToken) {
          // Fetch site context
          siteContext = await getSiteContext(siteId, accessToken);
          console.log('Using site context for SEO:', siteContext);
        }
      } catch (error) {
        console.warn('Failed to fetch site context:', error);
        // Continue without site context if there's an error
      }
    }

    // Generate alt text with site context if available
    const result = await generateAltText({
      imageUrl,
      provider,
      apiKey,
      siteContext
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
