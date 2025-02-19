import { WebflowClient } from "webflow-api";
import { ListAssetsOptions, WebflowAsset, ListAssetsResponse } from "./types";

/**
 * Service for handling Webflow asset operations
 */
export class AssetService {
  private client: WebflowClient;

  constructor(accessToken: string) {
    this.client = new WebflowClient({ accessToken });
  }

  /**
   * List assets for a specific site
   * Fetches assets from Webflow and handles pagination
   * 
   * @param options - Options for listing assets including siteId and pagination params
   * @returns Promise containing the assets and pagination info
   */
  async listAssets(options: ListAssetsOptions): Promise<ListAssetsResponse> {
    try {
      // Use v2 API endpoint directly since the SDK doesn't fully support it
      const response = await fetch(
        `https://api.webflow.com/v2/sites/${options.siteId}/assets${
          options.cursor ? `?cursor=${options.cursor}` : ''
        }${options.limit ? `${options.cursor ? '&' : '?'}limit=${options.limit}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${this.client.token}`,
            'accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to list assets: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        assets: data.assets.map((asset: any): WebflowAsset => ({
          id: asset.id,
          contentType: asset.contentType || 'unknown',
          size: asset.size || 0,
          siteId: asset.siteId,
          hostedUrl: asset.hostedUrl,
          originalFileName: asset.originalFileName,
          displayName: asset.displayName,
          lastUpdated: asset.lastUpdated,
          createdOn: asset.createdOn,
          variants: asset.variants || [],
          altText: asset.altText
        })),
        count: data.pagination?.total || 0,
        limit: data.pagination?.limit || 0,
        offset: data.pagination?.offset || 0,
        nextCursor: data.pagination?.next_cursor
      };
    } catch (error) {
      console.error('Error listing assets:', error);
      throw error;
    }
  }

  /**
   * Get a specific asset by ID
   * 
   * @param siteId - The site ID
   * @param assetId - The asset ID
   * @returns Promise containing the asset data
   */
  async getAsset(siteId: string, assetId: string): Promise<WebflowAsset> {
    try {
      const response = await fetch(
        `https://api.webflow.com/v2/sites/${siteId}/assets/${assetId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.client.token}`,
            'accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get asset: ${response.statusText}`);
      }

      const asset = await response.json();
      return {
        id: asset.id,
        contentType: asset.contentType || 'unknown',
        size: asset.size || 0,
        siteId: asset.siteId,
        hostedUrl: asset.hostedUrl,
        originalFileName: asset.originalFileName,
        displayName: asset.displayName,
        lastUpdated: asset.lastUpdated,
        createdOn: asset.createdOn,
        variants: asset.variants || [],
        altText: asset.altText
      };
    } catch (error) {
      console.error('Error getting asset:', error);
      throw error;
    }
  }

  /**
   * Update an asset's alt text
   * 
   * @param siteId - The site ID
   * @param assetId - The asset ID
   * @param altText - The new alt text
   * @returns Promise containing the updated asset data
   */
  async updateAssetAltText(
    siteId: string,
    assetId: string,
    altText: string
  ): Promise<WebflowAsset> {
    try {
      const response = await fetch(
        `https://api.webflow.com/v2/sites/${siteId}/assets/${assetId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.client.token}`,
            'accept': 'application/json',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            altText
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update asset: ${response.statusText}`);
      }

      const asset = await response.json();
      return {
        id: asset.id,
        contentType: asset.contentType || 'unknown',
        size: asset.size || 0,
        siteId: asset.siteId,
        hostedUrl: asset.hostedUrl,
        originalFileName: asset.originalFileName,
        displayName: asset.displayName,
        lastUpdated: asset.lastUpdated,
        createdOn: asset.createdOn,
        variants: asset.variants || [],
        altText: asset.altText
      };
    } catch (error) {
      console.error('Error updating asset:', error);
      throw error;
    }
  }
}
