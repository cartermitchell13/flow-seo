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
  Stack,
} from '@mui/material';
import { Visibility, VisibilityOff, Delete } from '@mui/icons-material';
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
  const [hasKey, setHasKey] = useState(false);

  // Get authentication state and site info
  const { data: authState, isAuthLoading, exchangeAndVerifyIdToken } = useAuth();
  const { sites } = useSites(authState?.sessionToken || '', true);

  // Check if API key exists for the current provider
  useEffect(() => {
    const checkApiKey = async () => {
      if (!authState?.sessionToken || !sites?.[0]?.id) return;

      try {
        const response = await fetch(`http://localhost:3000/api/api-keys?provider=${provider}`, {
          headers: {
            'Authorization': `Bearer ${authState.sessionToken}`,
          },
        });

        if (response.ok) {
          setHasKey(true);
          setApiKey(''); // Clear input field when key exists
        } else {
          setHasKey(false);
        }
      } catch (err) {
        console.error('Error checking API key:', err);
        setHasKey(false);
      }
    };

    checkApiKey();
  }, [provider, authState?.sessionToken, sites]);

  /**
   * Handles removing the API key for the current provider
   */
  const handleRemoveKey = async () => {
    if (!authState?.sessionToken || !sites?.[0]?.id) {
      setError('Not authenticated. Please log in first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.sessionToken}`,
        },
        body: JSON.stringify({ 
          provider,
          siteId: sites[0].id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove API key');
      }

      setHasKey(false);
      setSuccess(true);
      setApiKey('');

      // Show success message briefly
      setTimeout(() => {
        setSuccess(false);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('API Key Remove Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
          siteId: sites[0].id
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save API key');
      }

      // Clear form and show success
      setApiKey('');
      setSuccess(true);
      setHasKey(true);
      onSaveConfig(provider);
      
      // Show success message for 2.5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2500);
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
          {hasKey ? 'API key saved successfully' : 'API key removed successfully'}
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

        {hasKey ? (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button
                color="error"
                size="small"
                onClick={handleRemoveKey}
                disabled={isLoading}
                startIcon={<Delete />}
              >
                Remove Key
              </Button>
            }
          >
            API key is configured for {provider}
          </Alert>
        ) : (
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
        )}

        {!hasKey && (
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
        )}
      </Box>
    </Paper>
  );
}
