import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#2563eb' },
        secondary: { main: '#d9480f' },
        background: { default: '#f4f1ea', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#6ea0ff' },
        secondary: { main: '#ff8a4c' },
        background: { default: '#15171a', paper: '#1f2226' },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-selected, &.Mui-selected:hover': {
            backgroundColor: '#fff',
            color: '#000',
            ...theme.applyStyles('light', { backgroundColor: '#000', color: '#fff' }),
          },
        }),
      },
    },
  },
});
