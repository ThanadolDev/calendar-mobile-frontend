'use client'
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
})

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MuiThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        {children}
      </LocalizationProvider>
    </MuiThemeProvider>
  )
}
