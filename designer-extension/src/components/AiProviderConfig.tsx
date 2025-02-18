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
  const [successMessage, setSuccessMessage] = useState('');
  const [hasKey, setHasKey] = useState(false);

  // Get authentication state and site info
  const { data: authState, isAuthLoading } = useAuth();
  const { sites } = useSites(authState?.sessionToken || '', true);

  /**
   * Checks if an API key exists for the current provider
   */
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

  // Handle provider selection
  useEffect(() => {
    if (savedProvider) {
      setProvider(savedProvider as 'openai' | 'anthropic');
    }
  }, [savedProvider]);

  // Check if API key exists for the current provider
  useEffect(() => {
    checkApiKey();
  }, [provider, authState?.sessionToken, sites]);

  // Handle removing API key
  const handleRemoveKey = async () => {
    if (!authState?.sessionToken || !sites?.[0]?.id) {
      setError('Not authenticated. Please log in first.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3000/api/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.sessionToken}`,
        },
        body: JSON.stringify({
          provider,
          siteId: sites[0].id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove API key');
      }

      setApiKey('');
      setHasKey(false);
      setSuccess(true);
      setSuccessMessage('API key removed successfully');
      window.webflow.notify?.({
        type: 'success',
        message: 'API key removed successfully',
      });

      // Close dialog after success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error removing API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove API key');
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

      // Verify the API key was saved by checking it exists
      const verifyResponse = await fetch(`http://localhost:3000/api/api-keys?provider=${provider}`, {
        headers: {
          'Authorization': `Bearer ${authState.sessionToken}`,
        },
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify API key was saved');
      }

      // Clear form and show success
      setApiKey('');
      setSuccess(true);
      setSuccessMessage('API key saved successfully');
      setHasKey(true);
      onSaveConfig(provider);
      
      // Close dialog after success
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('API Key Save Error:', err);
      setHasKey(false);
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
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      role="dialog"
      aria-labelledby="ai-provider-config-title"
      aria-describedby="ai-provider-config-description"
    >
      <Typography id="ai-provider-config-title" variant="h6" component="h2" mb={2}>
        AI Provider Configuration
      </Typography>
      <Typography id="ai-provider-config-description" variant="body2" color="text.secondary" mb={3}>
        Configure your preferred AI provider for generating alt text
      </Typography>

      <Stack spacing={3}>
        <FormControl fullWidth>
          <InputLabel id="provider-select-label">AI Provider</InputLabel>
          <Select
            labelId="provider-select-label"
            id="provider-select"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            aria-label="Select AI Provider"
            label="AI Provider"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.1)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#247BA0',
              },
            }}
          >
            <MenuItem value="openai">OpenAI (GPT-4 Vision)</MenuItem>
            <MenuItem value="anthropic">Anthropic (Claude)</MenuItem>
          </Select>
        </FormControl>

        {hasKey ? (
          <Alert 
            severity="info" 
            action={
              <Button
                color="error"
                size="small"
                onClick={handleRemoveKey}
                disabled={isLoading}
                startIcon={<Delete />}
                sx={{
                  bgcolor: 'var(--redBackground)',
                  color: 'var(--text1)',
                  '&:hover': {
                    bgcolor: 'var(--redBackgroundHover)',
                  },
                }}
              >
                Remove Key
              </Button>
            }
          >
            API key is configured for {provider}
          </Alert>
        ) : (
          <FormControl fullWidth variant="outlined">
            <TextField
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              fullWidth
              aria-label={`${provider} API Key`}
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'api-key-error' : undefined}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                      onClick={() => setShowApiKey(!showApiKey)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiInputBase-input': {
                  bgcolor: 'var(--backgroundInput)',
                  color: 'var(--text1)',
                  '&::placeholder': {
                    color: 'var(--text3)',
                    opacity: 1,
                  },
                },
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'transparent',
                  '& fieldset': {
                    borderColor: 'var(--border1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'var(--border2)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'var(--border3)',
                  },
                },
              }}
            />
          </FormControl>
        )}

        {/* Success Alert */}
        {success && (
          <Alert
            sx={{ mb: 2 }}
            severity="success"
            role="alert"
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            sx={{ mb: 2 }}
            severity="error"
            role="alert"
          >
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={isLoading}
            aria-label="Cancel configuration"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
                bgcolor: 'rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !apiKey}
            aria-label="Save API key configuration"
            sx={{
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
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
