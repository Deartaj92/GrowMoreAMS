"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { ThemeProvider as MUIThemeProvider, createTheme, CssBaseline } from "@mui/material";
import type { Theme } from "@mui/material/styles";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeMode must be used within a MUIThemeProviderWrapper");
  }
  return context;
}

export function MUIThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme") as ThemeMode | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const initialMode = savedTheme || (prefersDark ? "dark" : "light");
    setModeState(initialMode);
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("theme", newMode);
  };

  const toggleTheme = () => {
    setMode(mode === "light" ? "dark" : "light");
  };

  // Create MUI theme based on mode
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "light" ? "#3b82f6" : "#9e9e9e",
            light: mode === "light" ? "#60a5fa" : "#bdbdbd",
            dark: mode === "light" ? "#2563eb" : "#757575",
            contrastText: mode === "light" ? "#ffffff" : "#121212",
          },
          secondary: {
            main: mode === "light" ? "#64748b" : "#757575",
            light: mode === "light" ? "#94a3b8" : "#9e9e9e",
            dark: mode === "light" ? "#475569" : "#616161",
          },
          background: {
            default: mode === "light" ? "#ffffff" : "#121212",
            paper: mode === "light" ? "#ffffff" : "#1e1e1e",
          },
          text: {
            primary: mode === "light" ? "#0f172a" : "#ffffff",
            secondary: mode === "light" ? "#64748b" : "#b0b0b0",
          },
        },
        typography: {
          fontFamily: [
            "-apple-system",
            "BlinkMacSystemFont",
            '"Segoe UI"',
            "Roboto",
            '"Helvetica Neue"',
            "Arial",
            "sans-serif",
          ].join(","),
          h1: {
            fontWeight: 700,
            fontSize: "2.5rem",
          },
          h2: {
            fontWeight: 600,
            fontSize: "2rem",
          },
          h3: {
            fontWeight: 600,
            fontSize: "1.75rem",
          },
          h4: {
            fontWeight: 600,
            fontSize: "1.5rem",
          },
          h5: {
            fontWeight: 600,
            fontSize: "1.25rem",
          },
          h6: {
            fontWeight: 600,
            fontSize: "1rem",
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                fontWeight: 500,
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === "light" 
                  ? "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
                  : "0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.4)",
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === "light"
                  ? "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
                  : "0 1px 3px 0 rgba(0, 0, 0, 0.5)",
                backgroundColor: mode === "dark" ? "#1e1e1e" : undefined,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundColor: mode === "dark" ? "#1e1e1e" : undefined,
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode }}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
}

