// Force dynamic rendering for this route since it handles authentication
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import database from "../../../db";

/**
 * Callback API Route Handler
 * -------------------------
 * This route processes the OAuth callback from Webflow after a user authorizes the application.
 * Implements Webflow's OAuth 2.0 specification for authorization code grant flow.
 *
 * Flow:
 * 1. Receives authorization code from Webflow
 * 2. Exchanges code for access token using OAuth token endpoint
 * 3. Retrieves user's Webflow sites using the access token
 * 4. Stores site authorization details
 * 5. Handles response based on access method (popup vs direct)
 */
export async function GET(request: NextRequest) {
  // Get the authorization code and state from the request
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // If no code, return a 400 error
  if (!code) {
    return NextResponse.json({ error: "No authorization code provided" }, { status: 400 });
  }

  // Verify state parameter to prevent CSRF attacks
  const expectedState = process.env.OAUTH_STATE;
  if (!state || state !== expectedState) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  try {
    console.log("[Auth Callback] Starting OAuth token exchange");
    
    // Initialize database tables first
    console.log("[Auth Callback] Ensuring database tables exist");
    await database.initializeDatabase();
    console.log("[Auth Callback] Database initialized");
    
    // Exchange the authorization code for an access token
    console.log("[Auth Callback] Exchanging code for token");
    const tokenResponse = await fetch('https://api.webflow.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.WEBFLOW_CLIENT_ID!,
        client_secret: process.env.WEBFLOW_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.PRODUCTION_OAUTH_CALLBACK_URL
      }),
    });

    console.log("[Auth Callback] Token response status:", tokenResponse.status);
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error("[Auth Callback] Token exchange failed:", JSON.stringify(tokenData));
      return NextResponse.json({ 
        error: "Token exchange failed", 
        details: tokenData 
      }, { 
        status: tokenResponse.status 
      });
    }

    console.log("[Auth Callback] Successfully obtained access token");
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error("[Auth Callback] No access token in response:", tokenData);
      return NextResponse.json({ 
        error: "No access token in response",
        details: tokenData
      }, { 
        status: 400 
      });
    }

    // Fetch sites and user data using the access token
    console.log("[Auth Callback] Fetching Webflow data");
    const [sitesResponse, userResponse] = await Promise.all([
      fetch('https://api.webflow.com/v2/sites', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept-version': '2.0.0'
        }
      }),
      fetch('https://api.webflow.com/v2/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept-version': '2.0.0'
        }
      })
    ]);

    if (!sitesResponse.ok || !userResponse.ok) {
      console.error("[Auth Callback] Failed to fetch user data:", 
        { sites: sitesResponse.status, user: userResponse.status });
      return NextResponse.json({ 
        error: "Failed to fetch user data",
        details: {
          sites: await sitesResponse.text(),
          user: await userResponse.text()
        }
      }, { 
        status: 500 
      });
    }

    const [sites, user] = await Promise.all([
      sitesResponse.json(),
      userResponse.json()
    ]);

    // Store the authorizations
    if (Array.isArray(sites)) {
      console.log("[Auth Callback] Storing site authorizations");
      await Promise.all(
        sites.map((site) => database.insertSiteAuthorization(site.id, accessToken))
      );
      console.log("[Auth Callback] Site authorizations stored");
    }

    if (user?.id) {
      console.log("[Auth Callback] Storing user authorization");
      await database.insertUserAuthorization(user.id, accessToken);
      console.log("[Auth Callback] User authorization stored");
    }

    // Redirect to success page
    return NextResponse.redirect(new URL('/auth-success', request.url));

  } catch (error) {
    console.error("[Auth Callback] Full error:", error);
    return NextResponse.json({ 
      error: "Failed to process authorization", 
      details: error 
    }, { 
      status: 500 
    });
  }
}
