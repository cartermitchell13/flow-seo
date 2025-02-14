import { NextRequest, NextResponse } from "next/server";
import jwt from "../../../lib/utils/jwt";
import db from "../../../lib/utils/database";

/*
    Token Exchange API Route
    ----------------------
    This route handles user authentication by exchanging a Webflow ID token for a custom session token.
    
    Flow:
    1. Designer Extension (client) sends a POST request with:
       - Site ID
       - Webflow ID token
    
    2. Server performs these steps:
       a) Retrieves an Access Token using the Site ID
          - This Access Token proves that the site the request is coming from is authorized to access Webflow's API
       
       b) Verifies the User's ID Token with Webflow
          - Sends the ID token to Webflow's API, making an authenticated request with the retrieved Access Token
          - Receives user information if the token is valid
       
       c) Creates database records for:
          - SiteAuthorizations: Maps site ID to access token
          - UserAuthorizations: Maps user ID to access token
       
       d) Issues a session token
          - Creates a JWT containing user information
          - Includes an expiration time for security
    
    3. Returns to client:
       - Session token
       - Expiration timestamp
    
    Error Handling:
    - Returns 401 if Site ID is invalid or unauthorized
    - Returns 401 if user verification fails
*/
export async function POST(request: NextRequest) {
  console.log("Token exchange started");

  try {
    // Get request body
    const body = await request.json();
    console.log("Request body:", { 
      ...body, 
      idToken: body.idToken ? "[REDACTED]" : undefined,
      siteId: body.siteId
    });

    const { idToken, siteId } = body;

    if (!idToken || !siteId) {
      console.log("Missing required fields:", { hasIdToken: !!idToken, hasSiteId: !!siteId });
      return NextResponse.json({ 
        error: "Unauthorized - Missing required fields",
        details: "Both idToken and siteId are required"
      }, { status: 401 });
    }

    // Get the Access Token for the Site ID
    console.log("Getting access token...");
    const accessToken = await jwt.getAccessToken(siteId);
    console.log("Access token retrieved:", !!accessToken);

    // If the Access Token is not found, return a 401 Unauthorized response
    if (!accessToken) {
      console.log("No access token found");
      return NextResponse.json({ error: "Unauthorized - No access token" }, { status: 401 });
    }

    console.log("Verifying token with Webflow...");
    // Verify the ID Token with Webflow's API
    const response = await fetch("https://api.webflow.com/beta/token/resolve", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        idToken,
      }),
    });

    if (!response.ok) {
      console.log("Webflow token verification failed:", response.status);
      const errorData = await response.json();
      console.log("Webflow error:", errorData);
      return NextResponse.json(
        { error: "Failed to verify token with Webflow" },
        { status: 401 }
      );
    }

    // Get the user information from the response
    const user = await response.json();
    console.log("User verified:", { ...user, id: user.id });

    // Generate a Session Token
    console.log("Generating session token...");
    const tokenPayload = await jwt.createSessionToken(user);
    const sessionToken = tokenPayload.sessionToken;
    const expAt = tokenPayload.exp;
    console.log("Session token generated, expires:", new Date(expAt * 1000).toISOString());

    // Store both site and user authorizations
    console.log("Storing authorizations...");
    await Promise.all([
      db.insertSiteAuthorization(siteId, accessToken),
      db.insertUserAuthorization(user.id, accessToken)
    ]);
    console.log("Authorizations stored");

    // Return the Session Token and Expiration Time
    return NextResponse.json({ sessionToken, exp: expAt });
  } catch (e) {
    console.error("Authentication error:", e);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 401 }
    );
  }
}
