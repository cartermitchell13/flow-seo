import { NextRequest, NextResponse } from "next/server";
import auth from "../../lib/utils/auth";

/**
 * OAuth 2.0 Authentication Routes
 * ------------------------------
 * Following Webflow's hybrid-app-starter template pattern.
 * Handles OAuth flow for Designer Extension authentication.
 */

// Get allowed origin from environment variable, fallback to localhost in development
const ALLOWED_ORIGIN = process.env.NODE_ENV === 'production' 
  ? (process.env.DESIGNER_EXTENSION_URI || 'https://67a52dfc4cdf429141cdc2b8.webflow-ext.com')
  : 'http://localhost:1337';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * GET /api/auth
 * Initiates OAuth flow or handles callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth Error:", error, error_description);
    return NextResponse.redirect("/error?message=" + error_description);
  }

  // If no code, redirect to Webflow auth page
  if (!code) {
    const installUrl = auth.getAuthUrl();
    return NextResponse.redirect(installUrl);
  }

  try {
    // Exchange code for access token
    const token = await auth.exchangeCodeForToken(code);

    // Get user info
    const user = await fetch("https://api.webflow.com/user", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "accept-version": "1.0.0",
      },
    }).then(res => res.json());

    // Store token in database
    await auth.storeAccessToken(user.id, token.access_token);

    // Set authorization header and redirect with token in URL
    const response = NextResponse.redirect(
      `${ALLOWED_ORIGIN}/?authorized=true&token=${encodeURIComponent(token.access_token)}`
    );
    response.headers.set(
      "Authorization",
      `Bearer ${token.access_token}`
    );

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.redirect("/error?message=Authentication failed");
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}
