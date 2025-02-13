/**
 * API client for asset-related operations
 */

import { Asset } from '../types/types';

/**
 * Fetches assets for the current site using Webflow Designer API
 * @returns Promise containing array of assets
 */
export const fetchAssets = async (): Promise<Asset[]> => {
  try {
    // Get all assets from Webflow Designer API
    const assets = await window.webflow.getAllAssets();
    
    // Process all assets in parallel for better performance
    const processedAssets = await Promise.all(
      assets.map(async (asset) => {
        try {
          // Get all required asset details using the API methods
          const [name, url, alt, mimeType] = await Promise.all([
            asset.getName(),
            asset.getUrl(),
            asset.getAltText(),
            asset.getMimeType()
          ]);

          // Determine if it's a library asset based on its parent
          const parent = await asset.getParent();
          const type = parent ? 'Library' : 'Image';

          return {
            id: asset.id || '', // Assuming the asset object has an id property
            name,
            url,
            alt: alt || '',
            type,
            mimeType
          };
        } catch (error) {
          console.error(`Error processing asset: ${error}`);
          return null;
        }
      })
    );

    // Filter out any failed asset processing
    return processedAssets.filter((asset): asset is Asset => asset !== null);
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};
