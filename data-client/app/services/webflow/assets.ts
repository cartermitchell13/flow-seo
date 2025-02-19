/**
 * Webflow Assets Service
 * 
 * Handles interactions with Webflow's Asset Management API
 * Documentation: https://developers.webflow.com/reference/assets-resource
 */

interface WebflowAsset {
  id: string;
  siteId: string;
  name: string;
  altText?: string;
  [key: string]: unknown;
}

/**
 * Updates the alt text for a Webflow asset
 * 
 * @param siteId - The Webflow site ID
 * @param assetId - The asset ID to update
 * @param altText - The new alt text to set
 * @param accessToken - Webflow access token
 * @returns Promise resolving to the updated asset data
 */
export async function updateAssetAltText(
  siteId: string,
  assetId: string,
  altText: string,
  accessToken: string
): Promise<WebflowAsset> {
  console.log('Updating asset alt text:', { siteId, assetId, altText });

  // First, get the current asset data
  const getResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/assets/${assetId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'accept-version': '2.0.0',
      'Accept': 'application/json'
    }
  });

  if (!getResponse.ok) {
    const error = await getResponse.json();
    console.error('Failed to get asset:', error);
    throw new Error(`Failed to get asset: ${error.message || 'Unknown error'}`);
  }

  const assetData = await getResponse.json();
  console.log('Current asset data:', assetData);

  // Update the asset with new alt text
  const updateResponse = await fetch(`https://api.webflow.com/v2/sites/${siteId}/assets/${assetId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'accept-version': '2.0.0',
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      fileName: assetData.fileName,
      alt: altText
    })
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    console.error('Failed to update asset:', error);
    throw new Error(`Failed to update asset alt text: ${error.message || 'Unknown error'}`);
  }

  const result = await updateResponse.json();
  console.log('Update result:', result);
  return result;
}

export class AssetService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Lists assets from a Webflow site
   * @param options - Options for listing assets
   * @returns Promise resolving to the list of assets
   */
  async listAssets(options: {
    siteId: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ assets: WebflowAsset[]; cursor?: string }> {
    const { siteId, cursor, limit } = options;
    const queryParams = new URLSearchParams();
    if (cursor) queryParams.set('cursor', cursor);
    if (limit) queryParams.set('limit', limit.toString());

    const response = await fetch(
      `https://api.webflow.com/v2/sites/${siteId}/assets?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to list assets: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      assets: data.assets,
      cursor: data.pagination?.next_cursor,
    };
  }
}
