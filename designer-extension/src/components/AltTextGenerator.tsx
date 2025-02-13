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
} from '@mui/material';
import { AutoAwesome as GenerateIcon } from '@mui/icons-material';

interface AltTextGeneratorProps {
  selectedAssets: Array<{
    id: string;
    name: string;
    url: string;
    alt?: string;
  }>;
  onGenerateAltText: (assetId: string) => Promise<string>;
  onSaveAltText: (assetId: string, altText: string) => Promise<void>;
}

export function AltTextGenerator({
  selectedAssets,
  onGenerateAltText,
  onSaveAltText,
}: AltTextGeneratorProps) {
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [editedAltTexts, setEditedAltTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (assetId: string) => {
    try {
      setGeneratingFor(assetId);
      setError(null);
      const generatedAltText = await onGenerateAltText(assetId);
      setEditedAltTexts(prev => ({
        ...prev,
        [assetId]: generatedAltText
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate alt text');
    } finally {
      setGeneratingFor(null);
    }
  };

  const handleSave = async (assetId: string) => {
    try {
      setError(null);
      await onSaveAltText(assetId, editedAltTexts[assetId]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save alt text');
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
            label="Alt Text"
            value={editedAltTexts[asset.id] || asset.alt || ''}
            onChange={(e) => handleEdit(asset.id, e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={generatingFor === asset.id ? <CircularProgress size={20} /> : <GenerateIcon />}
              onClick={() => handleGenerate(asset.id)}
              disabled={!!generatingFor}
            >
              {generatingFor === asset.id ? 'Generating...' : 'Generate Alt Text'}
            </Button>

            <Button
              variant="outlined"
              onClick={() => handleSave(asset.id)}
              disabled={!editedAltTexts[asset.id] || generatingFor === asset.id}
            >
              Save Changes
            </Button>
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}
