import { createTheme } from '@mui/material';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1769aa',
      dark: '#125a8f',
      light: '#e8f2fa',
    },
    secondary: {
      main: '#2e7d32',
    },
    background: {
      default: '#f4f6f9',
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
      fontSize: '1.75rem',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0,
      textTransform: 'none',
    },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.08em',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f4f6f9',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(23, 105, 170, 0.25)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#64748b',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        },
        body: {
          borderBottom: '1px solid #eef2f6',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: '#f1f5f9',
          padding: 3,
          borderRadius: 10,
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 0,
          borderRadius: '8px !important',
          px: 2,
          py: 0.75,
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-selected': {
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});
