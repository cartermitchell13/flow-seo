import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Key as KeyIcon,
  CheckCircleOutline as CheckIcon,
  ImageSearch as ImageIcon,
  AutoAwesome as GenerateIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface HowToUseProps {
  open: boolean;
  onClose: () => void;
}

/**
 * HowToUse Component
 * 
 * Displays a modal with instructions on how to use the Flow-SEO alt text generator.
 * Includes step-by-step guide with icons and clear instructions.
 */
export function HowToUse({ open, onClose }: HowToUseProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="how-to-use-title"
      PaperProps={{
        sx: {
          bgcolor: '#1A1A1A',
          color: 'white',
          backgroundImage: 'none',
          borderRadius: '12px',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        p: 2.5,
      }}>
        <Typography variant="h4" component="h1" id="how-to-use-title" sx={{ 
          fontSize: '1.125rem',
          fontWeight: 500,
          color: 'white',
          letterSpacing: '-0.01em',
        }}>
          How to Use flowSEO Alt Text Generator
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            padding: '6px',
            marginRight: '-6px',
            '&:hover': {
              color: 'white',
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        

        <List sx={{ 
          '& .MuiListItem-root': { 
            px: 0, 
            py: 2,
            '&:not(:last-child)': {
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            },
          },
        }}>
          <ListItem>
            <ListItemIcon sx={{ minWidth: 48, pr: 1 }}>
              <Box sx={{ 
                bgcolor: 'rgba(36, 123, 160, 0.15)', 
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <KeyIcon sx={{ color: '#247BA0', fontSize: '1.25rem' }} />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle2" sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  color: 'white',
                  mb: 0.75,
                  letterSpacing: '-0.01em',
                }}>
                  1. Configure API Key
                </Typography>
              }
              secondary={
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}>
                  Click 'Configure API Key' and enter your OpenAI or Anthropic (Claude) API key. This is required for AI-powered alt text generation.
                </Typography>
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon sx={{ minWidth: 48, pr: 1 }}>
              <Box sx={{ 
                bgcolor: 'rgba(36, 123, 160, 0.15)', 
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ImageIcon sx={{ color: '#247BA0', fontSize: '1.25rem' }} />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle2" sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  color: 'white',
                  mb: 0.75,
                  letterSpacing: '-0.01em',
                }}>
                  2. Select Images
                </Typography>
              }
              secondary={
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}>
                  Choose the images you want to generate alt text for. You can select multiple images at once or use 'Select 10 w/o alt' to quickly find images that need alt text.
                </Typography>
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon sx={{ minWidth: 48, pr: 1 }}>
              <Box sx={{ 
                bgcolor: 'rgba(36, 123, 160, 0.15)', 
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <GenerateIcon sx={{ color: '#247BA0', fontSize: '1.25rem' }} />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle2" sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  color: 'white',
                  mb: 0.75,
                  letterSpacing: '-0.01em',
                }}>
                  3. Generate Alt Text
                </Typography>
              }
              secondary={
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}>
                  Click 'Generate Alt Text' to create descriptive alt text for your selected images. The AI will analyze each image and generate appropriate descriptions.
                </Typography>
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon sx={{ minWidth: 48, pr: 1 }}>
              <Box sx={{ 
                bgcolor: 'rgba(36, 123, 160, 0.15)', 
                borderRadius: '8px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <CheckIcon sx={{ color: '#247BA0', fontSize: '1.25rem' }} />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="subtitle2" sx={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 600,
                  color: 'white',
                  mb: 0.75,
                  letterSpacing: '-0.01em',
                }}>
                  4. Review and Save
                </Typography>
              }
              secondary={
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  letterSpacing: '-0.01em',
                }}>
                  Review the generated alt text for each image. The text will automatically save when you click outside the text field.
                </Typography>
              }
            />
          </ListItem>
        </List>

        <Box sx={{ 
          mt: 2.5, 
          p: 1.5, 
          bgcolor: '#141414',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Typography 
            variant="caption" 
            component="p" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              letterSpacing: '-0.01em',
            }}
          >
            The alt text is limited to 125 characters to ensure compatibility with screen readers and SEO best practices.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        p: 2.5,
      }}>
        <Button 
          onClick={onClose} 
          variant="contained"
          size="small"
          sx={{
            bgcolor: '#247BA0',
            textTransform: 'none',
            fontSize: '0.875rem',
            px: 3,
            py: 0.75,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            '&:hover': {
              bgcolor: '#1D6A8C',
            },
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
