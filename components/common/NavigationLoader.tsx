"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { useNavigation } from "@/lib/navigation/navigation-context";
import PageLoader from "./PageLoader";

export default function NavigationLoader() {
  const pathname = usePathname();
  const { isNavigating, endNavigation } = useNavigation();
  const prevPathnameRef = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // When pathname changes and we're navigating, wait for page to be ready
    if (pathname !== prevPathnameRef.current && isNavigating) {
      prevPathnameRef.current = pathname;
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Wait for React to render the new page
      // Use requestAnimationFrame to wait for render cycles
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Additional delay to ensure content is visible
          timeoutRef.current = setTimeout(() => {
            endNavigation();
          }, 500);
        });
      });
    }

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pathname, isNavigating, endNavigation]);

  // Safety: Always end navigation if pathname matches and we're still navigating
  // This prevents getting stuck if the effect doesn't fire
  useEffect(() => {
    if (isNavigating && pathname === prevPathnameRef.current) {
      const safetyTimer = setTimeout(() => {
        endNavigation();
      }, 2000); // Max 2 seconds

      return () => clearTimeout(safetyTimer);
    }
  }, [isNavigating, pathname, endNavigation]);

  if (!isNavigating) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "background.default",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PageLoader message="Loading page..." fullScreen={false} />
    </Box>
  );
}

