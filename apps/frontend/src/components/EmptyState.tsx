import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Box className="state-panel">
      <Box className="state-icon">{icon}</Box>
      <Stack spacing={0.75} sx={{ alignItems: 'center', maxWidth: 420 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>
      {action}
    </Box>
  );
}
