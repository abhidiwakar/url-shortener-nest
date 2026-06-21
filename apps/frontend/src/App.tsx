import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ThemeProvider,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import type { FormEvent, ReactElement } from 'react';
import {
  Link as RouterLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import {
  archiveLink,
  ApiError,
  createLink,
  getLinks,
  getShortUrl,
  login,
  register,
  unarchiveLink,
} from './api';
import type { ShortLink } from './api';
import { getToken, saveAuth } from './auth';
import { AuthenticatedShell } from './components/AuthenticatedShell';
import { BrandMark } from './components/BrandMark';
import { EmptyState } from './components/EmptyState';
import { PageHeader } from './components/PageHeader';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ProfilePage } from './pages/ProfilePage';
import { theme } from './theme';
import { PRODUCT_NAME } from './constants/product';
import {
  buildUrlWithPendingParam,
  clearPendingUrl,
  normalizePendingUrl,
  PENDING_URL_QUERY_PARAM,
} from './lib/pending-url';
import './App.css';

const DevelopersPage = lazy(() =>
  import('./pages/DevelopersPage').then((module) => ({
    default: module.DevelopersPage,
  })),
);

const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
    turnstileScriptPromise?: Promise<void>;
  }
}

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  if (window.turnstileScriptPromise) {
    return window.turnstileScriptPromise;
  }

  window.turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_URL;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load Turnstile'));
    document.head.appendChild(script);
  });

  return window.turnstileScriptPromise;
}

function TurnstileWidget({
  onTokenChange,
}: {
  onTokenChange: (token: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderWidget() {
      if (!TURNSTILE_SITE_KEY) {
        setError('Turnstile site key is not configured.');
        return;
      }

      try {
        await loadTurnstileScript();

        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: 'light',
          callback: (token) => {
            setError(null);
            onTokenChange(token);
          },
          'expired-callback': () => {
            onTokenChange(null);
          },
          'error-callback': () => {
            onTokenChange(null);
            setError('Verification failed. Please retry the challenge.');
          },
        });
      } catch {
        setError('Unable to load human verification.');
      }
    }

    void renderWidget();

    return () => {
      cancelled = true;

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [onTokenChange]);

  return (
    <Stack spacing={1}>
      <Box className="turnstile-box" ref={containerRef} />
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();

  if (!getToken()) {
    return (
      <Navigate
        to={{ pathname: '/login', search: location.search }}
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const location = useLocation();

  if (getToken()) {
    return (
      <Navigate
        to={{ pathname: '/my-links', search: location.search }}
        replace
      />
    );
  }

  return children;
}

function RootRedirect() {
  return <Navigate to={getToken() ? '/my-links' : '/login'} replace />;
}

function AuthLayout({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLogin = mode === 'login';
  const pendingUrl = normalizePendingUrl(searchParams.get(PENDING_URL_QUERY_PARAM) ?? '');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const auth = isLogin
        ? await login(email, password, turnstileToken ?? '')
        : await register(email, password, turnstileToken ?? '');
      saveAuth(auth);
      navigate(
        pendingUrl
          ? buildUrlWithPendingParam('/my-links', pendingUrl)
          : '/my-links',
        { replace: true },
      );
    } catch (caughtError) {
      setTurnstileToken(null);
      setTurnstileResetKey((currentKey) => currentKey + 1);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to complete request',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box className="auth-shell">
      <Box className="auth-showcase">
        <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <BrandMark />
            <Typography sx={{ fontWeight: 800, letterSpacing: '0.06em' }}>
              {PRODUCT_NAME}
            </Typography>
          </Stack>
          <Box>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: '2.5rem' }}>
              Short links you can actually manage
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'rgba(255,255,255,0.82)' }}>
              Create memorable links, track what you have shared, and connect
              external systems with API keys — all from one workspace.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box className="auth-panel-wrap">
        <Paper className="auth-panel" elevation={0}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography variant="h4">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </Typography>
              <Typography color="text.secondary">
                {isLogin
                  ? 'Sign in to manage your links and API keys.'
                  : 'Get started with memorable short links under your account.'}
              </Typography>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}

            {pendingUrl ? (
              <Alert severity="info">
                Please sign in or register to continue
              </Alert>
            ) : null}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.25}>
                <TextField
                  autoComplete="email"
                  autoFocus
                  fullWidth
                  label="Email"
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  value={email}
                />
                <TextField
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  fullWidth
                  helperText="Use at least 6 characters."
                  label="Password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  value={password}
                />
                <TurnstileWidget
                  key={turnstileResetKey}
                  onTokenChange={setTurnstileToken}
                />
                <Button
                  disabled={isSubmitting || !turnstileToken}
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                >
                  {isSubmitting ? 'Working...' : isLogin ? 'Sign in' : 'Create account'}
                </Button>
              </Stack>
            </Box>

            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              {isLogin ? 'No account yet?' : 'Already registered?'}{' '}
              <Button
                component={RouterLink}
                size="small"
                to={{
                  pathname: isLogin ? '/register' : '/login',
                  search: location.search,
                }}
              >
                {isLogin ? 'Create one' : 'Sign in'}
              </Button>
            </Typography>

            <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
              Building an integration?{' '}
              <Button component={RouterLink} size="small" to="/developers">
                View API docs
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

function MyLinksPage() {
  const token = getToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const pendingQueryUrl = searchParams.get(PENDING_URL_QUERY_PARAM);
  const consumedPendingRef = useRef<string | null>(null);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fullUrl, setFullUrl] = useState('');
  const [shortId, setShortId] = useState('');
  const [duplicateLink, setDuplicateLink] = useState<ShortLink | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isArchivedView, setIsArchivedView] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    const authToken = token;
    let mounted = true;

    async function loadLinks() {
      setIsLoading(true);
      setError(null);

      try {
        const nextLinks = await getLinks(authToken, isArchivedView);

        if (mounted) {
          setLinks(nextLinks);
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load links',
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadLinks();

    return () => {
      mounted = false;
    };
  }, [isArchivedView, token]);

  useEffect(() => {
    if (!token || !pendingQueryUrl) {
      return;
    }

    if (consumedPendingRef.current === pendingQueryUrl) {
      return;
    }

    consumedPendingRef.current = pendingQueryUrl;
    clearPendingUrl();
    setSearchParams({}, { replace: true });

    const pendingUrl = normalizePendingUrl(pendingQueryUrl);

    if (!pendingUrl) {
      return;
    }

    setDuplicateLink(null);
    setError(null);
    setFullUrl(pendingUrl);
    setDialogOpen(true);
  }, [pendingQueryUrl, setSearchParams, token]);

  const linkCountLabel = useMemo(() => {
    if (links.length === 1) {
      return isArchivedView ? '1 archived link' : '1 active link';
    }

    return isArchivedView
      ? `${links.length} archived links`
      : `${links.length} active links`;
  }, [isArchivedView, links.length]);

  function openCreateDialog() {
    setDuplicateLink(null);
    setError(null);
    setDialogOpen(true);
  }

  function closeCreateDialog() {
    setDuplicateLink(null);
    setDialogOpen(false);
  }

  async function handleCreateLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsCreating(true);
    setError(null);
    setDuplicateLink(null);

    try {
      const createdLink = await createLink(token, fullUrl, shortId);
      if (!isArchivedView) {
        setLinks((currentLinks) => [createdLink, ...currentLinks]);
      }
      setFullUrl('');
      setShortId('');
      setDialogOpen(false);
      setToast('Short link created');
    } catch (caughtError) {
      if (caughtError instanceof ApiError && caughtError.existingUrl) {
        setDuplicateLink(caughtError.existingUrl);
        return;
      }

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to create link',
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink(link: ShortLink) {
    const shortUrl = getShortUrl(link.shortId);

    await navigator.clipboard.writeText(shortUrl);
    setToast('Copied short link');
  }

  async function handleArchive(link: ShortLink) {
    if (!token) {
      return;
    }

    setError(null);

    try {
      await archiveLink(token, link.shortId);
      setLinks((currentLinks) =>
        currentLinks.filter((currentLink) => currentLink.id !== link.id),
      );
      setToast('Link archived');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to archive link',
      );
    }
  }

  async function handleUnarchive(link: ShortLink) {
    if (!token) {
      return;
    }

    setError(null);

    try {
      await unarchiveLink(token, link.shortId);
      setLinks((currentLinks) =>
        currentLinks.filter((currentLink) => currentLink.id !== link.id),
      );
      setToast('Link restored');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to restore link',
      );
    }
  }

  return (
    <AuthenticatedShell>
      <PageHeader
        actions={
          <>
            <ToggleButtonGroup
              color="primary"
              exclusive
              onChange={(_, value: 'active' | 'archived' | null) => {
                if (value) {
                  setIsArchivedView(value === 'archived');
                }
              }}
              size="small"
              value={isArchivedView ? 'archived' : 'active'}
            >
              <ToggleButton value="active">Active</ToggleButton>
              <ToggleButton value="archived">Archived</ToggleButton>
            </ToggleButtonGroup>
            <Button
              onClick={openCreateDialog}
              size="large"
              startIcon={<AddIcon />}
              variant="contained"
            >
              Create link
            </Button>
          </>
        }
        description={linkCountLabel}
        title="My links"
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper className="surface-card" elevation={0}>
        {isLoading ? (
          <Box className="state-panel">
            <CircularProgress size={28} />
            <Typography color="text.secondary">Loading links...</Typography>
          </Box>
        ) : links.length === 0 ? (
          <EmptyState
            action={
              !isArchivedView ? (
                <Button
                  onClick={openCreateDialog}
                  startIcon={<AddIcon />}
                  variant="contained"
                >
                  Create link
                </Button>
              ) : undefined
            }
            description={
              isArchivedView
                ? 'Archived links will appear here when you move them out of active use.'
                : 'Create your first short link to see it listed here.'
            }
            icon={<LinkIcon />}
            title={
              isArchivedView ? 'No archived links' : 'No shortened links yet'
            }
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Short link</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id} hover>
                    <TableCell>
                      <Typography className="link-short-url">
                        {getShortUrl(link.shortId)}
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {link.shortId}
                      </Typography>
                    </TableCell>
                    <TableCell className="destination-cell">
                      <Typography noWrap>{link.fullUrl}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        aria-label={`Copy ${link.shortId}`}
                        onClick={() => void copyLink(link)}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                      {isArchivedView ? (
                        <IconButton
                          aria-label={`Restore ${link.shortId}`}
                          onClick={() => void handleUnarchive(link)}
                        >
                          <UnarchiveIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          aria-label={`Archive ${link.shortId}`}
                          onClick={() => void handleArchive(link)}
                        >
                          <ArchiveIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={closeCreateDialog}
        open={dialogOpen}
      >
        <Box component="form" onSubmit={handleCreateLink}>
          <DialogTitle>Create a short link</DialogTitle>
          <DialogContent>
            <Stack spacing={2.25} sx={{ pt: 1 }}>
              {duplicateLink ? (
                <Alert
                  action={
                    <Button
                      color="inherit"
                      onClick={() => void copyLink(duplicateLink)}
                      size="small"
                      startIcon={<ContentCopyIcon fontSize="small" />}
                    >
                      Copy
                    </Button>
                  }
                  severity="warning"
                >
                  <Stack spacing={0.5}>
                    <Typography sx={{ fontWeight: 700 }}>
                      This URL has already been shortened.
                    </Typography>
                    <Typography
                      sx={{ overflowWrap: 'anywhere' }}
                      variant="body2"
                    >
                      {getShortUrl(duplicateLink.shortId)}
                    </Typography>
                  </Stack>
                </Alert>
              ) : null}
              <TextField
                autoFocus
                fullWidth
                label="Full URL"
                onChange={(event) => {
                  setDuplicateLink(null);
                  setFullUrl(event.target.value);
                }}
                placeholder="https://example.com/article"
                required
                type="url"
                value={fullUrl}
              />
              <TextField
                fullWidth
                helperText="Optional. Use 3-64 letters, numbers, dashes, or underscores."
                label="Custom short ID"
                onChange={(event) => {
                  setDuplicateLink(null);
                  setShortId(event.target.value);
                }}
                placeholder="launch-notes"
                value={shortId}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeCreateDialog}>Cancel</Button>
            <Button disabled={isCreating} type="submit" variant="contained">
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Snackbar
        autoHideDuration={2600}
        onClose={() => setToast(null)}
        open={Boolean(toast)}
        message={toast}
      />
    </AuthenticatedShell>
  );
}

function NotFoundPage() {
  const isAuthenticated = Boolean(getToken());

  return (
    <Box className="auth-shell">
      <Box className="auth-panel-wrap" sx={{ gridColumn: '1 / -1' }}>
        <Paper className="auth-panel" elevation={0}>
          <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
            <BrandMark />
            <Typography variant="overline" color="text.secondary">
              {PRODUCT_NAME}
            </Typography>
            <Typography variant="h4">Link not found</Typography>
            <Typography color="text.secondary">
              This short link does not exist, has been removed, or is no longer
              active.
            </Typography>
            <Button
              component={RouterLink}
              to={isAuthenticated ? '/my-links' : '/login'}
              variant="contained"
            >
              {isAuthenticated ? 'Back to my links' : 'Go to login'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <AuthLayout mode="login" />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <AuthLayout mode="register" />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/my-links"
          element={
            <ProtectedRoute>
              <MyLinksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/api-keys"
          element={
            <ProtectedRoute>
              <ApiKeysPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/developers"
          element={
            <Suspense
              fallback={
                <Box className="state-panel" sx={{ minHeight: '100svh' }}>
                  <CircularProgress size={28} />
                  <Typography color="text.secondary">
                    Loading developer docs...
                  </Typography>
                </Box>
              }
            >
              <DevelopersPage />
            </Suspense>
          }
        />
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
