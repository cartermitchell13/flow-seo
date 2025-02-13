import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Select,
  MenuItem,
  ButtonGroup,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { Key as KeyIcon } from '@mui/icons-material';
import { LoadingStates } from './LoadingStates.tsx';
import { AssetBrowser } from './AssetBrowser';
import { AiProviderConfig } from './AiProviderConfig';
import { Site } from '../types/types.ts';

/**
 * Dashboard Component Props
 * 
 * Properties passed to the Dashboard component
 */
interface DashboardProps {
  /**
   * Current user information
   */
  user: { firstName: string };
  /**
   * List of Webflow sites the user has access to
   */
  sites: Site[];
  /**
   * Indicates if data is currently being loaded
   */
  isLoading: boolean;
  /**
   * Indicates if there was an error loading data
   */
  isError: boolean;
  /**
   * Error message if there was an error loading data
   */
  error: string;
  /**
   * Callback to trigger site data fetching
   */
  onFetchSites: () => void;
}

/**
 * Dashboard Component
 * 
 * Main interface for the AI-powered alt text generator app. This component follows
 * Webflow's design system and implements a three-section layout:
 * 
 * 1. Top Bar:
 *    - Asset selection controls (Select 10 w/o alt, Deselect All)
 *    - Asset Library dropdown for filtering
 *    - Help documentation link
 *    - API Key configuration button
 * 
 * 2. Main Content:
 *    - Asset browser with image thumbnails
 *    - Alt text editing interface
 *    - Selection indicators
 * 
 * 3. Bottom Bar:
 *    - Selection counter
 *    - Action buttons (Mark Decorative, AI Generation, Save Changes)
 * 
 * The component also includes a dialog for API key configuration that allows users
 * to set up their preferred AI provider (OpenAI, Anthropic, etc.).
 */
export function Dashboard({
  user,
  sites,
  isLoading,
  isError,
  error,
  onFetchSites,
}: DashboardProps) {
  // Track selected assets for batch operations
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  
  // Control visibility of the API key configuration dialog
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      bgcolor: 'background.default',
      color: 'text.primary',
      m: 0, 
      p: 0
    }}>
      {/* Top Bar - Contains main controls and actions */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: '#1A1A1A',
        p: 1
      }}>
        {/* Asset Selection Controls */}
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

        {/* Asset Library Filter Dropdown */}
        <Select
          size="medium"
          value="all"
          sx={{ 
            minWidth: 160,
            bgcolor: '#1A1A1A',
            fontSize: '1rem',
            height: 40,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: 'divider'
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main'
            }
          }}
        >
          <MenuItem value="all">Asset Library</MenuItem>
        </Select>

        {/* Help Documentation Link */}
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

        {/* API Key Configuration Button */}
        <Box sx={{ ml: 'auto' }}>
          <Button 
            size="small" 
            variant="outlined"
            startIcon={<KeyIcon />}
            onClick={() => setShowApiKeyDialog(true)}
            sx={{
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            Add API Key
          </Button>
        </Box>
      </Box>

      {/* Main Content - Asset Browser */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <AssetBrowser
          assets={[]} // Will be populated with actual assets from Webflow
          onSelectionChange={setSelectedAssets}
          isLoading={isLoading}
        />
      </Box>

      {/* Bottom Bar - Action Buttons and Status */}
      <Box sx={{ 
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        {/* Selection Counter */}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {selectedAssets.length} of {sites.length || 0} Selected
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
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
          <Button
            variant="outlined"
            size="small"
            disabled={selectedAssets.length === 0}
          >
            Save selected with changes
          </Button>
        </Box>
      </Box>

      {/* API Key Configuration Dialog */}
      <Dialog 
        open={showApiKeyDialog} 
        onClose={() => setShowApiKeyDialog(false)}
        PaperProps={{
          sx: { bgcolor: '#1A1A1A' }
        }}
      >
        <DialogTitle>Configure AI Provider</DialogTitle>
        <DialogContent>
          <AiProviderConfig
            onSaveConfig={(provider, apiKey) => {
              // Store the API key securely and close the dialog
              // Implementation will be handled by the parent component
              setShowApiKeyDialog(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Loading and Error States */}
      <LoadingStates isLoading={isLoading} isError={isError} error={error} />
    </Box>
  );
}
