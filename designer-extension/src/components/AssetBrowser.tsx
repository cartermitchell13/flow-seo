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

/**
 * AssetBrowser Component
 * 
 * Displays a list of Webflow assets with their thumbnails and alt text.
 * Follows Webflow's design system and component patterns.
 * 
 * Features:
 * - Image thumbnail display
 * - Checkbox selection for batch operations
 * - Inline alt text editing
 * - Asset type indicators (Library/Image)
 * - Loading and empty states
 * 
 * @param props AssetBrowserProps - Component properties
 * @returns React component
 */
export function AssetBrowser({ 
  assets, 
  selectedAssets, 
  onSelectionChange, 
  isLoading = false 
}: AssetBrowserProps) {
  /**
   * Local state for tracking edited alt text values
   * This allows immediate UI feedback while editing
   */
  const [editedAltTexts, setEditedAltTexts] = useState<Record<string, string>>({});

  /**
   * Handles toggling selection of an asset
   * Updates parent component's selection state
   * 
   * @param assetId - ID of the asset to toggle
   */
  const handleToggle = (assetId: string) => {
    const newSelected = selectedAssets.includes(assetId)
      ? selectedAssets.filter(id => id !== assetId)
      : [...selectedAssets, assetId];
    onSelectionChange(newSelected);
  };

  /**
   * Handles changes to alt text input fields
   * Stores the edited value in local state
   * 
   * @param assetId - ID of the asset being edited
   * @param value - New alt text value
   */
  const handleAltTextChange = (assetId: string, value: string) => {
    setEditedAltTexts(prev => ({
      ...prev,
      [assetId]: value
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
        [`${assetId}_loading`]: true
      }));

      // Get the current site ID from Webflow
      const siteId = window.webflow?.site?.id;
      if (!siteId) {
        throw new Error('Could not determine site ID');
      }

      console.log('Making API request with:', {
        siteId,
        assetId,
        altText
      });

      const response = await fetch('/api/update-alt-text', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId,
          assetId,
          altText
        })
      });

      console.log('Received response:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update alt text');
      }

      // Update was successful
      console.log('Alt text update successful');
      
      // Clear the edited state
      setEditedAltTexts(prev => {
        const { [assetId]: _, [`${assetId}_loading`]: __, ...rest } = prev;
        return rest;
      });

      // Notify Webflow
      if (window.webflow?.notify) {
        window.webflow.notify({
          type: 'success',
          message: 'Alt text updated successfully'
        });
      }

      // Try to refresh the asset in Webflow's UI
      if (window.webflow?.triggerEvent) {
        window.webflow.triggerEvent('assetUpdated', { assetId });
      }

    } catch (error: any) {
      console.error('Error saving alt text:', error);
      
      // Clear loading state
      setEditedAltTexts(prev => {
        const { [`${assetId}_loading`]: _, ...rest } = prev;
        return rest;
      });

      // Show error to user
      if (window.webflow?.notify) {
        window.webflow.notify({
          type: 'error',
          message: `Failed to update alt text: ${error.message}`
        });
      }
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
    <List sx={{ width: '100%', bgcolor: 'transparent' }}>
      {assets.map((asset) => {
        const isSelected = selectedAssets.includes(asset.id);

        return (
          <ListItem
            key={asset.id}
            sx={{
              borderBottom: '1px solid #333',
              py: 2,
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            {/* Asset Container */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: 2 }}>
              {/* Selection Checkbox */}
              <Checkbox
                edge="start"
                checked={isSelected}
                onChange={() => handleToggle(asset.id)}
                sx={{ mt: 1 }}
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
                  bgcolor: '#333'
                }}
              />

              {/* Asset Information and Alt Text Editor */}
              <Box sx={{ flex: 1 }}>
                {/* Asset Header: Name and Type */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ color: 'white' }}>
                    {asset.name}
                  </Typography>
                  <Chip
                    label={asset.type || 'Image'}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                  />
                </Stack>

                {/* Alt Text Input Field */}
                <TextField
                  fullWidth
                  multiline
                  size="small"
                  placeholder="No alt text"
                  value={editedAltTexts[asset.id] ?? asset.alt ?? ''}
                  onChange={(e) => handleAltTextChange(asset.id, e.target.value)}
                  onBlur={() => {
                    const newAltText = editedAltTexts[asset.id];
                    if (newAltText !== undefined && newAltText !== asset.alt) {
                      saveAltText(asset.id, newAltText);
                    }
                  }}
                  disabled={!!editedAltTexts[`${asset.id}_loading`]}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                      },
                    },
                  }}
                />
              </Box>
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
}
