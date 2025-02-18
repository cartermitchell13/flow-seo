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
import { HowToUse } from './HowToUse';
import { Asset } from '../types/types.ts';
import { fetchAssets, updateAssetAltText } from '../api/assets';
import { useAltTextGeneration } from '../hooks/useAltTextGeneration';

/**
 * Dashboard Component Props
 */
interface DashboardProps {
  user: { firstName: string };
  sites: any[];
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  onFetchSites: () => void;
}

export function Dashboard({ user, sites, isLoading, isError, error, onFetchSites }: DashboardProps) {
  // State for managing assets
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [assetError, setAssetError] = useState<string | null>(null);

  // State for managing selected assets
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string[]>([]);

  // State for API key configuration
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic'>('anthropic');

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

  /**
   * Handles updates to individual assets (e.g. alt text changes)
   */
  const handleAssetUpdate = (updatedAsset: Asset) => {
    setAssets(prevAssets => {
      const newAssets = [...prevAssets];
      const index = newAssets.findIndex(a => a.id === updatedAsset.id);
      if (index !== -1) {
        newAssets[index] = updatedAsset;
      }
      return newAssets;
    });
  };

  // Select 10 assets without alt text
  const handleSelectWithoutAlt = () => {
    const assetsWithoutAlt = assets
      .filter(asset => !asset.alt)
      .slice(0, 10)
      .map(asset => asset.id);
    setSelectedAssets(assetsWithoutAlt);
  };

  // Deselect all assets
  const handleDeselectAll = () => {
    setSelectedAssets([]);
  };

  const isGenerating = generatingFor.length > 0;

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      bgcolor: '#1A1A1A',
      color: 'white'
    }}>
      {/* Top Bar */}
      <Box sx={{ 
        p: 2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 2,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        {/* Left side */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ButtonGroup size="small">
            <Button
              onClick={handleSelectWithoutAlt}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                minWidth: '120px',
                height: '32px',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              Select 10 w/o alt
            </Button>
            <Button
              onClick={handleDeselectAll}
              sx={{
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                minWidth: '100px',
                height: '32px',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              Deselect All
            </Button>
          </ButtonGroup>

          <Button
            variant="contained"
            disabled={selectedAssets.length === 0 || generatingFor.length > 0}
            startIcon={<GenerateIcon />}
            onClick={handleGenerateAltText}
            sx={{
              height: '32px',
              bgcolor: '#247BA0',
              '&:hover': {
                bgcolor: '#1D6A8C',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(36, 123, 160, 0.4)',
                color: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {generatingFor.length > 0 
              ? `Generating (${generatingFor.length})...`
              : `Generate Alt Text (${selectedAssets.length})`
            }
          </Button>
        </Box>

        {/* Right side */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<KeyIcon />}
            onClick={() => setIsConfigOpen(true)}
            sx={{
              height: '32px',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Configure API Key
          </Button>

          <Link 
            href="#" 
            underline="hover"
            onClick={(e) => {
              e.preventDefault();
              setIsHowToUseOpen(true);
            }}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.875rem',
              textDecoration: 'none',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              '&:hover': {
                color: 'white',
              },
            }}
          >
            How to use
          </Link>
        </Box>
      </Box>

      {/* Main Content - Scrollable Area */}
      <Box sx={{ 
        flex: 1,
        overflow: 'auto',
        p: 2,
        '&::-webkit-scrollbar': {
          width: '8px',
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(255, 255, 255, 0.3)',
          },
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
      }}>
        {isLoadingAssets ? (
          <LoadingStates isLoading={isLoadingAssets} isError={false} />
        ) : assetError ? (
          <Typography color="error">{assetError}</Typography>
        ) : (
          <AssetBrowser
            assets={assets}
            selectedAssets={selectedAssets}
            onSelectionChange={handleAssetSelection}
            onAssetUpdate={handleAssetUpdate}
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
            }}
            savedProvider={selectedProvider}
          />
        </DialogContent>
      </Dialog>

      {/* How to use Dialog */}
      <HowToUse 
        open={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
      />

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
