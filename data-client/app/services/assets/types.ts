/**
 * Types for Webflow Assets
 * Based on Webflow API v2.0.0 Asset schema with modifications for our application
 */

export interface AssetVariant {
  hostedUrl: string;
  originalFileName: string;
  displayName: string;
  format: string;
  width: number;
  height: number;
  quality: number;
}

/**
 * WebflowAsset interface
 * Represents an asset from Webflow with our application's required fields
 */
export interface WebflowAsset {
  id: string;
  name: string;           // fileName from API
  url: string;            // URL from API
  thumbnailUrl: string;   // Thumbnail URL from API
  width: number;          // From dimensions
  height: number;         // From dimensions
  size: number;           // File size in bytes
  contentType: string;    // MIME type
  dateCreated: string;    // Creation date
  dateUpdated: string;    // Last update date
  altText: string;        // Alt text for the image
}

/**
 * Pagination information for asset listings
 */
export interface AssetPagination {
  total: number;
  count: number;
  offset: number;
}

/**
 * Response structure for listing assets
 */
export interface ListAssetsResponse {
  assets: WebflowAsset[];
  pagination: AssetPagination;
}

/**
 * Options for listing assets
 */
export interface ListAssetsOptions {
  siteId: string;
  limit?: number;
  offset?: number;
}
