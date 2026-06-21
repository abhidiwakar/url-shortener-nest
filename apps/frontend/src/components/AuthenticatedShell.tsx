import CodeIcon from '@mui/icons-material/Code';
import KeyIcon from '@mui/icons-material/Key';
import LinkIcon from '@mui/icons-material/Link';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../auth';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '../constants/product';

const NAV_ITEMS = [
  { label: 'My links', path: '/my-links', icon: LinkIcon },
  { label: 'API keys', path: '/api-keys', icon: KeyIcon },
  { label: 'Developers', path: '/developers', icon: CodeIcon },
  { label: 'Profile', path: '/profile', icon: PersonIcon },
] as const;

interface AuthenticatedShellProps {
  children: ReactNode;
}

function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const location = useLocation();

  return (
    <List disablePadding sx={{ px: 1.5, py: 1 }}>
      {NAV_ITEMS.map(({ label, path, icon: Icon }) => {
        const isActive =
          path === '/developers'
            ? location.pathname.startsWith('/developers')
            : location.pathname === path;

        return (
          <ListItemButton
            className={isActive ? 'nav-item nav-item-active' : 'nav-item'}
            component={RouterLink}
            key={path}
            onClick={onNavigate}
            to={path}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={label}
              slotProps={{
                primary: { sx: { fontWeight: isActive ? 700 : 600 } },
              }}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getUser();

  function handleLogout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  const sidebar = (
    <Stack className="sidebar-inner" spacing={0}>
      <Stack className="sidebar-brand" direction="row" spacing={1.25}>
        <Box className="brand-mark">
          <LinkIcon fontSize="small" />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {PRODUCT_NAME}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {PRODUCT_TAGLINE}
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ flex: 1, py: 1 }}>
        <SidebarNav onNavigate={isMobile ? () => setMobileOpen(false) : undefined} />
      </Box>

      <Box className="sidebar-footer">
        <Typography
          noWrap
          sx={{ fontSize: '0.875rem', fontWeight: 700, mb: 0.25, px: 0.5 }}
          title={user?.name ?? user?.email ?? undefined}
        >
          {user?.name ?? 'Your profile'}
        </Typography>
        <Typography
          color="text.secondary"
          noWrap
          sx={{ fontSize: '0.8125rem', mb: 1.25, px: 0.5 }}
          title={user?.email}
        >
          {user?.email}
        </Typography>
        <Button
          color="inherit"
          fullWidth
          onClick={handleLogout}
          startIcon={<LogoutIcon fontSize="small" />}
          sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}
        >
          Sign out
        </Button>
      </Box>
    </Stack>
  );

  return (
    <Box className="app-shell">
      {isMobile ? (
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={() => setMobileOpen(false)}
          open={mobileOpen}
          sx={{ '& .MuiDrawer-paper': { width: 280 } }}
        >
          {sidebar}
        </Drawer>
      ) : (
        <Box className="app-sidebar" component="aside">
          {sidebar}
        </Box>
      )}

      <Box className="app-main" component="main">
        {isMobile ? (
          <Stack
            className="mobile-topbar"
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center' }}
          >
            <IconButton
              aria-label="Open navigation"
              edge="start"
              onClick={() => setMobileOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 800 }}>{PRODUCT_NAME}</Typography>
          </Stack>
        ) : null}

        <Box className="app-content">{children}</Box>
      </Box>
    </Box>
  );
}
