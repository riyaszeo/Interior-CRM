import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#6D28D9',
      dark: '#5B21B6',
      light: '#F3E8FF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6',
      light: '#DDD6FE',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#4B5563',
    },
  },
  typography: {
    fontFamily: '"Inter", "sans-serif"',
    h1: {
      fontFamily: '"Playfair Display", "serif"',
      fontWeight: 800,
    },
    h2: {
      fontFamily: '"Playfair Display", "serif"',
      fontWeight: 800,
    },
    h3: {
      fontFamily: '"Playfair Display", "serif"',
      fontWeight: 700,
    },
    h4: {
      fontFamily: '"Playfair Display", "serif"',
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '999px', // elegant capsule buttons
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(109, 40, 217, 0.25)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
          color: '#FFFFFF',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px -2px rgba(109, 40, 217, 0.05), 0 2px 12px -1px rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        },
      },
    },
  },
});
