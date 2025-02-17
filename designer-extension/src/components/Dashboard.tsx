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
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Key as KeyIcon, AutoAwesome as GenerateIcon } from '@mui/icons-material';
import { LoadingStates } from './LoadingStates.tsx';
import { AssetBrowser } from './AssetBrowser';
import { AiProviderConfig } from './AiProviderConfig';
import { Asset } from '../types/types.ts';
import { fetchAssets, updateAssetAltText } from '../api/assets';
import { useAltTextGeneration } from '../hooks/useAltTextGeneration';

/**
 * Dashboard Component Props
 */
interface DashboardProps {
  user: { firstName: string };
}

export function Dashboard({ user }: DashboardProps) {
  // State for managing assets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState<string | null>(null);

  // State for managing selected assets
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string[]>([]);

  // State for API key configuration
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('openai');

  // Alt text generation hook
  const { generateAltText, error: generationError } = useAltTextGeneration();

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

  const handleAssetSelection = (selectedAssetIds: string[]) => {
    setSelectedAssets(selectedAssetIds);
  };

  const handleGenerateAltText = async () => {
    if (selectedAssets.length === 0) return;

    setGeneratingFor(selectedAssets);

    try {
      // Get selected asset objects
      const assetsToProcess = assets.filter(asset => selectedAssets.includes(asset.id));
      
      // Generate alt text for each asset
      const updatedAssets = [...assets];
      for (const asset of assetsToProcess) {
        try {
          const altText = await generateAltText({
            imageUrl: asset.url,
            provider: selectedProvider
          });

          // Update asset with new alt text in Webflow
          await updateAssetAltText(asset.id, altText);

          // Update local state
          const assetIndex = updatedAssets.findIndex(a => a.id === asset.id);
          if (assetIndex !== -1) {
            updatedAssets[assetIndex] = {
              ...updatedAssets[assetIndex],
              alt: altText
            };
          }
        } catch (error) {
          console.error(`Error processing asset ${asset.id}:`, error);
          // Continue with other assets even if one fails
        }
      }

      setAssets(updatedAssets);
      // Clear selection after successful generation
      setSelectedAssets([]);
    } catch (error) {
      setAssetError(error instanceof Error ? error.message : 'Failed to generate alt text');
    } finally {
      setGeneratingFor([]);
    }
  };

  const isGenerating = generatingFor.length > 0;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#1A1A1A', color: 'white' }}>
      {/* Top Bar */}
      <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ButtonGroup variant="contained" size="small">
              <Button>Select 10 w/o alt</Button>
              <Button>Deselect All</Button>
            </ButtonGroup>

            <Button
              variant="contained"
              color="primary"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <GenerateIcon />}
              onClick={handleGenerateAltText}
              disabled={selectedAssets.length === 0 || isGenerating}
            >
              {isGenerating ? `Generating (${generatingFor.length})...` : `Generate Alt Text (${selectedAssets.length})`}
            </Button>
          </Box>
          
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
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {isLoadingAssets ? (
          <LoadingStates />
        ) : assetError ? (
          <Typography color="error">{assetError}</Typography>
        ) : (
          <AssetBrowser
            assets={assets}
            selectedAssets={selectedAssets}
            onSelectionChange={handleAssetSelection}
          />
        )}
      </Box>

      {/* API Key Configuration Dialog */}
      <Dialog 
        open={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Configure AI Provider</DialogTitle>
        <DialogContent>
          <AiProviderConfig
            onClose={() => setIsConfigOpen(false)}
            onSaveConfig={(provider) => {
              setSelectedProvider(provider as 'openai' | 'anthropic');
              setIsConfigOpen(false);
            }}
            savedProvider={selectedProvider}
          />
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
      {generationError && (
        <Snackbar 
          open={!!generationError} 
          autoHideDuration={6000} 
          onClose={() => setAssetError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" onClose={() => setAssetError(null)}>
            {generationError}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
