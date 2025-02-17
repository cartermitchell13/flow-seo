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
    // Don't save if there's no change
    const asset = assets.find(a => a.id === assetId);
    if (!asset || asset.alt === altText) {
      // Clear any editing state
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

      // Clear the edited state
      setEditedAltTexts(prev => {
        const newState = { ...prev };
        delete newState[assetId];
        return newState;
      });

      // Update the local asset state by notifying parent
      const updatedAsset = { ...asset, alt: altText };
      onAssetUpdate(updatedAsset);

      // Notify Webflow
      window.webflow.notify?.({
        type: 'success',
        message: 'Alt text updated successfully'
      });

    } catch (error: any) {
      console.error('Error saving alt text:', error);
      
      // Clear loading state but keep the edited value
      setEditedAltTexts(prev => ({
        ...prev,
        [assetId]: {
          loading: false,
          value: altText
        }
      }));

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
      >
        {assets.map((asset) => {
          const labelId = `asset-list-label-${asset.id}`;
          const isSelected = selectedAssets.includes(asset.id);
          const editedAltText = editedAltTexts[asset.id]?.value;
          const isLoading = editedAltTexts[asset.id]?.loading;

          return (
            <Grid 
              item 
              xs={12} 
              sm={6}
              key={asset.id}
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
                  sx={{
                    width: 100,
                    position: 'relative',
                    bgcolor: '#141414',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleToggle(asset.id)}
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
                      inputProps={{ 'aria-labelledby': labelId }}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-checked': {
                          color: 'white',
                        },
                        padding: '2px',
                      }}
                    />
                  </Box>

                  {/* Image Preview */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 1,
                    }}
                  >
                    <Box
                      component="img"
                      src={asset.url}
                      alt={asset.alt || asset.name}
                      sx={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                </Box>

                {/* Right side - Alt Text Section */}
                <Box sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 1.25,
                  height: '100%',
                }}>
                  {/* Top header with Alt Text and Format */}
                  <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Alt Text
                    </Typography>
                    <Chip
                      label="webp"
                      size="small"
                      variant="outlined"
                      sx={{ 
                        bgcolor: 'transparent',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        height: '20px',
                        '& .MuiChip-label': {
                          px: 1,
                          fontSize: '0.75rem',
                        },
                      }}
                    />
                  </Box>

                  {/* Alt Text Input */}
                  <Box sx={{ 
                    flex: 1,
                    minHeight: 0,
                  }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      value={editedAltText ?? asset.alt ?? ''}
                      onChange={(e) => handleAltTextChange(asset.id, e.target.value)}
                      onBlur={(e) => saveAltText(asset.id, e.target.value)}
                      disabled={isLoading}
                      helperText={isLoading ? 'Saving...' : undefined}
                      sx={{
                        height: '100%',
                        '& .MuiOutlinedInput-root': {
                          bgcolor: '#141414',
                          color: 'white',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          height: '100%',
                          '& textarea': {
                            height: '100% !important',
                            padding: '3px 3px',
                            scrollbarWidth: 'thin',
                            '&::-webkit-scrollbar': {
                              width: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              borderRadius: '2px',
                            },
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            padding: 0,
                          },
                          '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.2)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.3)',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '0.75rem',
                          position: 'absolute',
                          bottom: -18,
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
