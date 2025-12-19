import type { Metadata, Viewport } from "next";
import "./globals.css";
import { MUIThemeProviderWrapper } from "@/components/providers/mui-theme-provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ToastProvider } from "@/lib/toast/toast-context";
import { NavigationProvider } from "@/lib/navigation/navigation-context";
import { MainLayout } from "@/components/layout/main-layout";

export const metadata: Metadata = {
  title: "Grow More AMS - Academy Management System",
  description: "Modern Academy Management System for managing student data",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <MUIThemeProviderWrapper>
          <AuthProvider>
            <ToastProvider>
              <NavigationProvider>
                <MainLayout>{children}</MainLayout>
              </NavigationProvider>
            </ToastProvider>
          </AuthProvider>
        </MUIThemeProviderWrapper>
      </body>
    </html>
  );
}

