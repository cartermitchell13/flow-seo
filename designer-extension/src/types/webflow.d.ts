/**
 * Type definitions for Webflow Designer API
 */

interface WebflowUser {
  firstName: string;
  lastName: string;
  email: string;
}

interface WebflowSite {
  id: string;
  name: string;
  shortName: string;
  timezone: string;
}

/**
 * Represents a Webflow asset in the Designer API
 */
interface WebflowAsset {
  /**
   * Unique identifier for the asset
   */
  id: string;

  /**
   * Get the name of the asset
   * @returns Promise resolving to the asset name
   */
  getName(): Promise<string>;

  /**
   * Get the MIME type of the asset
   * @returns Promise resolving to the asset MIME type
   */
  getMimeType(): Promise<string>;

  /**
   * Get the URL where the asset can be accessed
   * @returns Promise resolving to the asset URL
   */
  getUrl(): Promise<string>;

  /**
   * Get the current alt text of the asset
   * @returns Promise resolving to the asset alt text
   */
  getAltText(): Promise<string>;

  /**
   * Set new alt text for the asset
   * @param altText - New alt text to set
   * @returns Promise resolving when alt text is set
   */
  setAltText(altText: string): Promise<void>;

  /**
   * Get the parent asset (if this is a library asset)
   * @returns Promise resolving to the parent asset or null
   */
  getParent(): Promise<WebflowAsset | null>;

  /**
   * Set the parent asset (for library assets)
   * @param parent - Parent asset to set
   * @returns Promise resolving when parent is set
   */
  setParent(parent: WebflowAsset | null): Promise<void>;
}

interface WebflowDesignerExtensionContext {
  user: WebflowUser;
  site: WebflowSite;
}

interface WebflowDesignerExtension {
  mount: (context: WebflowDesignerExtensionContext) => Promise<void>;
}

interface Webflow {
  /**
   * Push a client extension to Webflow
   */
  pushClient: (extension: WebflowDesignerExtension) => void;

  /**
   * Set the size of the extension panel
   */
  setExtensionSize: (size: 'small' | 'medium' | 'large') => void;

  /**
   * Get all assets from the current site
   * @returns Promise resolving to array of assets
   */
  getAllAssets(): Promise<WebflowAsset[]>;
}

declare global {
  interface Window {
    webflow?: Webflow;
  }
}
