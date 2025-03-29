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
  ? (process.env.DESIGNER_EXTENSION_URI || '*')
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

  // Log request information for debugging
  console.log("[Auth] Request URL:", request.url);
  console.log("[Auth] Search Params:", Object.fromEntries(searchParams.entries()));
  console.log("[Auth] Headers:", Object.fromEntries(request.headers.entries()));

  // Handle OAuth errors
  if (error) {
    console.error("OAuth Error:", error, error_description);
    return NextResponse.redirect("/error?message=" + error_description);
  }

  // If no code, redirect to Webflow auth page
  if (!code) {
    const installUrl = auth.getAuthUrl();
    console.log("[Auth] Redirecting to Webflow auth URL:", installUrl);
    return NextResponse.redirect(installUrl);
  }

  try {
    console.log("[Auth] Exchanging code for token...");
    // Exchange code for access token
    const token = await auth.exchangeCodeForToken(code);
    console.log("[Auth] Token received successfully");

    // Get user info
    console.log("[Auth] Fetching user info...");
    // @ts-expect-error The token response type is not properly defined
    const accessToken = token.access_token;
    
    const user = await fetch("https://api.webflow.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "accept-version": "1.0.0",
      },
    }).then(res => res.json());
    console.log("[Auth] User info received:", user.id);

    // Store token in database
    console.log("[Auth] Storing access token...");
    await auth.storeAccessToken(user.id, accessToken);
    console.log("[Auth] Token stored successfully");

    // Set authorization header and redirect with token in URL
    console.log("[Auth] Redirecting to:", `${ALLOWED_ORIGIN}/?authorized=true&token=${accessToken.substring(0, 10)}...`);
    const response = NextResponse.redirect(
      `${ALLOWED_ORIGIN}/?authorized=true&token=${encodeURIComponent(accessToken)}`
    );
    response.headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );

    // Add CORS headers
    console.log("[Auth] Adding CORS headers:", corsHeaders);
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
