import { Box, Divider, Paper, Typography } from '@mui/material';

interface JsonPreviewPanelProps {
  json: string;
}

const JsonPreviewPanel: React.FC<JsonPreviewPanelProps> = ({ json }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2,
      height: '100%',
      maxHeight: { xs: 300, md: '70vh' },
      overflow: 'auto',
      backgroundColor: '#f5f5f5',
      position: { md: 'sticky' },
      top: { md: 0 },
    }}
  >
    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
      JSON Preview (read-only)
    </Typography>
    <Divider sx={{ mb: 1 }} />
    <Box
      component="pre"
      sx={{
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        lineHeight: 1.5,
        color: '#374151',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        m: 0,
      }}
    >
      {json}
    </Box>
  </Paper>
);

export default JsonPreviewPanel;
