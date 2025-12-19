"use client";

import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoader({ message = "Loading...", fullScreen = true }: PageLoaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight: fullScreen ? "60vh" : "200px",
        width: "100%",
        py: 4,
      }}
    >
      <CircularProgress size={40} thickness={4} />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}

