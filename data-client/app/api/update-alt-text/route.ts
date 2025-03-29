import { NextRequest, NextResponse } from 'next/server';
import { updateAssetAltText } from '../../services/webflow/assets';
import auth from '../../lib/utils/auth';

/**
 * API endpoint to update asset alt text in Webflow
 * 
 * Handles the PATCH request to update an asset's alt text,
 * authenticating with Webflow and managing the update process.
 */
export async function PATCH(req: NextRequest) {
  console.log('Received update alt text request');
  
  try {
    // Verify access token and get user
    const userInfo = await auth.verifyAccessToken(req);
    if (!userInfo) {
      console.log('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from the user info
    const userId = userInfo.user.id;

    // Get request body
    const body = await req.json();
    console.log('Request body:', body);
    const { siteId, assetId, altText } = body;

    // Validate required fields
    if (!siteId || !assetId || altText === undefined) {
      console.log('Missing required fields:', { siteId, assetId, altText });
      return NextResponse.json(
        { error: 'Missing required fields: siteId, assetId, or altText' },
        { status: 400 }
      );
    }

    // Get access token for the site
    const accessToken = await auth.getStoredAccessToken(userId);
    
    console.log('Updating alt text with:', {
      siteId,
      assetId,
      altText,
      hasAccessToken: !!accessToken
    });

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    // Update the alt text in Webflow
    const result = await updateAssetAltText(
      siteId,
      assetId,
      altText,
      accessToken
    );

    console.log('Update successful:', result);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in update-alt-text route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update alt text' },
      { status: 500 }
    );
  }
}
