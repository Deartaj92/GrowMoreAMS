"use client";

import { usePathname } from "next/navigation";
import { Box } from "@mui/material";
import { Header } from "./header";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { ProtectedRoute } from "@/components/auth/protected-route";
import NavigationLoader from "@/components/common/NavigationLoader";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <ProtectedRoute>
      <NavigationLoader />
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {!isLoginPage && <Header />}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            backgroundColor: "background.default",
            p: isLoginPage ? 0 : 2,
          }}
        >
          {children}
        </Box>
        {!isLoginPage && <OfflineIndicator />}
      </Box>
    </ProtectedRoute>
  );
}
