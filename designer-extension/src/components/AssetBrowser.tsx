import { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  TextField,
  Typography,
  Checkbox,
  Chip,
  Stack,
} from '@mui/material';
import { WebflowAsset } from '../types/webflow';

interface LoadingState {
  [key: string]: {
    loading: boolean;
    value: string;
  };
}

/**
 * Asset Interface
 * 
 * Represents a Webflow asset with its metadata and properties.
 * Following Webflow's data structure patterns.
 */
interface Asset {
  /** Unique identifier for the asset */
  id: string;
  /** Original filename of the asset */
  name: string;
  /** URL where the asset can be accessed */
  url: string;
  /** Current alt text of the asset, if any */
  alt?: string;
  /** Type of the asset (Library or Image) */
  type?: 'Library' | 'Image';
}

/**
 * AssetBrowser Component Props
 * 
 * Props interface for the AssetBrowser component.
 * Follows Webflow's component prop patterns.
 */
interface AssetBrowserProps {
  /** Array of assets to display in the browser */
  assets: Asset[];
  /** Currently selected asset IDs, controlled by parent */
  selectedAssets: string[];
  /** Callback fired when asset selection changes */
  onSelectionChange: (selectedAssets: string[]) => void;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
}

declare global {
  interface Window {
    webflow: {
      getAllAssets: () => Promise<WebflowAsset[]>;
      notify?: (options: { type: 'success' | 'error'; message: string }) => void;
    };
  }
}

/**
 * AssetBrowser Component
 */
export function AssetBrowser({ 
  assets, 
  selectedAssets, 
  onSelectionChange
}: AssetBrowserProps) {
  /**
   * Local state for tracking edited alt text values
   * This allows immediate UI feedback while editing
   */
  const [editedAltTexts, setEditedAltTexts] = useState<LoadingState>({});

  const handleToggle = (assetId: string) => {
    const newSelected = selectedAssets.includes(assetId)
      ? selectedAssets.filter(id => id !== assetId)
      : [...selectedAssets, assetId];
    onSelectionChange(newSelected);
  };

  const handleAltTextChange = (assetId: string, value: string) => {
    setEditedAltTexts(prev => ({
      ...prev,
      [assetId]: {
        loading: false,
        value
      }
    }));
  };

  /**
   * Updates the alt text for an asset in Webflow
   */
  const saveAltText = async (assetId: string, altText: string) => {
    console.log('Starting alt text save:', { assetId, altText });
    
    try {
      // Show loading state
      setEditedAltTexts(prev => ({
        ...prev,
        [assetId]: {
          loading: true,
          value: altText
        }
      }));

      // Use the Webflow Designer API to update alt text directly
      const assets = await window.webflow.getAllAssets();
      const asset = assets.find((a: WebflowAsset) => a.id === assetId);
      
      if (!asset) {
        throw new Error(`Asset with ID ${assetId} not found`);
      }

      // Update the alt text using Webflow Designer API
      await asset.setAltText(altText);

      // Clear the edited state
      setEditedAltTexts(prev => {
        const newState = { ...prev };
        delete newState[assetId];
        return newState;
      });

      // Notify Webflow
      window.webflow.notify?.({
        type: 'success',
        message: 'Alt text updated successfully'
      });

    } catch (error: any) {
      console.error('Error saving alt text:', error);
      
      // Clear loading state
      setEditedAltTexts(prev => {
        const newState = { ...prev };
        delete newState[assetId];
        return newState;
      });

      // Show error to user
      window.webflow.notify?.({
        type: 'error',
        message: `Failed to update alt text: ${error.message}`
      });
    }
  };

  // Empty state
  if (assets.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No assets found
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {assets.map((asset) => {
        const labelId = `asset-list-label-${asset.id}`;
        const isSelected = selectedAssets.includes(asset.id);
        const editedAltText = editedAltTexts[asset.id]?.value;
        const isLoading = editedAltTexts[asset.id]?.loading;

        return (
          <ListItem
            key={asset.id}
            dense
            divider
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              py: 2
            }}
          >
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', mb: 1 }}>
              <Checkbox
                edge="start"
                checked={isSelected}
                onChange={() => handleToggle(asset.id)}
                inputProps={{ 'aria-labelledby': labelId }}
              />
              {/* Asset Thumbnail */}
              <Box
                component="img"
                src={asset.url}
                alt={asset.alt || asset.name}
                sx={{
                  width: 100,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 1,
                  mr: 2
                }}
              />
              <Typography variant="subtitle1" component="div" id={labelId}>
                {asset.name}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                {asset.type && (
                  <Chip
                    label={asset.type}
                    size="small"
                    color={asset.type === 'Library' ? 'primary' : 'default'}
                  />
                )}
              </Stack>
            </Box>
            <Box sx={{ width: '100%', pl: 7 }}>
              <TextField
                fullWidth
                size="small"
                label="Alt Text"
                value={editedAltText ?? asset.alt ?? ''}
                onChange={(e) => handleAltTextChange(asset.id, e.target.value)}
                onBlur={(e) => saveAltText(asset.id, e.target.value)}
                disabled={isLoading}
                helperText={isLoading ? 'Saving...' : undefined}
              />
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
}
