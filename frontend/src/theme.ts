import { createTheme } from '@mui/material/styles';

const modernLightThemeConfig = {
  palette: {
    mode: 'light' as const,
    primary: {
      main: '#6D28D9',       // Primary Purple
      light: '#EDE9FE',      // Primary Light
      dark: '#5B21B6',       // Primary Hover
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#8B5CF6',       // Secondary Purple
      light: '#F5F3FF',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC',    // Main Background
      paper: '#FFFFFF',      // Card/Paper Background
    },
    text: {
      primary: '#111827',    // Primary Text
      secondary: '#4B5563',  // Secondary Text
      disabled: '#9CA3AF',
    },
    success: {
      main: '#10B981',       // Success Button Background
      light: '#DCFCE7',
      dark: '#166534',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#92400E',
    },
    error: {
      main: '#EF4444',       // Danger Button Background
      light: '#FEE2E2',
      dark: '#991B1B',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#1D4ED8',
    },
    divider: '#E5E7EB',       // Borders
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { color: '#111827', fontWeight: 800 },
    h2: { color: '#111827', fontWeight: 800 },
    h3: { color: '#111827', fontWeight: 800 },
    h4: { color: '#111827', fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { color: '#111827', fontWeight: 800, letterSpacing: '-0.01em' },
    h6: { color: '#111827', fontWeight: 800, letterSpacing: '-0.01em' },
    subtitle1: { color: '#374151', fontWeight: 600 },
    subtitle2: { color: '#374151', fontWeight: 600 },
    body1: { color: '#4B5563', lineHeight: 1.6 },
    body2: { color: '#4B5563', lineHeight: 1.6 },
    caption: { color: '#6B7280', fontWeight: 500 },
    button: { textTransform: 'none' as const, fontWeight: 600 },
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.05)',
    '0 2px 6px rgba(0,0,0,0.05)',
    '0 4px 12px rgba(0,0,0,0.06)', // Card shadow
    '0 6px 16px rgba(0,0,0,0.06)',
    '0 8px 20px rgba(109,40,217,0.15)', // Button shadow
    '0 10px 24px rgba(0,0,0,0.06)',
    '0 12px 32px rgba(0,0,0,0.08)', // Dropdown shadow
    '0 14px 36px rgba(0,0,0,0.08)',
    '0 16px 40px rgba(0,0,0,0.08)',
    '0 18px 44px rgba(0,0,0,0.08)',
    '0 20px 48px rgba(0,0,0,0.08)',
    '0 22px 52px rgba(0,0,0,0.08)',
    '0 24px 56px rgba(0,0,0,0.08)',
    '0 26px 60px rgba(0,0,0,0.08)',
    '0 28px 64px rgba(0,0,0,0.08)',
    '0 30px 68px rgba(0,0,0,0.08)',
    '0 32px 72px rgba(0,0,0,0.08)',
    '0 34px 76px rgba(0,0,0,0.08)',
    '0 36px 80px rgba(0,0,0,0.08)',
    '0 38px 84px rgba(0,0,0,0.08)',
    '0 40px 88px rgba(0,0,0,0.08)',
    '0 42px 92px rgba(0,0,0,0.08)',
    '0 44px 96px rgba(0,0,0,0.08)',
    '0 48px 100px rgba(0,0,0,0.08)',
  ] as any,
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16, // Cards border radius
          border: '1px solid #E5E7EB', // Borders color
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)', // Cards shadow
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Buttons border radius
          textTransform: 'none' as const,
          fontWeight: 600,
          padding: '8px 16px',
        },
        containedPrimary: {
          boxShadow: '0 8px 20px rgba(109,40,217,0.15)', // Contained button shadow
          '&:hover': {
            backgroundColor: '#5B21B6',
            boxShadow: '0 10px 24px rgba(109,40,217,0.25)',
          },
        },
        outlinedPrimary: {
          backgroundColor: '#FFFFFF',
          borderColor: '#D1D5DB',
          color: '#374151',
          '&:hover': {
            backgroundColor: '#F3F4F6',
            borderColor: '#D1D5DB',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10, // Inputs border radius
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D1D5DB',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#9CA3AF',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6D28D9',
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F8FAFC', // Table header background
          '& .MuiTableCell-root': {
            color: '#374151', // Table header text
            fontWeight: 800,
            borderBottom: '1px solid #E5E7EB',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: '#F9FAFB !important', // Row hover color
          },
          '&:nth-of-type(even)': {
            backgroundColor: '#FCFCFD', // Alternate row
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E5E7EB',
          padding: '12px 16px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1F2937', // Dark gray background
          color: '#FFFFFF',
          borderRadius: 8,
          border: '1px solid #374151',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '8px 12px',
          '& .MuiTypography-root': {
            color: '#FFFFFF !important',
          },
        },
        arrow: {
          color: '#1F2937',
        },
      },
    },
  },
};

// We define both light and dark themes using the light config to guarantee a clean light dashboard.
export const lightTheme = createTheme(modernLightThemeConfig);
export const darkTheme = createTheme(modernLightThemeConfig);
