import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getProfile, updateProfile } from '../api';
import { AuthenticatedShell } from '../components/AuthenticatedShell';
import { PageHeader } from '../components/PageHeader';
import { getToken, saveUser, getUser } from '../auth';
import { PRODUCT_NAME } from '../constants/product';

export function ProfilePage() {
  const token = getToken();
  const cachedUser = getUser();
  const [name, setName] = useState(cachedUser?.name ?? '');
  const [email, setEmail] = useState(cachedUser?.email ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!token) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const profile = await getProfile(token);

        if (mounted) {
          setName(profile.name ?? '');
          setEmail(profile.email);
          saveUser(profile);
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load profile',
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const profile = await updateProfile(token, name);
      setName(profile.name ?? '');
      setEmail(profile.email);
      saveUser(profile);
      setToast('Profile updated');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to update profile',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AuthenticatedShell>
      <PageHeader
        description={`Update how your name appears in ${PRODUCT_NAME}. Your email address cannot be changed.`}
        title="Profile"
      />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      <Paper className="surface-card profile-panel" elevation={0}>
        {isLoading ? (
          <Box className="state-panel">
            <CircularProgress size={28} />
            <Typography color="text.secondary">Loading profile...</Typography>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                autoFocus
                fullWidth
                helperText="This name is shown in your workspace sidebar."
                label="Name"
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
              <TextField
                fullWidth
                helperText="Email is tied to your account and cannot be edited here."
                label="Email"
                slotProps={{ htmlInput: { readOnly: true } }}
                value={email}
              />
              <Box>
                <Button disabled={isSaving} type="submit" variant="contained">
                  {isSaving ? 'Saving...' : 'Save changes'}
                </Button>
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>

      <Snackbar
        autoHideDuration={2600}
        message={toast}
        onClose={() => setToast(null)}
        open={Boolean(toast)}
      />
    </AuthenticatedShell>
  );
}
