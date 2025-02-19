/**
 * Types for Webflow Assets
 * Based on Webflow API v2.0.0 Asset schema
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

export interface WebflowAsset {
  id: string;
  contentType: string;
  size: number;
  siteId: string;
  hostedUrl: string;
  originalFileName: string;
  displayName: string;
  lastUpdated: string;
  createdOn: string;
  variants: AssetVariant[];
  altText?: string;
}

export interface ListAssetsResponse {
  assets: WebflowAsset[];
  pagination: {
    hasNextPage: boolean;
    endCursor?: string;
  };
}

export interface ListAssetsOptions {
  siteId: string;
  limit?: number;
  cursor?: string;
}
