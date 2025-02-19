// Force dynamic rendering for this route since it handles authentication
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/utils/neon-database";

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
  // Get the authorization code from the request
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // If no code, return a 400 error
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    console.log("[Auth Callback] Starting OAuth token exchange");
    console.log("[Auth Callback] Code received:", code);
    
    // Initialize database tables first
    console.log("[Auth Callback] Ensuring database tables exist");
    await db.initializeDatabase();
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
      fetch('https://api.webflow.com/sites', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept-version': '2.0.0'
        }
      }),
      fetch('https://api.webflow.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'accept-version': '2.0.0'
        }
      })
    ]);

    const [sites, user] = await Promise.all([
      sitesResponse.json(),
      userResponse.json()
    ]);

    console.log("[Auth Callback] Data fetched successfully");

    // Store site authorizations
    if (Array.isArray(sites)) {
      console.log("[Auth Callback] Storing site authorizations");
      await Promise.all(
        sites.map((site) => db.insertSiteAuthorization(site.id, accessToken))
      );
      console.log("[Auth Callback] Site authorizations stored");
    }

    // Handle response based on the authorization source
    const isDesignerExtension = state === "webflow_designer";
    console.log("[Auth Callback] Is designer extension?", isDesignerExtension);

    if (isDesignerExtension) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Complete</title>
          </head>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage('authComplete', 'https://webflow.com');
                window.close();
              }
            </script>
          </body>
        </html>`,
        {
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    } else {
      // For direct navigation, redirect to appropriate URL
      const workspaces = user?.workspaces || [];
      if (workspaces.length > 0) {
        return NextResponse.redirect(
          `https://webflow.com/dashboard?workspace=${workspaces[0]}`
        );
      } else if (sites.length > 0) {
        return NextResponse.redirect(
          `https://${sites[0].shortName}.design.webflow.com?app=${process.env.WEBFLOW_CLIENT_ID}`
        );
      }
    }

    // Fallback to dashboard if no specific redirect
    return NextResponse.redirect('https://webflow.com/dashboard');

  } catch (error) {
    console.error("[Auth Callback] Error:", error);
    console.error("[Auth Callback] Full error:", JSON.stringify({
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause
    }, null, 2));

    return NextResponse.json({ 
      error: "Failed to process authorization", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { 
      status: 500 
    });
  }
}
