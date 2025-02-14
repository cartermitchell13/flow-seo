import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
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
import { Asset } from '../types/types.ts';
import { fetchAssets } from '../api/assets';

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
}

/**
 * Dashboard Component
 * 
 * Main dashboard interface for the Flow SEO app
 */
export function Dashboard({ user }: DashboardProps) {
  // State for managing assets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState<string | null>(null);

  // State for managing selected assets
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  // State for API key configuration dialog
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

  /**
   * Fetch assets when component mounts
   */
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const fetchedAssets = await fetchAssets();
        setAssets(fetchedAssets);
      } catch (error) {
        setAssetError(error instanceof Error ? error.message : 'Failed to fetch assets');
        setAssets([]);
      } finally {
        setIsLoadingAssets(false);
      }
    };

    loadAssets();
  }, []);

  /**
   * Handles asset selection changes
   */
  const handleAssetSelection = (selectedAssetIds: string[]) => {
    setSelectedAssets(selectedAssetIds);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#1A1A1A', color: 'white' }}>
      {/* Top Bar */}
      <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <ButtonGroup variant="contained" size="small">
            <Button>Select 10 w/o alt</Button>
            <Button>Deselect All</Button>
          </ButtonGroup>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Link href="#" color="inherit" underline="hover">
              How to use
            </Link>
            
            <Button
              startIcon={<KeyIcon />}
              variant="contained"
              onClick={() => setIsConfigOpen(true)}
            >
              Configure API Key
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoadingAssets ? (
          <LoadingStates type="assets" />
        ) : assetError ? (
          <Typography color="error" sx={{ p: 2 }}>
            {assetError}
          </Typography>
        ) : (
          <AssetBrowser
            assets={assets}
            onSelectionChange={handleAssetSelection}
            isLoading={isLoadingAssets}
          />
        )}
      </Box>

      {/* API Key Configuration Dialog */}
      <Dialog open={isConfigOpen} onClose={() => setIsConfigOpen(false)}>
        <DialogTitle>Configure AI Provider</DialogTitle>
        <DialogContent>
          <AiProviderConfig 
            onClose={() => setIsConfigOpen(false)} 
            onSaveConfig={(provider) => {
              setSelectedProvider(provider);
              // Removed setIsConfigOpen(false) from here since it's handled by the timeout
            }}
            savedProvider={selectedProvider}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
