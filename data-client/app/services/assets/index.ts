import { WebflowClient } from "webflow-api";
import { ListAssetsOptions, WebflowAsset } from "./types";
import { db } from "../../db";

/**
 * Service for handling Webflow asset operations
 */
export class AssetService {
  private client: WebflowClient;

  constructor(accessToken: string) {
    this.client = new WebflowClient({ token: accessToken });
  }

  /**
   * List assets for a specific site
   * Fetches assets from Webflow and handles pagination
   * 
   * @param options - Options for listing assets including siteId and pagination params
   * @returns Promise containing the assets and pagination info
   */
  async listAssets(options: ListAssetsOptions) {
    try {
      const response = await this.client.assets.list({
        siteId: options.siteId,
        limit: options.limit || 50,
        offset: options.offset || 0,
      });

      // Filter for only image assets
      const imageAssets = response.assets.filter(
        asset => asset.contentType.startsWith('image/')
      );

      return {
        assets: imageAssets,
        pagination: {
          limit: response.pagination.limit,
          offset: response.pagination.offset,
          total: response.pagination.total,
        },
      };
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw new Error('Failed to fetch assets from Webflow');
    }
  }

  /**
   * Get a single asset by ID
   * 
   * @param siteId - The ID of the site containing the asset
   * @param assetId - The ID of the asset to retrieve
   * @returns Promise containing the asset details
   */
  async getAsset(siteId: string, assetId: string): Promise<WebflowAsset> {
    try {
      const asset = await this.client.assets.get({
        siteId,
        assetId,
      });

      return asset;
    } catch (error) {
      console.error('Error fetching asset:', error);
      throw new Error('Failed to fetch asset from Webflow');
    }
  }

  /**
   * Update an asset's metadata (like alt text)
   * 
   * @param siteId - The ID of the site containing the asset
   * @param assetId - The ID of the asset to update
   * @param altText - The new alt text to set
   * @returns Promise containing the updated asset
   */
  async updateAssetAltText(siteId: string, assetId: string, altText: string): Promise<WebflowAsset> {
    try {
      const asset = await this.client.assets.update({
        siteId,
        assetId,
        fields: {
          altText,
        },
      });

      return asset;
    } catch (error) {
      console.error('Error updating asset:', error);
      throw new Error('Failed to update asset alt text');
    }
  }
}
