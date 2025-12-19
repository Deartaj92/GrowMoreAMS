"use client";

import { IconButton, Tooltip } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useThemeMode } from "@/components/providers/mui-theme-provider";

export function ThemeToggle() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Tooltip title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}>
      <IconButton
        onClick={toggleTheme}
        aria-label="Toggle theme"
        size="small"
        sx={{
          color: "text.primary",
          p: 0.75,
          "& svg": {
            fontSize: "1.125rem",
          },
        }}
      >
        {mode === "light" ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
}
