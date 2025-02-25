import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import db from "./database";

/**
 * Authentication Utilities
 * -----------------------
 * Following Webflow's hybrid-app-starter template pattern for authentication.
 * Handles token management and verification for the Designer Extension.
 */

// Required scopes for the app
export const scopes = ["sites:read", "sites:write"];

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
 */
export function getAuthUrl() {
  const clientId = process.env.WEBFLOW_CLIENT_ID!;
  const state = "webflow_designer"; // Use consistent state for designer extension
  const scope = scopes.join(" ");
  
  // Determine the correct redirect URI based on environment
  const redirectUri = process.env.NODE_ENV === 'production'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback';
  
  console.log("[Auth] Using redirect URI:", redirectUri);
  
  return `https://webflow.com/oauth/authorize?client_id=${clientId}&response_type=code&scope=${scope}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.WEBFLOW_CLIENT_ID!;
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET!;
  
  // Use the same redirect URI as in getAuthUrl
  const redirectUri = process.env.NODE_ENV === 'production'
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`
    : 'http://localhost:3000/api/auth/callback';
  
  console.log("[Auth] Exchanging code for token with redirect URI:", redirectUri);
  
  const response = await fetch("https://api.webflow.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for token");
  }

  const data = await response.json();
  return data;
}

/**
 * Store access token in database
 */
export async function storeAccessToken(userId: string, token: string) {
  await db.insertUserAuthorization(userId, token);
}

/**
 * Get access token from database
 */
export async function getStoredAccessToken(userId: string) {
  const token = await db.getAccessTokenFromUserId(userId);
  return token;
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
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("No Bearer token in Authorization header");
      return null;
    }

    const token = authHeader.split(" ")[1];
    
    // Verify our custom session token
    const secret = new TextEncoder().encode(process.env.WEBFLOW_CLIENT_SECRET);
    
    try {
      const { payload } = await jwtVerify(token, secret) as { payload: DecodedToken };
      
      // Check if token is expired
      if (payload.exp * 1000 <= Date.now()) {
        console.log("Token expired");
        return null;
      }

      // Return user info
      return {
        id: payload.user.id,
        email: payload.user.email,
        firstName: payload.user.firstName,
        lastName: payload.user.lastName,
        workspaces: [{ id: "default" }] // Default workspace for now
      };
    } catch (error) {
      console.error("Token verification failed:", error);
      return null;
    }
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

const auth = {
  getAuthUrl,
  exchangeCodeForToken,
  storeAccessToken,
  getStoredAccessToken,
  verifyAccessToken,
  scopes,
};

export default auth;
