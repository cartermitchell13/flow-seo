import { useState } from 'react';
import {
  Box,
  Grid,
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
  /** Callback fired when an asset's alt text is updated */
  onAssetUpdate: (updatedAsset: Asset) => void;
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
  onSelectionChange,
  onAssetUpdate
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

  /**
   * Handles changes to alt text input
   */
  const handleAltTextChange = (assetId: string, value: string) => {
    // Limit to 125 characters
    const limitedValue = value.slice(0, 125);
    
    setEditedAltTexts(prev => ({
      ...prev,
      [assetId]: {
        value: limitedValue,
        loading: false
      }
    }));
  };

  /**
   * Updates the alt text for an asset in Webflow
   */
  const saveAltText = async (assetId: string, altText: string) => {
    // Don't save if there's no change
    const asset = assets.find(a => a.id === assetId);
    if (!asset || asset.alt === altText) {
      setEditedAltTexts(prev => {
        const newState = { ...prev };
        delete newState[assetId];
        return newState;
      });
      return;
    }

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
      const webflowAssets = await window.webflow.getAllAssets();
      const webflowAsset = webflowAssets.find((a: WebflowAsset) => a.id === assetId);
      
      if (!webflowAsset) {
        throw new Error(`Asset with ID ${assetId} not found`);
      }

      // Update the alt text using Webflow Designer API
      await webflowAsset.setAltText(altText);

      // Update the local asset state
      const updatedAsset = { ...asset, alt: altText };
      onAssetUpdate(updatedAsset);

      // Clear the edited state
      setEditedAltTexts(prev => {
        const newState = { ...prev };
        delete newState[assetId];
        return newState;
      });

      // Notify success
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
    <Box 
      role="region"
      aria-label="Asset Browser"
      sx={{ 
        width: '100%',
        px: 0,
        py: 0,
      }}
    >
      <Grid 
        container 
        spacing={2}
        columns={12}
        role="list"
        aria-label="Image assets list"
      >
        {assets.map((asset) => {
          const labelId = `asset-list-label-${asset.id}`;
          const altTextId = `alt-text-input-${asset.id}`;
          const isSelected = selectedAssets.includes(asset.id);
          const editedAltText = editedAltTexts[asset.id]?.value;
          const isLoading = editedAltTexts[asset.id]?.loading;

          return (
            <Grid 
              item 
              xs={12} 
              sm={6}
              key={asset.id}
              role="listitem"
            >
              <Box
                sx={{
                  bgcolor: '#1E1E1E',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  height: 180,
                  width: '100%',
                }}
              >
                {/* Left side - Image Container */}
                <Box
                  component="button"
                  onClick={() => handleToggle(asset.id)}
                  aria-label={`Select ${asset.name}`}
                  aria-pressed={isSelected}
                  sx={{
                    width: 100,
                    position: 'relative',
                    bgcolor: '#141414',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    border: 'none',
                    padding: 0,
                  }}
                >
                  {/* Header with checkbox */}
                  <Box sx={{ 
                    position: 'absolute',
                    top: 5,
                    left: 18,
                    zIndex: 1,
                  }}>
                    <Checkbox
                      edge="start"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleToggle(asset.id);
                      }}
                      inputProps={{ 
                        'aria-labelledby': labelId,
                        'aria-label': `Select ${asset.name}`,
                      }}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.3)',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  </Box>

                  {/* Image preview */}
                  <Box
                    component="img"
                    src={asset.url}
                    alt={`Preview of ${asset.name}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>

                {/* Right side - Content */}
                <Box sx={{ 
                  flex: 1,
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}>
                  {/* Asset name and type */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography
                      id={labelId}
                      variant="subtitle2"
                      noWrap
                      sx={{ flex: 1 }}
                    >
                      {asset.name}
                    </Typography>
                    {asset.type && (
                      <Chip 
                        label={asset.type}
                        size="small"
                        variant="outlined"
                        sx={{ 
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                          color: 'text.secondary',
                        }}
                      />
                    )}
                  </Stack>

                  {/* Alt text field */}
                  <TextField
                    id={altTextId}
                    fullWidth
                    multiline
                    rows={3}
                    size="small"
                    placeholder="Enter alt text"
                    value={editedAltText ?? asset.alt ?? ''}
                    onChange={(e) => handleAltTextChange(asset.id, e.target.value)}
                    onBlur={(e) => saveAltText(asset.id, e.target.value)}
                    disabled={isLoading}
                    aria-label={`Alt text for ${asset.name}`}
                    InputProps={{
                      'aria-describedby': `${altTextId}-help`,
                    }}
                    sx={{
                      flex: 1,
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'var(--backgroundInput)',
                        '& textarea': {
                          fontSize: '0.75rem',
                          lineHeight: '1.4',
                          height: '72px !important', // Fixed height for 3 rows
                          overflow: 'hidden !important',
                          '&::-webkit-scrollbar': {
                            display: 'none',
                          },
                          scrollbarWidth: 'none',
                          msOverflowStyle: 'none',
                        }
                      }
                    }}
                  />
                  <Typography
                    id={`${altTextId}-help`}
                    variant="caption"
                    color="text.secondary"
                  >
                    {isLoading ? 'Saving...' : 'Click outside to save'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
