// Force dynamic rendering for this route since it handles authentication
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";

/**
 * Authorize API Route Handler
 * --------------------------
 * This route generates and redirects to Webflow's authorization URL.
 * Following Webflow's OAuth 2.0 specification for authorization code grant flow.
 */

const scopes = [
  "assets:read",
  "assets:write",
  "sites:read",
  "authorized_user:read"
].join(' ');

export async function GET(request: Request) {
  // Debug environment variables
  console.log('[Auth] Environment check:', {
    hasClientId: !!process.env.WEBFLOW_CLIENT_ID,
    hasClientSecret: !!process.env.WEBFLOW_CLIENT_SECRET,
    hasRedirectUri: !!process.env.PRODUCTION_OAUTH_CALLBACK_URL,
    hasState: !!process.env.OAUTH_STATE,
    nodeEnv: process.env.NODE_ENV,
  });

  // Always use the environment state for CSRF protection
  const state = process.env.OAUTH_STATE;
  if (!state) {
    console.error('[Auth] Missing OAUTH_STATE');
    throw new Error('OAUTH_STATE environment variable is not set');
  }

  const redirectUri = process.env.PRODUCTION_OAUTH_CALLBACK_URL;
  if (!redirectUri) {
    console.error('[Auth] Missing PRODUCTION_OAUTH_CALLBACK_URL');
    throw new Error('PRODUCTION_OAUTH_CALLBACK_URL environment variable is not set');
  }

  // Log the raw redirect URI before any encoding
  console.log('[Auth] Raw redirect URI:', redirectUri);
  
  // Construct the authorization URL according to Webflow's spec
  const authorizeUrl = new URL('https://webflow.com/oauth/authorize');
  authorizeUrl.searchParams.append('client_id', process.env.WEBFLOW_CLIENT_ID!);
  authorizeUrl.searchParams.append('response_type', 'code');
  authorizeUrl.searchParams.append('scope', scopes);
  authorizeUrl.searchParams.append('state', state);
  
  // Try without manual encoding first
  authorizeUrl.searchParams.append('redirect_uri', redirectUri);

  // Log the final URL with sensitive data redacted
  const logUrl = authorizeUrl.toString().replace(process.env.WEBFLOW_CLIENT_ID!, '[REDACTED]');
  console.log('[Auth] Final authorization URL:', logUrl);

  console.log('[Auth] Redirecting to:', authorizeUrl.toString());
  return NextResponse.redirect(authorizeUrl.toString());
}
