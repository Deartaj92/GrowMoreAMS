"use client";

import { Alert, Snackbar } from "@mui/material";
import { WifiOff } from "@mui/icons-material";
import { useOffline } from "@/hooks/use-offline";

export function OfflineIndicator() {
  const { isOffline } = useOffline();

  return (
    <Snackbar
      open={isOffline}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      sx={{ mb: 2, mr: 2 }}
    >
      <Alert
        icon={<WifiOff />}
        severity="warning"
        variant="filled"
        sx={{
          backgroundColor: "warning.main",
          color: "warning.contrastText",
        }}
      >
        Offline Mode
      </Alert>
    </Snackbar>
  );
}
