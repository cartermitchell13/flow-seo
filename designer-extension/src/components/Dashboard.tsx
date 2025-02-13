import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  ButtonGroup,
  Link,
  Stack,
} from '@mui/material';
import { LoadingStates } from './LoadingStates.tsx';
import { AssetBrowser } from './AssetBrowser';
import { Site } from '../types/types.ts';

interface DashboardProps {
  user: { firstName: string };
  sites: Site[];
  isLoading: boolean;
  isError: boolean;
  error: string;
  onFetchSites: () => void;
}

/**
 * Dashboard Component
 * 
 * The main interface of the AI-powered alt text generator app. This component implements
 * a design similar to the Webflow asset browser with:
 * 1. Top Bar: Simple controls for asset selection and filtering
 * 2. Main Content: Image list with alt text editing
 * 3. Bottom Bar: Action buttons for AI generation and saving
 */
export function Dashboard({
  user,
  sites,
  isLoading,
  isError,
  error,
  onFetchSites,
}: DashboardProps) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [credits, setCredits] = useState(0);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
      {/* Top Bar */}
      <Box sx={{ 
        p: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: '#1A1A1A'
      }}>
        <ButtonGroup 
          size="small" 
          variant="outlined"
          sx={{
            '& .MuiButton-root': {
              color: 'text.primary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }
          }}
        >
          <Button>Select 10 w/o alt</Button>
          <Button>Deselect All</Button>
        </ButtonGroup>

        <Select
          size="small"
          value="all"
          sx={{ 
            minWidth: 120,
            bgcolor: '#1A1A1A',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider'
            }
          }}
        >
          <MenuItem value="all">Asset Library</MenuItem>
        </Select>

        <Link
          href="#"
          sx={{ 
            ml: 1,
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { 
              textDecoration: 'underline',
              color: 'primary.light'
            }
          }}
        >
          How to use
        </Link>

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {credits} credits left
          </Typography>
          <Button 
            size="small" 
            variant="outlined"
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            Credits
          </Button>
          <Button 
            size="small" 
            variant="contained" 
            color="primary"
          >
            Buy credits
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <AssetBrowser
          assets={[]} // To be populated with actual assets
          onSelectionChange={setSelectedAssets}
          isLoading={isLoading}
        />
      </Box>

      {/* Bottom Bar */}
      <Box sx={{ 
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Typography variant="body2">
          {selectedAssets.length} of 69 Selected
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            disabled={selectedAssets.length === 0}
          >
            Mark Decorative
          </Button>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            startIcon={<span>🪄</span>}
            disabled={selectedAssets.length === 0}
          >
            AI for Selected
          </Button>
        </Stack>

        <Button
          sx={{ ml: 'auto' }}
          variant="outlined"
          size="small"
          disabled={selectedAssets.length === 0}
        >
          Save selected with changes
        </Button>
      </Box>

      {/* Loading and Error States */}
      <LoadingStates isLoading={isLoading} isError={isError} error={error} />
    </Box>
  );
}
