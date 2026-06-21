import { Box, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        mb: 3,
      }}
    >
      <Box>
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
        {description ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {actions}
        </Stack>
      ) : null}
    </Stack>
  );
}
