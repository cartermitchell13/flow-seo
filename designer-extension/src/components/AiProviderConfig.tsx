import { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Paper,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

interface AiProviderConfigProps {
  onSaveConfig: (provider: string, apiKey: string) => void;
  savedProvider?: string;
}

export function AiProviderConfig({ onSaveConfig, savedProvider }: AiProviderConfigProps) {
  const [provider, setProvider] = useState(savedProvider || 'openai');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(provider, apiKey);
    setApiKey(''); // Clear the API key from the form
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI Provider Configuration
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>AI Provider</InputLabel>
          <Select
            value={provider}
            label="AI Provider"
            onChange={(e) => setProvider(e.target.value)}
          >
            <MenuItem value="openai">OpenAI (GPT-4 Vision)</MenuItem>
            <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <TextField
            label="API Key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                  >
                    {showApiKey ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={!apiKey || !provider}
        >
          Save Configuration
        </Button>
      </Box>
    </Paper>
  );
}
