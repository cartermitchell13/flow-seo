import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import db from "./database";
import { WebflowClient } from "webflow-api";

/**
 * Authentication Utilities
 * -----------------------
 * Handles OAuth flow for Webflow authentication according to Webflow's documentation.
 * https://developers.webflow.com/v2.0.0/data/reference/oauth-app
 */

// Required scopes for the app - using string literals that match Webflow's OauthScope type
export const scopes = ["sites:read", "sites:write", "assets:read", "assets:write"];

interface DecodedToken {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  exp: number;
}

/**
 * Get authorization URL for OAuth flow
 * Uses WebflowClient.authorizeURL as recommended in the documentation
 */
export function getAuthUrl() {
  const clientId = process.env.WEBFLOW_CLIENT_ID!;
  const state = "webflow_designer"; // Use consistent state for designer extension
  
  // Determine the correct redirect URI based on environment
  const redirectUri = process.env.NODE_ENV === 'production'
    ? `https://flow-seo.vercel.app/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback';
  
  console.log("[Auth] Using redirect URI:", redirectUri);
  
  // Use the WebflowClient to generate the authorization URL
  // This ensures we follow Webflow's recommended approach
  return WebflowClient.authorizeURL({
    clientId,
    state,
    // @ts-expect-error The WebflowClient type definitions are outdated
    scope: scopes.join(" "),
    redirectUri
  });
}

/**
 * Exchange OAuth code for access token
 * Uses WebflowClient.getAccessToken as recommended in the documentation
 */
export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.WEBFLOW_CLIENT_ID!;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET!;
  
  // Use the same redirect URI as in getAuthUrl
  const redirectUri = process.env.NODE_ENV === 'production'
    ? `https://flow-seo.vercel.app/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback';
  
  console.log("[Auth] Exchanging code for token with redirect URI:", redirectUri);
  
  try {
    // Use the WebflowClient to exchange the code for a token
    // This ensures we follow Webflow's recommended approach
    const token = await WebflowClient.getAccessToken({
      clientId,
      clientSecret,
      code,
      redirectUri
    });
    
    console.log("[Auth] Successfully obtained access token");
    return token;
  } catch (error) {
    console.error("[Auth] Error exchanging code for token:", error);
    throw error;
  }
}

/**
 * Store access token in database
 */
export async function storeAccessToken(userId: string, token: string) {
  try {
    await db.insertUserAuthorization(userId, token);
    console.log("[Auth] Successfully stored access token for user:", userId);
  } catch (error) {
    console.error("[Auth] Error storing access token:", error);
    throw error;
  }
}

/**
 * Get access token from database
 */
export async function getStoredAccessToken(userId: string) {
  try {
    const token = await db.getAccessTokenFromUserId(userId);
    return token;
  } catch (error) {
    console.error("[Auth] Error retrieving access token:", error);
    throw error;
  }
}

/**
 * Verify session token from request
 * 
 * @param request - The incoming request with Authorization header
 * @returns The decoded user information if token is valid, null otherwise
 */
export async function verifyAccessToken(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("[Auth] No valid Authorization header found");
      return null;
    }

    const token = authHeader.split(" ")[1];
    
    // Verify the token with Webflow API
    try {
      // Create a client with the token
      const webflow = new WebflowClient({ 
        // @ts-expect-error The WebflowClient type definitions are outdated
        token 
      });
      
      // Get user info to verify the token is valid
      // @ts-expect-error The WebflowClient type definitions are outdated
      const user = await webflow.user();
      
      if (!user || !user.id) {
        console.log("[Auth] Token verification failed - no user returned");
        return null;
      }
      
      return {
        user: {
          id: user.id,
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || ""
        },
        exp: Math.floor(Date.now() / 1000) + 3600 // Set expiration to 1 hour from now
      };
    } catch (error) {
      console.error("[Auth] Error verifying token with Webflow API:", error);
      return null;
    }
  } catch (error) {
    console.error("[Auth] Error in token verification:", error);
    return null;
  }
}

const auth = {
  getAuthUrl,
  exchangeCodeForToken,
  storeAccessToken,
  getStoredAccessToken,
  verifyAccessToken,
  scopes
};

export default auth;
