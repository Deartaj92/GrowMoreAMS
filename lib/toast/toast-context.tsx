"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Snackbar, Alert, AlertColor, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [currentToast, setCurrentToast] = useState<Toast | null>(null);
  const toastIdRef = React.useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    setCurrentToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", duration: number = 3000) => {
      const id = toastIdRef.current++;
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      // Show the first toast if none is currently showing
      if (!currentToast) {
        setCurrentToast(newToast);
      }

      // Auto-remove after duration
      setTimeout(() => {
        removeToast(id);
        // Show next toast if available
        setToasts((prev) => {
          const remaining = prev.filter((t) => t.id !== id);
          if (remaining.length > 0) {
            setCurrentToast(remaining[0]);
          }
          return remaining;
        });
      }, duration);
    },
    [currentToast, removeToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, "success", duration),
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, "error", duration),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, "info", duration),
    [showToast]
  );

  const showWarning = useCallback(
    (message: string, duration?: number) => showToast(message, "warning", duration),
    [showToast]
  );

  const handleClose = useCallback(() => {
    if (currentToast) {
      removeToast(currentToast.id);
      // Show next toast if available
      setToasts((prev) => {
        const remaining = prev.filter((t) => t.id !== currentToast.id);
        if (remaining.length > 0) {
          setCurrentToast(remaining[0]);
        }
        return remaining;
      });
    }
  }, [currentToast, removeToast]);

  // Update current toast when toasts array changes
  React.useEffect(() => {
    if (!currentToast && toasts.length > 0) {
      setCurrentToast(toasts[0]);
    }
  }, [toasts, currentToast]);

  const getSeverity = (type: ToastType): AlertColor => {
    switch (type) {
      case "success":
        return "success";
      case "error":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "info";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      {currentToast && (
        <Snackbar
          open={true}
          autoHideDuration={currentToast.duration || 3000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            top: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 9999,
          }}
        >
          <Alert
            onClose={handleClose}
            severity={getSeverity(currentToast.type)}
            variant="filled"
            sx={{
              minWidth: { xs: 280, sm: 320 },
              boxShadow: 3,
              "& .MuiAlert-icon": {
                fontSize: { xs: 20, sm: 24 },
              },
              "& .MuiAlert-message": {
                fontSize: { xs: "0.875rem", sm: "0.9375rem" },
                fontWeight: 500,
              },
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={handleClose}
                sx={{ ml: 1 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            {currentToast.message}
          </Alert>
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
};

