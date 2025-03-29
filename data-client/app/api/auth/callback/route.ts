import { WebflowClient } from "webflow-api";
import { NextRequest, NextResponse } from "next/server";
import db from "../../../lib/utils/database";
import auth from "../../../lib/utils/auth";

/**
 * Callback API Route Handler
 * -------------------------
 * This route processes the OAuth callback from Webflow after a user authorizes the application.
 * Following Webflow's OAuth documentation: https://developers.webflow.com/v2.0.0/data/reference/oauth-app
 *
 * Flow:
 * 1. Receives authorization code from Webflow
 * 2. Exchanges code for access token
 * 3. Retrieves user's Webflow sites
 * 4. Stores site authorization details
 * 5. Handles response based on access method (popup vs direct)
 */
export async function GET(request: NextRequest) {
  // Get the authorization code from the request
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  console.log("[Auth Callback] Received callback with params:", {
    code: code ? "PRESENT" : "MISSING",
    state,
    error,
    error_description
  });

  // If there's an error, handle it
  if (error) {
    console.error("[Auth Callback] OAuth Error:", error, error_description);
    return NextResponse.redirect(`/error?message=${encodeURIComponent(error_description || "Authorization failed")}`);
  }

  // If no code, return a 400 error
  if (!code) {
    console.error("[Auth Callback] No authorization code provided");
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    console.log("[Auth Callback] Exchanging code for token...");
    // Exchange the code for an access token using our auth utility
    const tokenResponse = await auth.exchangeCodeForToken(code);
    console.log("[Auth Callback] Successfully obtained access token");

    // Extract the access token from the response
    // @ts-expect-error The token response type is not properly defined
    const accessToken = tokenResponse.access_token;
    
    if (!accessToken) {
      console.error("[Auth Callback] No access token in response");
      return NextResponse.json({ error: "Failed to obtain access token" }, { status: 500 });
    }

    // Instantiate the Webflow Client with the access token
    const webflow = new WebflowClient({ 
      // @ts-expect-error The WebflowClient type definitions are outdated
      token: accessToken 
    });

    // Get user info
    console.log("[Auth Callback] Fetching user info...");
    // @ts-expect-error The WebflowClient type definitions are outdated
    const user = await webflow.user();
    console.log("[Auth Callback] User info received for:", user.id);

    // Get Site ID to pair with the access token
    console.log("[Auth Callback] Fetching sites...");
    const sites = await webflow.sites.list();
    const authInfo = await webflow.token.introspect();

    // Store site authorizations in parallel
    const siteList = sites?.sites ?? [];
    if (siteList.length > 0) {
      console.log("[Auth Callback] Storing site authorizations for", siteList.length, "sites");
      await Promise.all(
        siteList.map((site) => db.insertSiteAuthorization(site.id, accessToken))
      );
    } else {
      console.log("[Auth Callback] No sites found to authorize");
    }

    // Store user authorization
    console.log("[Auth Callback] Storing user authorization");
    await db.insertUserAuthorization(user.id, accessToken);

    // Check if the authorization request came from our Webflow designer extension
    const isAppPopup = state === "webflow_designer";
    console.log("[Auth Callback] isAppPopup:", isAppPopup);

    // If the request is from a popup window, return HTML to close the window
    if (isAppPopup) {
      console.log("[Auth Callback] Returning popup close response");
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Authorization Complete</title>
          </head>
          <body>
            <script>
              window.opener.postMessage({ type: 'authComplete', token: '${accessToken}' }, '*');
              window.close();
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
      // If authorized to the Workspace - redirect to the Dashboard
      const workspaceIds =
        authInfo?.authorization?.authorizedTo?.workspaceIds ?? [];
      if (workspaceIds.length > 0) {
        console.log("[Auth Callback] Redirecting to Webflow dashboard");
        return NextResponse.redirect(
          `https://webflow.com/dashboard?workspace=${workspaceIds[0]}`
        );
      } else {
        // If authorized to the Site - redirect to the Designer Extension
        const firstSite = siteList[0];
        if (firstSite) {
          console.log("[Auth Callback] Redirecting to Webflow designer");
          return NextResponse.redirect(
            `https://${firstSite.shortName}.design.webflow.com?app=${process.env.WEBFLOW_CLIENT_ID}`
          );
        } else {
          console.log("[Auth Callback] No sites or workspaces found, redirecting to error page");
          return NextResponse.redirect("/error?message=No sites or workspaces found");
        }
      }
    }
  } catch (error) {
    console.error("[Auth Callback] Error in callback:", error);
    return NextResponse.json(
      { error: "Failed to process authorization" },
      { status: 500 }
    );
  }
}
