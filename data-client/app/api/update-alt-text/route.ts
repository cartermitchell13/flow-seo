import { NextRequest, NextResponse } from 'next/server';
import { updateAssetAltText } from '../../services/webflow/assets';
import { getSession } from '../../lib/auth/session';

/**
 * API endpoint to update asset alt text in Webflow
 * 
 * Handles the PATCH request to update an asset's alt text,
 * authenticating with Webflow and managing the update process.
 */
export async function PATCH(req: NextRequest) {
  console.log('Received update alt text request');
  
  try {
    // Get the authenticated session
    const session = await getSession(req);
    console.log('Session check:', { hasSession: !!session });
    
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request data
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

    console.log('Updating alt text with:', {
      siteId,
      assetId,
      altText,
      hasAccessToken: !!session.accessToken
    });

    // Update the alt text in Webflow
    const result = await updateAssetAltText(
      siteId,
      assetId,
      altText,
      session.accessToken
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
