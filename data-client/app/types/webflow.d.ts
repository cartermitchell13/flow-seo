/**
 * Type declarations for Webflow Designer Extension SDK and API
 */

declare module '@webflow/designer-extension-sdk' {
  export const webflow: {
    getAllAssets(): Promise<Asset[]>;
    getAsset(id: string): Promise<Asset>;
    getSite(): Promise<Site>;
    getUser(): Promise<User>;
  };
}

declare module 'webflow-api' {
  export class WebflowClient {
    constructor(options: { accessToken: string });
    token: string;
  }
}

declare global {
  interface Window {
    webflow: {
      getAllAssets(): Promise<Asset[]>;
      getAsset(id: string): Promise<Asset>;
      getSite(): Promise<Site>;
      getUser(): Promise<User>;
    }
  }
}

/**
 * Webflow Asset interface
 */
export interface Asset {
  id: string;
  name: string;
  altText?: string;
  url: string;
  createdOn: string;
  updatedOn: string;
  contentType?: string;
  size?: number;
  variants?: AssetVariant[];
  [key: string]: unknown;
}

/**
 * Asset variant interface
 */
export interface AssetVariant {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  [key: string]: unknown;
}

/**
 * Webflow Site interface
 */
export interface Site {
  id: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Webflow User interface
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
}

// This export is needed to make this a module
export {};
