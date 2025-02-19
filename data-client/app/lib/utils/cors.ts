/**
 * CORS Headers
 * -----------
 * Common CORS headers for API responses
 * Handles both development and production environments
 */

// Get the allowed origin based on the environment
const getAllowedOrigin = () => {
  // In development, allow localhost:1337
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:1337';
  }
  // In production, allow your Webflow designer extension domain
  return 'https://webflow.com';
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-webflow-site-id, x-webflow-user-id',
  'Access-Control-Allow-Credentials': 'true',
};
