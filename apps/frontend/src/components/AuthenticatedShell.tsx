import CodeIcon from '@mui/icons-material/Code';
import KeyIcon from '@mui/icons-material/Key';
import LinkIcon from '@mui/icons-material/Link';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  AppBar,
  Box,
  Button,
  Container,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../auth';

const PRODUCT_NAME = 'Linkable';

interface AuthenticatedShellProps {
  children: ReactNode;
}

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <Box className="app-shell">
      <AppBar elevation={0} position="sticky" color="inherit">
        <Toolbar className="toolbar">
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box className="brand-mark">
              <LinkIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {PRODUCT_NAME}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              flex: 1,
              justifyContent: { xs: 'flex-end', sm: 'center' },
            }}
          >
            <Button
              color={location.pathname === '/my-links' ? 'primary' : 'inherit'}
              component={RouterLink}
              startIcon={<LinkIcon fontSize="small" />}
              to="/my-links"
            >
              My links
            </Button>
            <Button
              color={location.pathname === '/api-keys' ? 'primary' : 'inherit'}
              component={RouterLink}
              startIcon={<KeyIcon fontSize="small" />}
              to="/api-keys"
            >
              API keys
            </Button>
            <Button
              color={
                location.pathname.startsWith('/developers') ? 'primary' : 'inherit'
              }
              component={RouterLink}
              startIcon={<CodeIcon fontSize="small" />}
              to="/developers"
            >
              Developers
            </Button>
          </Stack>

          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" className="content">
        {children}
      </Container>
    </Box>
  );
}
