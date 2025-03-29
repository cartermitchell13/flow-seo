import { WebflowClient } from "webflow-api";
import { ListAssetsOptions, WebflowAsset, ListAssetsResponse } from "./types";
import db from "../../lib/utils/database";

/**
 * Service for handling Webflow asset operations
 */
export class AssetService {
  private client: WebflowClient;

  constructor(accessToken: string) {
    // Initialize WebflowClient with the correct options format
    this.client = new WebflowClient({
      // @ts-expect-error The WebflowClient type definitions are outdated
      token: accessToken
    });
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
      // @ts-expect-error The WebflowClient type definitions are outdated
      const response = await this.client.assets.list({
        siteId: options.siteId,
        limit: options.limit || 50,
        offset: options.offset || 0,
      });

      // The response type from the API doesn't match our TypeScript definitions
      // Use type assertion to handle this mismatch
      const apiResponse = response as any;

      // Filter for only image assets
      const imageAssets = apiResponse.assets?.filter(
        (asset: any) => asset.contentType?.startsWith("image/")
      ) || [];

      return {
        assets: imageAssets.map((asset: any) => ({
          id: asset.id || "",
          name: asset.fileName || "",
          url: asset.url || "",
          thumbnailUrl: asset.thumbnailUrl || "",
          width: asset.dimensions?.width || 0,
          height: asset.dimensions?.height || 0,
          size: asset.size || 0,
          contentType: asset.contentType || "",
          dateCreated: asset.dateCreated || "",
          dateUpdated: asset.dateUpdated || "",
          altText: asset.altText || "",
        })),
        pagination: {
          total: apiResponse.pagination?.total || 0,
          count: apiResponse.pagination?.count || 0,
          offset: apiResponse.pagination?.offset || 0,
        },
      };
    } catch (error) {
      console.error("Error listing assets:", error);
      throw error;
    }
  }

  /**
   * Get a specific asset by ID
   * 
   * @param siteId - The Webflow site ID
   * @param assetId - The asset ID to retrieve
   * @returns Promise with the asset details
   */
  async getAsset(siteId: string, assetId: string): Promise<WebflowAsset> {
    try {
      // @ts-expect-error The WebflowClient type definitions are outdated
      const response = await this.client.assets.get({
        siteId,
        assetId,
      });

      // The response type from the API doesn't match our TypeScript definitions
      // Use type assertion to handle this mismatch
      const asset = response as any;

      return {
        id: asset.id || "",
        name: asset.fileName || "",
        url: asset.url || "",
        thumbnailUrl: asset.thumbnailUrl || "",
        width: asset.dimensions?.width || 0,
        height: asset.dimensions?.height || 0,
        size: asset.size || 0,
        contentType: asset.contentType || "",
        dateCreated: asset.dateCreated || "",
        dateUpdated: asset.dateUpdated || "",
        altText: asset.altText || "",
      };
    } catch (error) {
      console.error("Error fetching asset:", error);
      throw error;
    }
  }

  /**
   * Update the alt text for an asset
   * 
   * @param siteId - The Webflow site ID
   * @param assetId - The asset ID to update
   * @param altText - The new alt text
   * @returns Promise with the updated asset
   */
  async updateAssetAltText(siteId: string, assetId: string, altText: string): Promise<WebflowAsset> {
    try {
      // @ts-expect-error The WebflowClient type definitions are outdated
      const response = await this.client.assets.update({
        siteId,
        assetId,
        fields: {
          altText,
        },
      });

      // The response type from the API doesn't match our TypeScript definitions
      // Use type assertion to handle this mismatch
      const asset = response as any;

      return {
        id: asset.id || "",
        name: asset.fileName || "",
        url: asset.url || "",
        thumbnailUrl: asset.thumbnailUrl || "",
        width: asset.dimensions?.width || 0,
        height: asset.dimensions?.height || 0,
        size: asset.size || 0,
        contentType: asset.contentType || "",
        dateCreated: asset.dateCreated || "",
        dateUpdated: asset.dateUpdated || "",
        altText: asset.altText || "",
      };
    } catch (error) {
      console.error("Error updating asset:", error);
      throw error;
    }
  }
}
