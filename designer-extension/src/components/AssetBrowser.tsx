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
 * Represents a Webflow asset (image) with its metadata
 */
interface Asset {
  /**
   * Unique identifier for the asset
   */
  id: string;
  /**
   * Original filename of the asset
   */
  name: string;
  /**
   * URL where the asset can be accessed
   */
  url: string;
  /**
   * Current alt text of the asset, if any
   */
  alt?: string;
  /**
   * Type of the asset (Library or Image)
   */
  type?: 'Library' | 'Image';
}

/**
 * AssetBrowser Component Props
 */
interface AssetBrowserProps {
  /**
   * Array of assets to display in the browser
   */
  assets: Asset[];
  /**
   * Callback fired when asset selection changes
   * @param selectedAssets Array of selected asset IDs
   */
  onSelectionChange: (selectedAssets: string[]) => void;
  /**
   * Whether the component is in a loading state
   */
  isLoading?: boolean;
}

/**
 * AssetBrowser Component
 * 
 * Displays a list of Webflow assets (images) with their thumbnails and alt text.
 * Features:
 * - Image thumbnail display
 * - Checkbox selection for batch operations
 * - Inline alt text editing
 * - Asset type indicators (Library/Image)
 * - Loading and empty states
 * 
 * The component follows Webflow's dark theme design with:
 * - Dark background (#1A1A1A)
 * - Subtle hover effects
 * - Clear visual hierarchy
 * - Consistent spacing and typography
 */
export function AssetBrowser({ assets, onSelectionChange, isLoading = false }: AssetBrowserProps) {
  // Track selected assets for batch operations
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  
  // Track edited alt text values
  const [editedAltTexts, setEditedAltTexts] = useState<Record<string, string>>({});

  /**
   * Handles toggling selection of an asset
   * Updates both local state and parent component
   */
  const handleToggle = (assetId: string) => {
    const newSelected = selectedAssets.includes(assetId)
      ? selectedAssets.filter(id => id !== assetId)
      : [...selectedAssets, assetId];
    setSelectedAssets(newSelected);
    onSelectionChange(newSelected);
  };

  /**
   * Handles changes to alt text input fields
   * Stores the edited value in local state
   */
  const handleAltTextChange = (assetId: string, value: string) => {
    setEditedAltTexts(prev => ({
      ...prev,
      [assetId]: value
    }));
  };

  return (
    <List sx={{ 
      height: '100%',
      overflow: 'auto',
      bgcolor: '#1A1A1A',
      '& .MuiListItem-root': {
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1
      }
    }}>
      {/* Asset List Items */}
      {(assets.length > 0 ? assets : []).map((asset) => (
        <ListItem
          key={asset.id}
          disablePadding
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1,
            p: 1,
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Thumbnail with Selection Checkbox */}
            <Box sx={{ position: 'relative' }}>
              <img
                src={asset.url}
                alt=""
                style={{
                  width: '120px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }}
              />
              <Checkbox
                checked={selectedAssets.includes(asset.id)}
                onChange={() => handleToggle(asset.id)}
                sx={{ 
                  position: 'absolute',
                  top: -8,
                  left: -8,
                  bgcolor: '#1A1A1A',
                  borderRadius: '4px',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              />
            </Box>

            {/* Asset Details and Alt Text Editor */}
            <Box sx={{ flex: 1 }}>
              {/* Filename and Type Indicator */}
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography
                  variant="body2"
                  sx={{ 
                    color: 'text.secondary',
                    fontFamily: 'monospace'
                  }}
                >
                  {asset.name}
                </Typography>
                <Chip
                  label={asset.type || 'Library'}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: 'text.secondary',
                    borderRadius: 1
                  }}
                />
              </Stack>

              {/* Alt Text Editor */}
              <TextField
                fullWidth
                multiline
                size="small"
                placeholder="No alt text"
                value={editedAltTexts[asset.id] || asset.alt || ''}
                onChange={(e) => handleAltTextChange(asset.id, e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    '&:hover': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.23)'
                      }
                    },
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      }
                    }
                  }
                }}
              />
            </Box>
          </Box>
        </ListItem>
      ))}

      {/* Loading State */}
      {isLoading && (
        <ListItem>
          <Typography color="text.secondary" align="center" sx={{ width: '100%' }}>
            Loading assets...
          </Typography>
        </ListItem>
      )}

      {/* Empty State */}
      {!isLoading && assets.length === 0 && (
        <ListItem>
          <Typography color="text.secondary" align="center" sx={{ width: '100%', py: 4 }}>
            No assets found
          </Typography>
        </ListItem>
      )}
    </List>
  );
}
