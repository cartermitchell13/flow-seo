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

interface Asset {
  id: string;
  name: string;
  url: string;
  alt?: string;
  type?: 'Library' | 'Image';
}

interface AssetBrowserProps {
  assets: Asset[];
  onSelectionChange: (selectedAssets: string[]) => void;
  isLoading?: boolean;
}

/**
 * AssetBrowser Component
 * 
 * Displays a list of assets with their thumbnails and alt text.
 * Allows for selection and inline alt text editing.
 */
export function AssetBrowser({ assets, onSelectionChange, isLoading = false }: AssetBrowserProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [editedAltTexts, setEditedAltTexts] = useState<Record<string, string>>({});

  const handleToggle = (assetId: string) => {
    const newSelected = selectedAssets.includes(assetId)
      ? selectedAssets.filter(id => id !== assetId)
      : [...selectedAssets, assetId];
    setSelectedAssets(newSelected);
    onSelectionChange(newSelected);
  };

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
            {/* Thumbnail and Checkbox */}
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

            {/* Content */}
            <Box sx={{ flex: 1 }}>
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

      {isLoading && (
        <ListItem>
          <Typography color="text.secondary" align="center" sx={{ width: '100%' }}>
            Loading assets...
          </Typography>
        </ListItem>
      )}

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
