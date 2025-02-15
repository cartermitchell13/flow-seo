import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { AutoAwesome as GenerateIcon } from '@mui/icons-material';
import { useAltTextGeneration } from '../hooks/useAltTextGeneration';

interface AltTextGeneratorProps {
  selectedAssets: Array<{
    id: string;
    name: string;
    url: string;
    alt?: string;
  }>;
  onSaveAltText: (assetId: string, altText: string) => Promise<void>;
  selectedProvider: 'openai' | 'anthropic';
}

export function AltTextGenerator({
  selectedAssets,
  onSaveAltText,
  selectedProvider,
}: AltTextGeneratorProps) {
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [editedAltTexts, setEditedAltTexts] = useState<Record<string, string>>({});
  const { generateAltText, error, isGenerating } = useAltTextGeneration();

  const handleGenerate = async (assetId: string, imageUrl: string) => {
    try {
      setGeneratingFor(assetId);
      const generatedAltText = await generateAltText({
        imageUrl,
        provider: selectedProvider,
      });
      setEditedAltTexts(prev => ({
        ...prev,
        [assetId]: generatedAltText
      }));
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to generate alt text:', err);
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleSave = async (assetId: string) => {
    try {
      await onSaveAltText(assetId, editedAltTexts[assetId]);
    } catch (err) {
      console.error('Failed to save alt text:', err);
    }
  };

  const handleEdit = (assetId: string, value: string) => {
    setEditedAltTexts(prev => ({
      ...prev,
      [assetId]: value
    }));
  };

  if (selectedAssets.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Select images to generate alt text
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selectedAssets.map((asset) => (
        <Paper key={asset.id} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img
              src={asset.url}
              alt={asset.alt || asset.name}
              style={{
                width: '100px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '4px',
                marginRight: '16px'
              }}
            />
            <Typography variant="subtitle1" sx={{ flex: 1 }}>
              {asset.name}
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            label="Alt Text"
            value={editedAltTexts[asset.id] || asset.alt || ''}
            onChange={(e) => handleEdit(asset.id, e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={generatingFor === asset.id ? <CircularProgress size={20} /> : <GenerateIcon />}
              onClick={() => handleGenerate(asset.id, asset.url)}
              disabled={generatingFor !== null}
            >
              Generate
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleSave(asset.id)}
              disabled={!editedAltTexts[asset.id] || generatingFor !== null}
            >
              Save
            </Button>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
