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
  // Always use the environment state for CSRF protection
  const state = process.env.OAUTH_STATE;
  if (!state) {
    throw new Error('OAUTH_STATE environment variable is not set');
  }

  // Construct the authorization URL according to Webflow's spec
  const authorizeUrl = new URL('https://webflow.com/oauth/authorize');
  authorizeUrl.searchParams.append('client_id', process.env.WEBFLOW_CLIENT_ID!);
  authorizeUrl.searchParams.append('response_type', 'code');
  authorizeUrl.searchParams.append('scope', scopes);
  authorizeUrl.searchParams.append('state', state);
  authorizeUrl.searchParams.append('redirect_uri', process.env.PRODUCTION_OAUTH_CALLBACK_URL!);

  return NextResponse.redirect(authorizeUrl.toString());
}
