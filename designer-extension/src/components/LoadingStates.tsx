import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingStatesProps {
  isLoading: boolean;
  isError: boolean;
  error?: string | null;
}

export function LoadingStates({ isLoading, isError, error }: LoadingStatesProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">
          {error || 'An error occurred. Please try again.'}
        </Typography>
      </Box>
    );
  }

  return null;
}
