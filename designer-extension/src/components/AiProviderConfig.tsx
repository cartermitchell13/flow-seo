import { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useSites } from '../hooks/useSites';

interface AiProviderConfigProps {
  onClose: () => void;
  onSaveConfig: (provider: string) => void;
  savedProvider?: string;
}

/**
 * Component for configuring AI provider settings
 * Handles secure storage of API keys through backend endpoints
 * 
 * Authentication Flow:
 * 1. Gets current site info from Webflow
 * 2. Uses site ID and session token for authentication
 * 3. Securely stores API keys in backend
 */
export function AiProviderConfig({ onClose, onSaveConfig, savedProvider }: AiProviderConfigProps) {
  // State management
  const [provider, setProvider] = useState(savedProvider || 'openai');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get authentication state and site info
  const { data: authState, isAuthLoading, exchangeAndVerifyIdToken } = useAuth();
  const { sites } = useSites(authState?.sessionToken || '', true);

  // Debug authentication state
  console.log('Auth State:', authState);
  console.log('Sites:', sites);

  // Attempt to authenticate if not already authenticated
  useEffect(() => {
    if (!authState?.sessionToken && !isAuthLoading) {
      console.log('No session token, initiating auth...');
      exchangeAndVerifyIdToken();
    }
  }, [authState?.sessionToken, isAuthLoading, exchangeAndVerifyIdToken]);

  /**
   * Securely saves the API key to the backend
   * Uses proper error handling and validation
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authState?.sessionToken) {
      setError('Not authenticated. Please log in first.');
      return;
    }

    if (!sites?.[0]?.id) {
      setError('No site ID available. Please ensure you have access to at least one site.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Send API key to backend endpoint with site ID
      const response = await fetch('http://localhost:3000/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.sessionToken}`,
        },
        body: JSON.stringify({ 
          provider, 
          apiKey,
          siteId: sites[0].id // Include site ID for authentication
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save API key');
      }

      // Clear form and show success
      setApiKey('');
      setSuccess(true);
      onSaveConfig(provider);
      
      // Close the config dialog after showing success message
      setTimeout(() => {
        onClose();
      }, 2500); // Increased to 2.5 seconds for better visibility
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('API Key Save Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <Paper sx={{ p: 3, mb: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!authState?.sessionToken) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Alert severity="warning">
          Please log in to configure AI provider settings.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI Provider Configuration
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          API key saved successfully
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>AI Provider</InputLabel>
          <Select
            value={provider}
            label="AI Provider"
            onChange={(e) => setProvider(e.target.value)}
            disabled={isLoading}
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
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                    disabled={isLoading}
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
          disabled={!apiKey || !provider || isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Save Configuration'
          )}
        </Button>
      </Box>
    </Paper>
  );
}
