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
  "sites:write",
  "custom_code:read",
  "custom_code:write",
  "authorized_user:read",
  "pages:read",
  "pages:write",
  "cms:read"
].join(' ');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get("state") || '';

  // Construct the authorization URL according to Webflow's spec
  const authorizeUrl = new URL('https://webflow.com/oauth/authorize');
  authorizeUrl.searchParams.append('client_id', process.env.WEBFLOW_CLIENT_ID!);
  authorizeUrl.searchParams.append('response_type', 'code');
  authorizeUrl.searchParams.append('scope', scopes);
  
  // Add state if provided (used for designer extension flow)
  if (state) {
    authorizeUrl.searchParams.append('state', state);
  }

  return NextResponse.redirect(authorizeUrl.toString());
}
